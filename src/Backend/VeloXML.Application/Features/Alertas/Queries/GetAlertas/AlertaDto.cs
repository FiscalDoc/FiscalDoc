namespace VeloXML.Application.Features.Alertas.Queries.GetAlertas;

public record AlertaDto(
    Guid Id,
    Guid? DocumentoId,
    Guid? PedidoId,
    Guid ClienteId,
    string NomeCliente,
    string Titulo,
    string Descricao,
    string Tipo,
    string Severidade,
    string Status,
    DateTime CreatedAt,
    DateTime? LidoEm
);
