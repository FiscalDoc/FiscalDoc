using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.DeleteContaReceber;

public record DeleteContaReceberCommand(Guid Id, Guid ClienteId) : IRequest<Result>;
