using AutoMapper;
using FluentAssertions;
using NSubstitute;
using VeloXML.Application.Common.Mappings;
using VeloXML.Application.Features.Contadores.Commands.CreateContador;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Tests.Unit.Features.Contadores;

public sealed class CreateContadorCommandHandlerTests
{
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IContadorRepository _contadores = Substitute.For<IContadorRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly IMapper _mapper;
    private readonly CreateContadorCommandHandler _handler;

    private static readonly Guid TenantId = Guid.NewGuid();

    public CreateContadorCommandHandlerTests()
    {
        _uow.Contadores.Returns(_contadores);
        _currentUser.TenantId.Returns(TenantId);
        _currentUser.Email.Returns("admin@tenant.com");

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();

        _handler = new CreateContadorCommandHandler(_uow, _currentUser, _mapper);
    }

    private static CreateContadorCommand BuildCommand(string email = "contador@escritorio.com") =>
        new("Carlos Contador", email, "11977770000", "CRC-SP-123456", "Escritório Contábil XYZ");

    [Fact]
    public async Task Handle_UniqueEmail_CreatesContadorAndReturnsDto()
    {
        _contadores.ExistsAsync(Arg.Any<System.Linq.Expressions.Expression<Func<Contador, bool>>>(),
            Arg.Any<CancellationToken>()).Returns(false);

        var result = await _handler.Handle(BuildCommand(), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Nome.Should().Be("Carlos Contador");
        result.Value.Email.Should().Be("contador@escritorio.com");

        await _contadores.Received(1).AddAsync(Arg.Is<Contador>(c =>
            c.Nome == "Carlos Contador" &&
            c.TenantId == TenantId), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ReturnsConflict()
    {
        _contadores.ExistsAsync(Arg.Any<System.Linq.Expressions.Expression<Func<Contador, bool>>>(),
            Arg.Any<CancellationToken>()).Returns(true);

        var result = await _handler.Handle(BuildCommand(), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("CONTADOR_CONFLICT");
        await _contadores.DidNotReceive().AddAsync(Arg.Any<Contador>(), Arg.Any<CancellationToken>());
    }
}
