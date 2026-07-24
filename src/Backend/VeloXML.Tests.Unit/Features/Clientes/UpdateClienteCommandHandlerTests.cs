using AutoMapper;
using FluentAssertions;
using NSubstitute;
using VeloXML.Application.Common.Mappings;
using VeloXML.Application.Features.Clientes.Commands.UpdateCliente;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Tests.Unit.Features.Clientes;

public sealed class UpdateClienteCommandHandlerTests
{
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IClienteRepository _clientes = Substitute.For<IClienteRepository>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();
    private readonly IMapper _mapper;
    private readonly UpdateClienteCommandHandler _handler;

    public UpdateClienteCommandHandlerTests()
    {
        _uow.Clientes.Returns(_clientes);
        _currentUser.Email.Returns("admin@tenant.com");

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();

        _handler = new UpdateClienteCommandHandler(_uow, _currentUser, _mapper);
    }

    private static UpdateClienteCommand BuildCommand(Guid id) =>
        new(id, "Nova Razão Social", "Novo Fantasia", "novo@email.com",
            "11988880000", "Rua Nova, 10", "Campinas", "SP", true);

    [Fact]
    public async Task Handle_ExistingCliente_UpdatesFieldsAndReturnsDto()
    {
        var existing = new Cliente
        {
            TenantId = Guid.NewGuid(),
            RazaoSocial = "Razão Antiga",
            Cnpj = "12345678000195",
            ContadorId = Guid.NewGuid()
        };
        var clienteId = existing.Id;
        _clientes.GetByIdAsync(clienteId, Arg.Any<CancellationToken>()).Returns(existing);

        var result = await _handler.Handle(BuildCommand(clienteId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.RazaoSocial.Should().Be("Nova Razão Social");
        result.Value.NomeFantasia.Should().Be("Novo Fantasia");
        result.Value.Ativo.Should().BeTrue();

        existing.RazaoSocial.Should().Be("Nova Razão Social");
        existing.UpdatedBy.Should().Be("admin@tenant.com");

        _clientes.Received(1).Update(existing);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ClienteNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _clientes.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Cliente?)null);

        var result = await _handler.Handle(BuildCommand(id), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("CLIENTE_NOT_FOUND");
        await _uow.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
