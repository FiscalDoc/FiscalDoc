using MediatR;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.RegistrarCertificadoNfe;

public record RegistrarCertificadoNfeCommand(
    Guid ClienteId,
    FileUploadDto Certificado,
    string Senha,
    string Ambiente
) : IRequest<Result<ClienteDto>>;
