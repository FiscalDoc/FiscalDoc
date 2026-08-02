using System.Security.Cryptography;
using System.Text.Json;
using AutoMapper;
using MediatR;
using VeloXML.Application.Common;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Commands.UploadDocumento;

public sealed class UploadDocumentoCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
    IStorageService storage,
    IWebhookService webhook,
    IMapper mapper) : IRequestHandler<UploadDocumentoCommand, Result<DocumentoDto>>
{
    private const string BucketName = "documentos";

    public async Task<Result<DocumentoDto>> Handle(UploadDocumentoCommand request, CancellationToken ct)
    {
        // Parse XML metadata primeiro (precisamos do CNPJ do destinatário pra resolver o cliente)
        var isXml = request.Arquivo.ContentType.Contains("xml", StringComparison.OrdinalIgnoreCase)
                 || request.Arquivo.FileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase);

        ParsedDocumento? parsed = null;
        if (isXml)
        {
            request.Arquivo.Content.Position = 0;
            parsed = NfeXmlParser.Parse(request.Arquivo.Content);
            request.Arquivo.Content.Position = 0;
        }

        var cliente = await ResolverClienteAsync(request.ClienteId, parsed, ct);
        if (cliente.IsFailure)
            return Result.Failure<DocumentoDto>(cliente.Error);

        if (!cliente.Value.Ativo)
            return Result.Failure<DocumentoDto>(ResultError.Validation("Cliente", "Não é possível importar notas fiscais para um cliente inativo."));

        var bucket = storage.ResolveBucket(BucketName);
        await storage.EnsureBucketExistsAsync(bucket, ct);

        var hash = await ComputeHashAsync(request.Arquivo.Content, ct);
        request.Arquivo.Content.Position = 0;

        var objectKey = StorageKeyHelper.MontarChaveDocumento(
            cliente.Value.Cnpj, parsed?.DataEmissao ?? DateTime.UtcNow, parsed?.ChaveAcesso);
        await storage.UploadAsync(request.Arquivo.Content, objectKey, bucket, request.Arquivo.ContentType, ct);

        var documento = new Documento
        {
            TenantId         = cliente.Value.TenantId,
            ClienteId        = cliente.Value.Id,
            Tipo             = request.Tipo,
            OrigemImportacao = request.Origem,
            Numero           = Path.GetFileNameWithoutExtension(request.Arquivo.FileName),
            DataEmissao      = DateTime.UtcNow,
            CreatedBy        = currentUser.Email
        };

        if (parsed != null)
        {
            documento.Numero           = parsed.Numero.TrimStart('0').PadLeft(1, '0');
            documento.ChaveAcesso      = parsed.ChaveAcesso;
            documento.CnpjEmitente     = parsed.CnpjEmitente;
            documento.NomeEmitente     = parsed.NomeEmitente;
            documento.CnpjDestinatario = parsed.CnpjDestinatario;
            documento.NomeDestinatario = parsed.NomeDestinatario;
            documento.DataEmissao      = parsed.DataEmissao;
            documento.ValorTotal       = parsed.ValorTotal;

            documento.ValorProdutos       = parsed.ValorProdutos;
            documento.ValorFrete          = parsed.ValorFrete;
            documento.ValorSeguro         = parsed.ValorSeguro;
            documento.ValorDesconto       = parsed.ValorDesconto;
            documento.ValorIcms           = parsed.ValorIcms;
            documento.ValorIpi            = parsed.ValorIpi;
            documento.ValorPis            = parsed.ValorPis;
            documento.ValorCofins         = parsed.ValorCofins;
            documento.ValorOutrasDespesas = parsed.ValorOutrasDespesas;
            documento.ValorAproxTributos  = parsed.ValorAproxTributos;
            if (parsed.Itens is { Count: > 0 })
                documento.ItensJson = JsonSerializer.Serialize(parsed.Itens.Select(i => new DocumentoItemDto(
                    i.CodigoProduto, i.Descricao, i.Ncm, i.Cfop, i.Unidade, i.Quantidade, i.ValorUnitario, i.ValorTotal)));

            documento.DanfeJson = JsonSerializer.Serialize(new DanfeDadosDto(
                parsed.Serie, parsed.NaturezaOperacao, parsed.ProtocoloAutorizacao, parsed.DataAutorizacao,
                parsed.EmitenteIe,
                new DanfeEnderecoDto(parsed.EmitenteLogradouro, parsed.EmitenteNumero, parsed.EmitenteComplemento,
                    parsed.EmitenteBairro, parsed.EmitenteCidade, parsed.EmitenteUf, parsed.EmitenteCep),
                parsed.DestinatarioIe,
                new DanfeEnderecoDto(parsed.DestinatarioLogradouro, parsed.DestinatarioNumero, parsed.DestinatarioComplemento,
                    parsed.DestinatarioBairro, parsed.DestinatarioCidade, parsed.DestinatarioUf, parsed.DestinatarioCep)));

            if (!string.IsNullOrEmpty(parsed.ChaveAcesso))
            {
                var existente = await uow.Documentos.GetByChaveAcessoAsync(parsed.ChaveAcesso, ct);
                if (existente != null)
                {
                    documento.Status     = Domain.Enums.StatusDocumentoEnum.Duplicado;
                    documento.Observacao = $"Duplicata do documento {existente.Id}";
                }
                else
                {
                    documento.Status = Domain.Enums.StatusDocumentoEnum.Valido;
                }
            }
            else
            {
                documento.Status = Domain.Enums.StatusDocumentoEnum.Valido;
            }
        }

        var arquivo = new Arquivo
        {
            TenantId    = cliente.Value.TenantId,
            NomeArquivo = Path.GetFileName(objectKey),
            NomeOriginal = request.Arquivo.FileName,
            Bucket      = bucket,
            ObjectKey   = objectKey,
            MimeType    = request.Arquivo.ContentType,
            Hash        = hash,
            // Sem URL persistida de propósito — uma pre-signed URL expira, e
            // DocumentosController já baixa sempre via Bucket/ObjectKey sob demanda
            // (storage.DownloadAsync), nunca lendo este campo.
            Url         = null,
            Tamanho     = request.Arquivo.Size
        };

        if (parsed != null)
            await AutoRegistrarCadastrosAsync(cliente.Value, parsed, documento, ct);

        await uow.Documentos.AddAsync(documento, ct);
        arquivo.DocumentoId = documento.Id;
        await uow.Arquivos.AddAsync(arquivo, ct);
        await uow.SaveChangesAsync(ct);

        var dto = mapper.Map<DocumentoDto>(documento);
        _ = webhook.NotifyDocumentoAsync(cliente.Value.Id, new
        {
            evento      = "documento.recebido",
            documentoId = documento.Id,
            tipo        = documento.Tipo.ToString(),
            status      = documento.Status.ToString(),
            chaveAcesso = documento.ChaveAcesso,
            numero      = documento.Numero,
            emitente    = documento.NomeEmitente,
            valor       = documento.ValorTotal,
            dataEmissao = documento.DataEmissao
        }, CancellationToken.None);

        return Result.Success(dto);
    }

    private async Task<Result<Cliente>> ResolverClienteAsync(Guid? clienteId, ParsedDocumento? parsed, CancellationToken ct)
    {
        // Usuário logado como Cliente: a importação é sempre pro próprio cliente, ignorando
        // qualquer ClienteId enviado ou CNPJ detectado no XML — não faz sentido esse perfil
        // escolher/mirar outro cliente.
        if (currentUser.ClienteId.HasValue)
        {
            var proprioCliente = await uow.Clientes.GetByIdAsync(currentUser.ClienteId.Value, ct);
            return proprioCliente is null
                ? Result.Failure<Cliente>(ResultError.NotFound("Cliente"))
                : Result.Success(proprioCliente);
        }

        if (clienteId.HasValue)
        {
            var cliente = await uow.Clientes.GetByIdAsync(clienteId.Value, ct);
            return cliente is null
                ? Result.Failure<Cliente>(ResultError.NotFound("Cliente"))
                : Result.Success(cliente);
        }

        var cnpjDestinatario = parsed?.CnpjDestinatario;
        if (string.IsNullOrWhiteSpace(cnpjDestinatario))
            return Result.Failure<Cliente>(ResultError.Validation("ClienteId", "Selecione o cliente para este arquivo."));

        var cnpjLimpo = new string(cnpjDestinatario.Where(char.IsDigit).ToArray());
        var existente = await uow.Clientes.GetByCnpjAsync(cnpjLimpo, ct);
        if (existente != null)
            return Result.Success(existente);

        if (currentUser.ContadorId is null)
            return Result.Failure<Cliente>(ResultError.Validation(
                "ClienteId", "Não foi possível identificar o cliente. Selecione manualmente ou peça para um contador importar."));

        var novoCliente = new Cliente
        {
            TenantId     = currentUser.TenantId!.Value,
            RazaoSocial  = parsed!.NomeDestinatario ?? cnpjLimpo,
            Cnpj         = cnpjLimpo,
            ContadorId   = currentUser.ContadorId.Value,
            CreatedBy    = currentUser.Email
        };
        await uow.Clientes.AddAsync(novoCliente, ct);
        return Result.Success(novoCliente);
    }

    private static async Task<string> ComputeHashAsync(Stream stream, CancellationToken ct)
    {
        var bytes = await SHA256.HashDataAsync(stream, ct);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    // Só cadastra Destinatário/Produto/Pedido quando o Cliente é quem EMITIU a nota — nesse
    // caso o "destinatário" do XML é de fato um cliente do Cliente e os itens são produtos que
    // ele vende (o caso de uso: nota emitida num emissor externo e importada aqui pra
    // registro). Numa nota de COMPRA (Cliente é o destinatário do XML, caso mais comum de
    // importação), o emitente é um fornecedor que este app não modela — cadastrar isso como
    // Destinatario/Produto/Pedido colocaria dado do lado errado, já que esses cadastros
    // existem pra alimentar Pedidos de venda do próprio Cliente.
    private async Task AutoRegistrarCadastrosAsync(Cliente cliente, ParsedDocumento parsed, Documento documento, CancellationToken ct)
    {
        var cnpjEmitenteLimpo = LimparDigitos(parsed.CnpjEmitente);
        var cnpjClienteLimpo = LimparDigitos(cliente.Cnpj);
        if (cnpjEmitenteLimpo is null || cnpjEmitenteLimpo != cnpjClienteLimpo)
            return;

        var cnpjDestLimpo = LimparDigitos(parsed.CnpjDestinatario);
        Destinatario? destinatario = null;
        if (!string.IsNullOrEmpty(cnpjDestLimpo))
        {
            destinatario = (await uow.Destinatarios.FindAsync(
                d => d.ClienteId == cliente.Id && d.CpfCnpj == cnpjDestLimpo, ct)).FirstOrDefault();

            if (destinatario is null)
            {
                destinatario = new Destinatario
                {
                    TenantId          = cliente.TenantId,
                    ClienteId         = cliente.Id,
                    RazaoSocial       = parsed.NomeDestinatario ?? cnpjDestLimpo,
                    CpfCnpj           = cnpjDestLimpo,
                    InscricaoEstadual = parsed.DestinatarioIe,
                    Logradouro        = parsed.DestinatarioLogradouro,
                    Numero            = parsed.DestinatarioNumero,
                    Complemento       = parsed.DestinatarioComplemento,
                    Bairro            = parsed.DestinatarioBairro,
                    Cidade            = parsed.DestinatarioCidade,
                    Estado            = parsed.DestinatarioUf,
                    Cep               = parsed.DestinatarioCep,
                    CodigoIbgeCidade  = parsed.DestinatarioCodIbge,
                };
                await uow.Destinatarios.AddAsync(destinatario, ct);
            }
        }

        var produtosPorCodigo = (await uow.Produtos.FindAsync(p => p.ClienteId == cliente.Id, ct))
            .Where(p => !string.IsNullOrWhiteSpace(p.Codigo))
            .GroupBy(p => p.Codigo, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var pedidoItens = new List<PedidoItem>();
        if (parsed.Itens is { Count: > 0 })
        {
            foreach (var item in parsed.Itens)
            {
                if (string.IsNullOrWhiteSpace(item.CodigoProduto))
                    continue;

                if (!produtosPorCodigo.TryGetValue(item.CodigoProduto, out var produto))
                {
                    produto = new Produto
                    {
                        TenantId      = cliente.TenantId,
                        ClienteId     = cliente.Id,
                        Codigo        = item.CodigoProduto,
                        Descricao     = item.Descricao,
                        Ncm           = item.Ncm,
                        Unidade       = item.Unidade,
                        PrecoUnitario = item.ValorUnitario,
                        Cfop          = item.Cfop,
                        AliquotaIcms  = item.AliquotaIcms,
                        AliquotaPis   = item.AliquotaPis,
                        AliquotaCofins = item.AliquotaCofins,
                    };
                    await uow.Produtos.AddAsync(produto, ct);
                    produtosPorCodigo[item.CodigoProduto] = produto; // evita duplicar se a mesma nota repetir o código
                }

                pedidoItens.Add(new PedidoItem
                {
                    ProdutoId     = produto.Id,
                    Descricao     = item.Descricao,
                    Unidade       = item.Unidade,
                    Quantidade    = item.Quantidade,
                    PrecoUnitario = item.ValorUnitario,
                    ValorTotal    = item.ValorTotal,
                    Cfop          = item.Cfop,
                    Ncm           = item.Ncm,
                    AliquotaIcms  = item.AliquotaIcms,
                    AliquotaPis   = item.AliquotaPis,
                    AliquotaCofins = item.AliquotaCofins,
                });
            }
        }

        // Já nasce "Emitido" (não "Rascunho") — é o mesmo tratamento de VincularDocumentoCommandHandler:
        // como esta é uma NF-e real já emitida externamente e importada de volta, não existe fase
        // de rascunho. Sem destinatário identificado não tem pra quem criar o pedido, então pula.
        // Também pula se o Documento já veio marcado como Duplicado, pra não gerar um segundo
        // Pedido pra mesma nota reimportada.
        if (destinatario is not null && documento.Status != Domain.Enums.StatusDocumentoEnum.Duplicado)
        {
            await uow.Pedidos.AddAsync(new Pedido
            {
                TenantId       = cliente.TenantId,
                ClienteId      = cliente.Id,
                DestinatarioId = destinatario.Id,
                Status         = "Emitido",
                ValorTotal     = documento.ValorTotal,
                DataSaida      = documento.DataEmissao,
                DocumentoId    = documento.Id,
                Itens          = pedidoItens,
            }, ct);
        }
    }

    private static string? LimparDigitos(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : new string(valor.Where(char.IsDigit).ToArray());
}
