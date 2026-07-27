using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Queries.GetProdutoById;

public record GetProdutoByIdQuery(Guid Id, Guid ClienteId) : IRequest<Result<ProdutoDto>>;
