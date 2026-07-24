using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.CreateCliente;

public record CreateClienteCommand(
    string RazaoSocial,
    string? NomeFantasia,
    string Cnpj,
    string? Email,
    string? Telefone,
    string? Endereco,
    string? Cidade,
    string? Estado,
    Guid? ContadorId = null
) : IRequest<Result<ClienteDto>>;
