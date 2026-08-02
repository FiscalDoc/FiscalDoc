using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.VincularDocumento;

public record VincularDocumentoCommand(Guid PedidoId, Guid ClienteId, Guid DocumentoId) : IRequest<Result<PedidoDto>>;

public record DesvincularDocumentoCommand(Guid PedidoId, Guid ClienteId) : IRequest<Result<PedidoDto>>;
