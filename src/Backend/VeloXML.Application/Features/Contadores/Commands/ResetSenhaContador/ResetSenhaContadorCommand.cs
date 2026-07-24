using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.ResetSenhaContador;

public record ResetSenhaContadorCommand(Guid ContadorId) : IRequest<Result<string>>;
