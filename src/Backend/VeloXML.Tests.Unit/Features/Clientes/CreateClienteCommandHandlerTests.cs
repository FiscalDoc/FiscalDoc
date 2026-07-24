using AutoMapper;
using FluentAssertions;
using NSubstitute;
using VeloXML.Application.Common.Mappings;
using VeloXML.Application.Features.Clientes.Commands.CreateCliente;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Tests.Unit.Features.Clientes;

public sealed class CreateClienteCommandHandlerTests
{
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IClienteRepository _clientes = Substitute.For<IClienteRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly IMapper _mapper;
    private readonly CreateClienteCommandHandler _handler;

    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly Guid ContadorId = Guid.NewGuid();

    public CreateClienteCommandHandlerTests()
    {
        _uow.Clientes.Returns(_clientes);
        _currentUser.TenantId.Returns(TenantId);
        _currentUser.Email.Returns("admin@tenant.com");

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();

        _handler = new CreateClienteCommandHandler(_uow, _currentUser, _mapper);
    }

    private static CreateClienteCommand BuildCommand(string cnpj = "12345678000195") =>
        new("Empresa Teste Ltda", "Empresa Teste", cnpj, "email@empresa.com",
            "11999990000", "Rua A, 1", "São Paulo", "SP", ContadorId);

    [Fact]
    public async Task Handle_NewCnpj_CreatesAndReturnsDto()
    {
        _clientes.GetByCnpjAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((Cliente?)null);

        var result = await _handler.Handle(BuildCommand(), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.RazaoSocial.Should().Be("Empresa Teste Ltda");
        result.Value.Cnpj.Should().Be("12345678000195");
        result.Value.ContadorId.Should().Be(ContadorId);

        await _clientes.Received(1).AddAsync(Arg.Is<Cliente>(c =>
            c.RazaoSocial == "Empresa Teste Ltda" &&
            c.TenantId == TenantId), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DuplicateCnpj_ReturnsConflict()
    {
        var existing = new Cliente { Cnpj = "12345678000195" };
        _clientes.GetByCnpjAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(existing);

        var result = await _handler.Handle(BuildCommand(), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("CLIENTE_CONFLICT");
        await _clientes.DidNotReceive().AddAsync(Arg.Any<Cliente>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CnpjWithFormatting_StripsMaskBeforeCheck()
    {
        _clientes.GetByCnpjAsync("12345678000195", Arg.Any<CancellationToken>()).Returns((Cliente?)null);

        var result = await _handler.Handle(BuildCommand("12.345.678/0001-95"), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Cnpj.Should().Be("12345678000195");
    }
}
