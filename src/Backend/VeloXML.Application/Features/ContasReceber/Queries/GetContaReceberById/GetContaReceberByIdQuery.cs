using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Queries.GetContaReceberById;

public record GetContaReceberByIdQuery(Guid Id, Guid ClienteId) : IRequest<Result<ContaReceberDto>>;
