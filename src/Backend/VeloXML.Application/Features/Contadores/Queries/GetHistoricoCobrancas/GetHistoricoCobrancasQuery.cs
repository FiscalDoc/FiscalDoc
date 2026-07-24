using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetHistoricoCobrancas;

public record GetHistoricoCobrancasQuery(Guid ContadorId) : IRequest<Result<IReadOnlyList<CobrancaDto>>>;
