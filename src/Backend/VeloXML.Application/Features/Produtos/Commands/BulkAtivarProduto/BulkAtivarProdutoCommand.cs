using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.BulkAtivarProduto;

public record BulkAtivarProdutoCommand(Guid ClienteId, List<Guid> Ids, bool Ativo) : IRequest<Result>;
