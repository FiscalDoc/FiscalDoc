using System.Text.Json;
using VeloXML.Application.Features.Documentos.Commands.UploadDocumento;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Application.Features.Documentos.Common;

// Extraído do fluxo de upload manual (UploadDocumentoCommandHandler) pra ser reaproveitado
// por qualquer origem que produza um XML de NFe já parseado — hoje: upload manual/e-mail/API
// e a emissão via Focus NFe (NfeEmissaoFinalizer), que baixa o XML autorizado e aplica os
// mesmos dados no Documento, dando a mesma fidelidade de DANFE/itens/impostos.
internal static class DocumentoParsedMapper
{
    public static async Task AplicarAsync(IUnitOfWork uow, Documento documento, ParsedDocumento parsed, CancellationToken ct)
    {
        documento.Numero           = parsed.Numero.TrimStart('0').PadLeft(1, '0');
        documento.ChaveAcesso      = parsed.ChaveAcesso;
        documento.CnpjEmitente     = parsed.CnpjEmitente;
        documento.NomeEmitente     = parsed.NomeEmitente;
        documento.CnpjDestinatario = parsed.CnpjDestinatario;
        documento.NomeDestinatario = parsed.NomeDestinatario;
        documento.DataEmissao      = parsed.DataEmissao;
        documento.ValorTotal       = parsed.ValorTotal;

        documento.ValorBaseCalculoIcms = parsed.ValorBaseCalculoIcms;
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
                i.CodigoProduto, i.Descricao, i.Ncm, i.Cfop, i.Unidade, i.Quantidade, i.ValorUnitario, i.ValorTotal,
                i.Cst, i.ValorBaseCalculoIcms, i.ValorIcms, i.ValorIpi, i.AliquotaIcms, i.AliquotaIpi)));

        var temTransportador = !string.IsNullOrEmpty(parsed.TransportadorNome) || !string.IsNullOrEmpty(parsed.ModalidadeFrete)
            || !string.IsNullOrEmpty(parsed.VolumeQuantidade);

        documento.DanfeJson = JsonSerializer.Serialize(new DanfeDadosDto(
            parsed.Serie, parsed.NaturezaOperacao, parsed.ProtocoloAutorizacao, parsed.DataAutorizacao,
            parsed.EmitenteIe,
            new DanfeEnderecoDto(parsed.EmitenteLogradouro, parsed.EmitenteNumero, parsed.EmitenteComplemento,
                parsed.EmitenteBairro, parsed.EmitenteCidade, parsed.EmitenteUf, parsed.EmitenteCep, parsed.EmitenteFone),
            parsed.DestinatarioIe,
            new DanfeEnderecoDto(parsed.DestinatarioLogradouro, parsed.DestinatarioNumero, parsed.DestinatarioComplemento,
                parsed.DestinatarioBairro, parsed.DestinatarioCidade, parsed.DestinatarioUf, parsed.DestinatarioCep, parsed.DestinatarioFone),
            parsed.InfCpl,
            temTransportador
                ? new DanfeTransportadorDto(
                    parsed.ModalidadeFrete, parsed.TransportadorNome, parsed.TransportadorCnpjCpf,
                    parsed.TransportadorMunicipio, parsed.TransportadorUf,
                    new DanfeVolumeDto(parsed.VolumeQuantidade, parsed.VolumeEspecie, parsed.VolumeMarca,
                        parsed.VolumeNumeracao, parsed.VolumePesoLiquido, parsed.VolumePesoBruto))
                : null));

        if (!string.IsNullOrEmpty(parsed.ChaveAcesso))
        {
            var existente = await uow.Documentos.GetByChaveAcessoAsync(parsed.ChaveAcesso, documento.ClienteId, ct);
            if (existente != null)
            {
                documento.Status     = StatusDocumentoEnum.Duplicado;
                documento.Observacao = $"Duplicata do documento {existente.Id}";
            }
            else
            {
                documento.Status = StatusDocumentoEnum.Valido;
            }
        }
        else
        {
            documento.Status = StatusDocumentoEnum.Valido;
        }
    }
}
