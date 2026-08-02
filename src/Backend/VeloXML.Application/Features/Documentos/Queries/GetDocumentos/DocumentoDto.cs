namespace VeloXML.Application.Features.Documentos.Queries.GetDocumentos;

public record DocumentoItemDto(
    string? CodigoProduto,
    string Descricao,
    string? Ncm,
    string? Cfop,
    string Unidade,
    decimal Quantidade,
    decimal ValorUnitario,
    decimal ValorTotal,
    string? Cst = null,
    decimal? ValorBaseCalculoIcms = null,
    decimal? ValorIcms = null,
    decimal? ValorIpi = null,
    decimal? AliquotaIcms = null,
    decimal? AliquotaIpi = null
);

public record DocumentoImpostosDto(
    decimal? ValorBaseCalculoIcms,
    decimal? ValorProdutos,
    decimal? ValorFrete,
    decimal? ValorSeguro,
    decimal? ValorDesconto,
    decimal? ValorIcms,
    decimal? ValorIpi,
    decimal? ValorPis,
    decimal? ValorCofins,
    decimal? ValorOutrasDespesas,
    decimal? ValorAproxTributos
);

public record DanfeEnderecoDto(
    string? Logradouro,
    string? Numero,
    string? Complemento,
    string? Bairro,
    string? Cidade,
    string? Uf,
    string? Cep,
    string? Fone = null
);

public record DanfeVolumeDto(
    string? Quantidade,
    string? Especie,
    string? Marca,
    string? Numeracao,
    decimal? PesoLiquido,
    decimal? PesoBruto
);

public record DanfeTransportadorDto(
    string? ModalidadeFrete,
    string? Nome,
    string? CnpjCpf,
    string? Municipio,
    string? Uf,
    DanfeVolumeDto? Volume
);

public record DanfeDadosDto(
    string? Serie,
    string? NaturezaOperacao,
    string? ProtocoloAutorizacao,
    DateTime? DataAutorizacao,
    string? InscricaoEstadualEmitente,
    DanfeEnderecoDto? EnderecoEmitente,
    string? InscricaoEstadualDestinatario,
    DanfeEnderecoDto? EnderecoDestinatario,
    string? InformacoesComplementares = null,
    DanfeTransportadorDto? Transportador = null
);

public record DocumentoDto(
    Guid Id,
    Guid ClienteId,
    string NomeCliente,
    string Tipo,
    string TipoNome,
    string Status,
    string StatusNome,
    string OrigemImportacao,
    string OrigemImportacaoNome,
    string Numero,
    string? ChaveAcesso,
    string? CnpjEmitente,
    string? NomeEmitente,
    string? CnpjDestinatario,
    string? NomeDestinatario,
    DateTime DataEmissao,
    decimal ValorTotal,
    int TotalArquivos,
    int TotalAlertas,
    DateTime CreatedAt,
    DocumentoImpostosDto Impostos,
    List<DocumentoItemDto> Itens,
    DanfeDadosDto? Danfe
);
