using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string Nome,
    string Email,
    string Senha,
    string? NomeFirma,
    string? Telefone
) : IRequest<Result<RegisterResponse>>;

public record RegisterResponse(Guid TenantId, Guid UserId, string Nome, string Email);
