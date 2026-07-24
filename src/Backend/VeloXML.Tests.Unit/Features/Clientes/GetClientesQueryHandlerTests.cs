using AutoMapper;
using FluentAssertions;
using NSubstitute;
using VeloXML.Application.Common.Mappings;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Tests.Unit.Features.Clientes;

public sealed class GetClientesQueryHandlerTests
{
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IClienteRepository _clientes = Substitute.For<IClienteRepository>();
    private readonly IMapper _mapper;
    private readonly GetClientesQueryHandler _handler;

    public GetClientesQueryHandlerTests()
    {
        _uow.Clientes.Returns(_clientes);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();

        _handler = new GetClientesQueryHandler(_uow, _mapper);
    }

    [Fact]
    public async Task Handle_ReturnsPagedDtos()
    {
        var contadorId = Guid.NewGuid();
        var clienteList = new List<Cliente>
        {
            new() { RazaoSocial = "Alfa Ltda", Cnpj = "11111111000111", ContadorId = contadorId },
            new() { RazaoSocial = "Beta SA", Cnpj = "22222222000122", ContadorId = contadorId },
        };
        var paged = PagedResult<Cliente>.Create(clienteList, 2, 1, 20);

        _clientes.SearchAsync(null, contadorId, 1, 20, Arg.Any<CancellationToken>()).Returns(paged);

        var result = await _handler.Handle(new GetClientesQuery(null, contadorId, 1, 20), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(2);
        result.Value.TotalCount.Should().Be(2);
        result.Value.Items[0].RazaoSocial.Should().Be("Alfa Ltda");
        result.Value.Items[1].RazaoSocial.Should().Be("Beta SA");
    }

    [Fact]
    public async Task Handle_EmptyResult_ReturnsEmptyPage()
    {
        var paged = PagedResult<Cliente>.Create([], 0, 1, 20);
        _clientes.SearchAsync(Arg.Any<string?>(), Arg.Any<Guid?>(), 1, 20, Arg.Any<CancellationToken>()).Returns(paged);

        var result = await _handler.Handle(new GetClientesQuery("inexistente", null, 1, 20), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().BeEmpty();
        result.Value.TotalCount.Should().Be(0);
    }
}
