using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.CriarContaCliente;

public record CriarContaClienteCommand(Guid ClienteId, string Nome, string Email)
    : IRequest<Result<CriarContaClienteResponse>>;

public record CriarContaClienteResponse(Guid UserId, string Email, string Nome);
