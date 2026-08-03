using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidoHistorico;

public record GetPedidoHistoricoQuery(Guid ClienteId, Guid PedidoId) : IRequest<Result<List<PedidoHistoricoDto>>>;

public record PedidoHistoricoDto(Guid Id, string Tipo, string Descricao, string? UsuarioNome, DateTime CreatedAt);
