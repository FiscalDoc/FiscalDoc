using MediatR;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPreviewImpostos;

public record GetPreviewImpostosQuery(Guid ClienteId, Guid PedidoId) : IRequest<Result<DocumentoImpostosDto>>;
