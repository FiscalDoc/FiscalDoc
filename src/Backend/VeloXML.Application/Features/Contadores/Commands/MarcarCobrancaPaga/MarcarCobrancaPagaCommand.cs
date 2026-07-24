using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.MarcarCobrancaPaga;

public record MarcarCobrancaPagaCommand(Guid CobrancaId, string? Observacao) : IRequest<Result<CobrancaDto>>;
