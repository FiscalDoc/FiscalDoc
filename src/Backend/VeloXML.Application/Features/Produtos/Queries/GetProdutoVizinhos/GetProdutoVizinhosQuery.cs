using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Queries.GetProdutoVizinhos;

public record GetProdutoVizinhosQuery(Guid ClienteId, Guid Id) : IRequest<Result<ProdutoVizinhosDto>>;

public record ProdutoVizinhosDto(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total);
