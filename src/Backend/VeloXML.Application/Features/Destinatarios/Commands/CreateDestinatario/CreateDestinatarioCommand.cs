using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;

public record CreateDestinatarioCommand(
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
) : IRequest<Result<DestinatarioDto>>;
