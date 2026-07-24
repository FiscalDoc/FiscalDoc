using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.Setup2fa;

public record Setup2faCommand : IRequest<Result<Setup2faResponse>>;
public record Setup2faResponse(string Secret, string OtpAuthUri);
