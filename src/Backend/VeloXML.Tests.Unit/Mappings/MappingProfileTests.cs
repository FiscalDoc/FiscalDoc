using AutoMapper;
using FluentAssertions;
using VeloXML.Application.Common.Mappings;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;

namespace VeloXML.Tests.Unit.Mappings;

public sealed class MappingProfileTests
{
    private readonly IMapper _mapper;

    public MappingProfileTests()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();
    }

    [Fact]
    public void MappingProfile_ConfigurationIsValid()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        config.AssertConfigurationIsValid();
    }

    [Fact]
    public void Map_ClienteToDto_MapsAllFields()
    {
        var contadorId = Guid.NewGuid();
        var cliente = new Cliente
        {
            TenantId = Guid.NewGuid(),
            RazaoSocial = "Empresa XYZ Ltda",
            NomeFantasia = "XYZ",
            Cnpj = "12345678000195",
            Email = "xyz@empresa.com",
            Telefone = "11999990000",
            Cidade = "São Paulo",
            Estado = "SP",
            Ativo = true,
            ContadorId = contadorId,
            Contador = new Contador { Nome = "João Contador" }
        };

        var dto = _mapper.Map<Application.Features.Clientes.Queries.GetClientes.ClienteDto>(cliente);

        dto.Id.Should().Be(cliente.Id);
        dto.RazaoSocial.Should().Be("Empresa XYZ Ltda");
        dto.NomeFantasia.Should().Be("XYZ");
        dto.Cnpj.Should().Be("12345678000195");
        dto.ContadorId.Should().Be(contadorId);
        dto.NomeContador.Should().Be("João Contador");
        dto.TotalDocumentos.Should().Be(0);
        dto.Ativo.Should().BeTrue();
    }

    [Fact]
    public void Map_AlertaToDto_MapsStatusAsString()
    {
        var alerta = new Alerta
        {
            ClienteId = Guid.NewGuid(),
            Titulo = "Alerta Teste",
            Descricao = "Descrição",
            Tipo = "Vencimento",
            Severidade = "high",
            Status = StatusAlertaEnum.Lido,
            LidoEm = DateTime.UtcNow,
            Cliente = new Cliente { RazaoSocial = "Cliente Teste" }
        };

        var dto = _mapper.Map<Application.Features.Alertas.Queries.GetAlertas.AlertaDto>(alerta);

        dto.Status.Should().Be("Lido");
        dto.NomeCliente.Should().Be("Cliente Teste");
        dto.LidoEm.Should().NotBeNull();
    }
}
