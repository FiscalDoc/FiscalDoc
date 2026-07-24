using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.AtualizarPlanoContador;

public record AtualizarPlanoContadorCommand(
    Guid ContadorId,
    decimal ValorPorCliente,
    int LimiteXmlPorCliente,
    decimal ValorXmlExcedente
) : IRequest<Result<bool>>;
