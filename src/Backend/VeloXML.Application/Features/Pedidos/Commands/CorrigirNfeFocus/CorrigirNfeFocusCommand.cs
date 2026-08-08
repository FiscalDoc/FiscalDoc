using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CorrigirNfeFocus;

public record CorrigirNfeFocusCommand(
    Guid ClienteId,
    Guid PedidoId,
    string Correcao
) : IRequest<Result<CartaCorrecaoDto>>;

// Sequencia é o número de ordem do evento devolvido pela SEFAZ (via Focus) — a nota pode
// acumular até 20 CC-e, sempre prevalecendo a última.
public record CartaCorrecaoDto(int? Sequencia, string? Protocolo, string Correcao, DateTime EnviadaEm);
