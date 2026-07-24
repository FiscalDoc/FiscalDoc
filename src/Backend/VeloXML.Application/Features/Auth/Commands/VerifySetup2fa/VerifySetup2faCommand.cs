using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.VerifySetup2fa;

public record VerifySetup2faCommand(string Code) : IRequest<Result<bool>>;
