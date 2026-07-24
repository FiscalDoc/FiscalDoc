using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Queries.GetClienteById;

public record GetClienteByIdQuery(Guid Id) : IRequest<Result<ClienteDto>>;
