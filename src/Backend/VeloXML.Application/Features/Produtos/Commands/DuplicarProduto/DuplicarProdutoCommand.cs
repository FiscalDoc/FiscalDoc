using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.DuplicarProduto;

public record DuplicarProdutoCommand(Guid Id, Guid ClienteId) : IRequest<Result<ProdutoDto>>;
