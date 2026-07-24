using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.LiberarContador;

public record LiberarContadorCommand(Guid ContadorId) : IRequest<Result<bool>>;
