using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.UpdateCliente;

public record UpdateClienteCommand(
    Guid Id,
    string RazaoSocial,
    string? NomeFantasia,
    string? Email,
    string? Telefone,
    string? Endereco,
    string? Cidade,
    string? Estado,
    bool Ativo
) : IRequest<Result<ClienteDto>>;
