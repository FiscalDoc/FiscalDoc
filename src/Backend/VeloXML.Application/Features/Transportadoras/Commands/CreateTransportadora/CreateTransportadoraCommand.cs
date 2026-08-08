using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;

public record CreateTransportadoraCommand(
    Guid ClienteId,
    string RazaoSocial,
    string? NomeFantasia,
    string? CpfCnpj,
    string? InscricaoEstadual,
    string? Email,
    string? Telefone,
    string? Logradouro,
    string? Numero,
    string? Complemento,
    string? Bairro,
    string? Cidade,
    string? Estado,
    string? Cep,
    string? CodigoIbgeCidade
) : IRequest<Result<TransportadoraDto>>;
