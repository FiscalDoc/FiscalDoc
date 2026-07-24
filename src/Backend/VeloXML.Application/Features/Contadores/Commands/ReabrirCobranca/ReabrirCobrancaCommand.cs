using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.ReabrirCobranca;

public record ReabrirCobrancaCommand(Guid CobrancaId) : IRequest<Result<CobrancaDto>>;
