using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.DeleteProduto;

public record DeleteProdutoCommand(Guid Id, Guid ClienteId) : IRequest<Result>;
