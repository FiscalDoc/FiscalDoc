using MediatR;
using VeloXML.Application.Common.DTOs;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.UploadAvatarClienteUsuario;

public record UploadAvatarClienteUsuarioCommand(Guid ClienteId, Guid Id, FileUploadDto Arquivo) : IRequest<Result<string?>>;
