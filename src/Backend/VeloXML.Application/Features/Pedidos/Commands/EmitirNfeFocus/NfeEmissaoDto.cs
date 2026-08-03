namespace VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;

public record NfeEmissaoDto(
    Guid Id,
    string Status,
    string? MensagemErro,
    string? ChaveAcesso,
    string? Numero,
    string? Serie,
    Guid? DocumentoId,
    DateTime CreatedAt
);
