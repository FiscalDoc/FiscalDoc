using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetContadorById;

public record GetContadorByIdQuery(Guid Id) : IRequest<Result<ContadorDto>>;
