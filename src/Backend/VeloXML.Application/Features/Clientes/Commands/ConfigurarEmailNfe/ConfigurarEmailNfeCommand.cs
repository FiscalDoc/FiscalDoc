using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.ConfigurarEmailNfe;

// Gatilho: "Pedido" (dispara sempre que o pedido vira "Emitido") ou "NotaFiscal" (só quando
// existe XML de verdade — Focus NFe ou vinculado manualmente).
public record ConfigurarEmailNfeCommand(Guid ClienteId, bool Habilitado, string Gatilho)
    : IRequest<Result<ClienteDto>>;
