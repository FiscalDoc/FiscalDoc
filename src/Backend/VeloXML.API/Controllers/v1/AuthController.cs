using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Auth.Commands.ChangePassword;
using VeloXML.Application.Features.Auth.Commands.Login;
using VeloXML.Application.Features.Auth.Commands.Logout;
using VeloXML.Application.Features.Auth.Commands.RefreshToken;
using VeloXML.Application.Features.Auth.Commands.Register;
using VeloXML.Application.Features.Auth.Commands.Setup2fa;
using VeloXML.Application.Features.Auth.Commands.Verify2fa;
using VeloXML.Application.Features.Auth.Commands.VerifySetup2fa;
using VeloXML.Application.Features.Auth.Queries.GetCurrentUser;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCurrentUserQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("2fa/setup")]
    [Authorize]
    public async Task<IActionResult> Setup2fa(CancellationToken ct)
    {
        var result = await mediator.Send(new Setup2faCommand(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("2fa/verify-setup")]
    [Authorize]
    public async Task<IActionResult> VerifySetup2fa([FromBody] VerifySetup2faRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new VerifySetup2faCommand(body.Code), ct);
        return result.IsSuccess ? Ok(new { message = "2FA ativado com sucesso." }) : BadRequest(result.Error);
    }

    [HttpPost("2fa/verify")]
    public async Task<IActionResult> Verify2fa([FromBody] Verify2faRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new Verify2faCommand(body.TwoFactorToken, body.Code), ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }
}

public record VerifySetup2faRequest(string Code);
public record Verify2faRequest(string TwoFactorToken, string Code);
