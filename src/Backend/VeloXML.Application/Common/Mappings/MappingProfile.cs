using System.Text.Json;
using AutoMapper;
using VeloXML.Domain.Entities;
using VeloXML.Application.Features.Auth.Queries.GetCurrentUser;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Application.Features.Alertas.Queries.GetAlertas;

namespace VeloXML.Application.Common.Mappings;

// ConstructUsing is required for positional records in AutoMapper 12 — ForMember
// cannot set init-only properties after construction.
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // UserDto now includes Plano/PlanoExpiracao from Tenant — mapped manually in GetCurrentUserQueryHandler
        CreateMap<User, UserDto>()
            .ConstructUsing((src, _) => new UserDto(
                src.Id, src.Nome, src.Email, src.Perfil.ToString(), src.TenantId, src.Ativo,
                "Starter", null, null));

        // ContadorDto is now mapped manually in the query handler (includes CobrancaAtual join).
        // AutoMapper mapping kept only for single-item queries via GetContadorByIdQueryHandler.

        CreateMap<Cliente, ClienteDto>()
            .ConstructUsing((src, _) => new ClienteDto(
                src.Id, src.RazaoSocial, src.NomeFantasia, src.Cnpj, src.Email,
                src.Telefone, src.Cidade, src.Estado, src.Ativo, src.ContadorId,
                src.Contador?.Nome, src.Documentos.Count, src.AppKey,
                src.WebhookHabilitado, src.WebhookUrl,
                src.ImapHabilitado, src.ImapHost, src.ImapPort, src.ImapEmail))
            .ForMember(d => d.NomeContador, opt => opt.Ignore())
            .ForMember(d => d.TotalDocumentos, opt => opt.Ignore())
            .ForMember(d => d.WebhookHabilitado, opt => opt.Ignore())
            .ForMember(d => d.WebhookUrl, opt => opt.Ignore())
            .ForMember(d => d.ImapHabilitado, opt => opt.Ignore())
            .ForMember(d => d.ImapHost, opt => opt.Ignore())
            .ForMember(d => d.ImapPort, opt => opt.Ignore())
            .ForMember(d => d.ImapEmail, opt => opt.Ignore());

        CreateMap<Documento, DocumentoDto>()
            .ConstructUsing((src, _) => new DocumentoDto(
                src.Id, src.ClienteId,
                src.Cliente?.RazaoSocial ?? string.Empty,
                src.Tipo.ToString(), src.Tipo.ToString(),
                src.Status.ToString(), src.Status.ToString(),
                src.OrigemImportacao.ToString(), src.OrigemImportacao.ToString(),
                src.Numero, src.ChaveAcesso, src.CnpjEmitente, src.NomeEmitente,
                src.CnpjDestinatario, src.NomeDestinatario,
                src.DataEmissao, src.ValorTotal,
                src.Arquivos.Count, src.Alertas.Count, src.CreatedAt,
                new DocumentoImpostosDto(
                    src.ValorBaseCalculoIcms,
                    src.ValorProdutos, src.ValorFrete, src.ValorSeguro, src.ValorDesconto,
                    src.ValorIcms, src.ValorIpi, src.ValorPis, src.ValorCofins,
                    src.ValorOutrasDespesas, src.ValorAproxTributos),
                DeserializarItens(src.ItensJson),
                DeserializarDanfe(src.DanfeJson)))
            .ForMember(d => d.NomeCliente, opt => opt.Ignore())
            .ForMember(d => d.TipoNome, opt => opt.Ignore())
            .ForMember(d => d.StatusNome, opt => opt.Ignore())
            .ForMember(d => d.OrigemImportacaoNome, opt => opt.Ignore())
            .ForMember(d => d.TotalArquivos, opt => opt.Ignore())
            .ForMember(d => d.TotalAlertas, opt => opt.Ignore())
            .ForMember(d => d.Impostos, opt => opt.Ignore())
            .ForMember(d => d.Itens, opt => opt.Ignore())
            .ForMember(d => d.Danfe, opt => opt.Ignore());

        CreateMap<Alerta, AlertaDto>()
            .ConstructUsing((src, _) => new AlertaDto(
                src.Id, src.DocumentoId, src.PedidoId, src.ClienteId,
                src.Cliente?.RazaoSocial ?? string.Empty,
                src.Titulo, src.Descricao, src.Tipo, src.Severidade,
                src.Status.ToString(), src.CreatedAt, src.LidoEm))
            .ForMember(d => d.NomeCliente, opt => opt.Ignore());
    }

    private static List<DocumentoItemDto> DeserializarItens(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<DocumentoItemDto>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static DanfeDadosDto? DeserializarDanfe(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<DanfeDadosDto>(json);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
