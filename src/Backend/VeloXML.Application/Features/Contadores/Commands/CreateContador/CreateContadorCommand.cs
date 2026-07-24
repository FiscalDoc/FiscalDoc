using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.CreateContador;

public record CreateContadorCommand(
    string Nome,
    string Email,
    string? Telefone,
    string? Crc,
    string? Empresa,
    string CanalNotificacao = "ambos",
    bool NotifNovasNotas = true,
    bool NotifAlertas = true,
    bool NotifResumoSemanal = false,
    bool NotifConsolidadoMensal = false
) : IRequest<Result<CreateContadorResponse>>;
