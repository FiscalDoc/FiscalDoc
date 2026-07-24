using AutoMapper;
using FluentAssertions;
using NSubstitute;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Common.Mappings;
using VeloXML.Application.Features.Auth.Commands.Login;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Tests.Unit.Features.Auth;

public sealed class LoginCommandHandlerTests
{
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _uow.Users.Returns(_users);
        _handler = new LoginCommandHandler(_uow, _tokenService);
    }

    private static User BuildUser(string password, bool ativo = true) => new()
    {
        TenantId = Guid.NewGuid(),
        Nome = "João Silva",
        Email = "joao@teste.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        Perfil = PerfilEnum.Contador,
        Ativo = ativo
    };

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsTokens()
    {
        var user = BuildUser("Senha@123");
        _users.GetByEmailAsync(user.Email, Arg.Any<CancellationToken>()).Returns(user);
        _users.GetWithRefreshTokensAsync(user.Id, Arg.Any<CancellationToken>()).Returns(user);
        _tokenService.GenerateAccessToken(user).Returns("access-token");
        _tokenService.GenerateRefreshToken().Returns("refresh-token");

        var result = await _handler.Handle(new LoginCommand(user.Email, "Senha@123"), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("access-token");
        result.Value.RefreshToken.Should().Be("refresh-token");
        result.Value.Nome.Should().Be(user.Nome);
        result.Value.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsUnauthorized()
    {
        _users.GetByEmailAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((User?)null);

        var result = await _handler.Handle(new LoginCommand("nao@existe.com", "qualquer"), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("UNAUTHORIZED");
    }

    [Fact]
    public async Task Handle_WrongPassword_ReturnsUnauthorized()
    {
        var user = BuildUser("Senha@123");
        _users.GetByEmailAsync(user.Email, Arg.Any<CancellationToken>()).Returns(user);

        var result = await _handler.Handle(new LoginCommand(user.Email, "SenhaErrada"), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("UNAUTHORIZED");
    }

    [Fact]
    public async Task Handle_InactiveUser_ReturnsUnauthorized()
    {
        var user = BuildUser("Senha@123", ativo: false);
        _users.GetByEmailAsync(user.Email, Arg.Any<CancellationToken>()).Returns(user);

        var result = await _handler.Handle(new LoginCommand(user.Email, "Senha@123"), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Description.Should().Contain("inativo");
    }
}
