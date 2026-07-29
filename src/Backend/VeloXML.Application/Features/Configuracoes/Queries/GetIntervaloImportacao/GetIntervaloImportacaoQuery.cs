using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetIntervaloImportacao;

public record GetIntervaloImportacaoQuery : IRequest<Result<int>>;
