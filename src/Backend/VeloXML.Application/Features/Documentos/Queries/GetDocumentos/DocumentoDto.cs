namespace VeloXML.Application.Features.Documentos.Queries.GetDocumentos;

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
    DateTime CreatedAt
);
