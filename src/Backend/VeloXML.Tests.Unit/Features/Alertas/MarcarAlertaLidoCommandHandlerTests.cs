using FluentAssertions;
using NSubstitute;
using VeloXML.Application.Features.Alertas.Commands.MarcarAlertaLido;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Tests.Unit.Features.Alertas;

public sealed class MarcarAlertaLidoCommandHandlerTests
{
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IAlertaRepository _alertas = Substitute.For<IAlertaRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly MarcarAlertaLidoCommandHandler _handler;

    public MarcarAlertaLidoCommandHandlerTests()
    {
        _uow.Alertas.Returns(_alertas);
        _currentUser.Email.Returns("usuario@tenant.com");
        _handler = new MarcarAlertaLidoCommandHandler(_uow, _currentUser);
    }

    [Fact]
    public async Task Handle_ExistingAlerta_MarksAsReadAndReturnsSuccess()
    {
        var alerta = new Alerta
        {
            ClienteId = Guid.NewGuid(),
            Titulo = "NF-e próxima do vencimento",
            Status = StatusAlertaEnum.Ativo
        };
        var alertaId = alerta.Id;
        _alertas.GetByIdAsync(alertaId, Arg.Any<CancellationToken>()).Returns(alerta);

        var result = await _handler.Handle(new MarcarAlertaLidoCommand(alertaId), default);

        result.IsSuccess.Should().BeTrue();
        alerta.Status.Should().Be(StatusAlertaEnum.Lido);
        alerta.LidoEm.Should().NotBeNull();
        alerta.LidoPor.Should().Be("usuario@tenant.com");

        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_AlertaNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _alertas.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Alerta?)null);

        var result = await _handler.Handle(new MarcarAlertaLidoCommand(id), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("ALERTA_NOT_FOUND");
        await _uow.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_AlreadyRead_StillMarksAndSaves()
    {
        var alerta = new Alerta
        {
            ClienteId = Guid.NewGuid(),
            Status = StatusAlertaEnum.Lido,
            LidoEm = DateTime.UtcNow.AddHours(-2),
            LidoPor = "outro@tenant.com"
        };
        var alertaId = alerta.Id;
        _alertas.GetByIdAsync(alertaId, Arg.Any<CancellationToken>()).Returns(alerta);

        var result = await _handler.Handle(new MarcarAlertaLidoCommand(alertaId), default);

        result.IsSuccess.Should().BeTrue();
        alerta.LidoPor.Should().Be("usuario@tenant.com");
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
