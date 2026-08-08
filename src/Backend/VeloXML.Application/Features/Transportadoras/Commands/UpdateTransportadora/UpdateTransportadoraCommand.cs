using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.UpdateTransportadora;

public record UpdateTransportadoraCommand(
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
    bool Ativo,
    bool WebhookAtivo = false,
    string? WebhookUrl = null
) : IRequest<Result<TransportadoraDto>>;
