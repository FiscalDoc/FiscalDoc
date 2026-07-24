using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.RegenerarAppKey;

public record RegenerarAppKeyCommand(Guid ClienteId) : IRequest<Result<string>>;
