using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetContadores;

public record GetContadoresQuery(string? Termo, int Page = 1, int PageSize = 20) : IRequest<Result<PagedResult<ContadorDto>>>;
