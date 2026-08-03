using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetNfeEmissao;

public record GetNfeEmissaoQuery(Guid PedidoId, Guid ClienteId) : IRequest<Result<NfeEmissaoDto?>>;
