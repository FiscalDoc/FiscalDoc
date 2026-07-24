using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.GerarCobrancaMensal;

public record GerarCobrancaMensalCommand(Guid ContadorId, int Mes, int Ano, int DiasVencimento = 10)
    : IRequest<Result<CobrancaDto>>;
