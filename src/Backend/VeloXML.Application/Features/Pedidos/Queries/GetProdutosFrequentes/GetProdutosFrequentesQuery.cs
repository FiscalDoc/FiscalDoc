using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetProdutosFrequentes;

public record GetProdutosFrequentesQuery(Guid ClienteId, Guid DestinatarioId) : IRequest<Result<List<ProdutoDto>>>;
