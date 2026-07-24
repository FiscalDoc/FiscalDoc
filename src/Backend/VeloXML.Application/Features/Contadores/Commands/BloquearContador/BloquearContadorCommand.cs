using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.BloquearContador;

public record BloquearContadorCommand(Guid ContadorId, string? Motivo) : IRequest<Result<bool>>;
