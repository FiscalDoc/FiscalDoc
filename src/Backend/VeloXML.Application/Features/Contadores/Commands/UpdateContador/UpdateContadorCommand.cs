using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.UpdateContador;

public record UpdateContadorCommand(
    Guid ContadorId,
    string Nome,
    string? Telefone,
    string? Crc,
    string? Empresa,
    string CanalNotificacao,
    bool NotifNovasNotas,
    bool NotifAlertas,
    bool NotifResumoSemanal,
    bool NotifConsolidadoMensal
) : IRequest<Result<ContadorDto>>;
