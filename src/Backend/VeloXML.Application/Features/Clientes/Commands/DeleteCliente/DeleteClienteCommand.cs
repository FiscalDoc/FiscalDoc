using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.DeleteCliente;

public record DeleteClienteCommand(Guid Id) : IRequest<Result>;
