using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Auth.Commands.ChangePassword;
using VeloXML.Application.Features.Auth.Commands.ForgotPassword;
using VeloXML.Application.Features.Auth.Commands.Login;
using VeloXML.Application.Features.Auth.Commands.Logout;
using VeloXML.Application.Features.Auth.Commands.RefreshToken;
using VeloXML.Application.Features.Auth.Commands.Register;
using VeloXML.Application.Features.Auth.Commands.ResetPassword;
using VeloXML.Application.Features.Auth.Commands.RestoreAdminContext;
using VeloXML.Application.Features.Auth.Commands.SwitchContext;
using VeloXML.Application.Features.Auth.Queries.GetCurrentUser;
using VeloXML.Application.Features.Auth.Queries.ValidateResetToken;

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

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return Ok();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpGet("reset-password/validar")]
    public async Task<IActionResult> ValidateResetToken([FromQuery] string token, CancellationToken ct)
    {
        var result = await mediator.Send(new ValidateResetTokenQuery(token), ct);
        return Ok(new { valido = result.Value });
    }

    [HttpPost("switch-context")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> SwitchContext([FromBody] SwitchContextCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("restore-admin-context")]
    [Authorize]
    public async Task<IActionResult> RestoreAdminContext(CancellationToken ct)
    {
        var result = await mediator.Send(new RestoreAdminContextCommand(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
