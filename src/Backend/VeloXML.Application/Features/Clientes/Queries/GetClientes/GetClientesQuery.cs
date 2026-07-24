using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Queries.GetClientes;

public record GetClientesQuery(string? Termo, Guid? ContadorId, int Page = 1, int PageSize = 20) : IRequest<Result<PagedResult<ClienteDto>>>;
