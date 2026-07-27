using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.UpdateDestinatario;

public record UpdateDestinatarioCommand(
    Guid Id,
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
    string? CodigoIbgeCidade,
    bool Ativo
) : IRequest<Result<DestinatarioDto>>;
