using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.UpdateContador;

public sealed class UpdateContadorCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateContadorCommand, Result<ContadorDto>>
{
    public async Task<Result<ContadorDto>> Handle(UpdateContadorCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null)
            return Result.Failure<ContadorDto>(ResultError.NotFound("Contador não encontrado."));

        contador.Nome                  = request.Nome;
        contador.Telefone              = request.Telefone;
        contador.Crc                   = request.Crc;
        contador.Empresa               = request.Empresa;
        contador.CanalNotificacao      = request.CanalNotificacao;
        contador.NotifNovasNotas       = request.NotifNovasNotas;
        contador.NotifAlertas          = request.NotifAlertas;
        contador.NotifResumoSemanal    = request.NotifResumoSemanal;
        contador.NotifConsolidadoMensal = request.NotifConsolidadoMensal;

        uow.Contadores.Update(contador);
        await uow.SaveChangesAsync(ct);

        var full = await uow.Contadores.GetWithClientesAsync(contador.Id, ct);
        var cobranca = await uow.Cobrancas.GetCobrancaAtualAsync(contador.Id, ct);
        if (cobranca is not null) cobranca.Contador = contador;

        return Result.Success(new ContadorDto(
            contador.Id, contador.Nome, contador.Email, contador.Telefone, contador.Crc, contador.Empresa,
            contador.Ativo,
            full?.Clientes.Count(c => c.DeletedAt == null) ?? 0,
            contador.CanalNotificacao,
            contador.StatusLicenca.ToString(), contador.MotivoBloqueio, contador.DataLimiteAcesso,
            contador.ValorPorCliente, contador.LimiteXmlPorCliente, contador.ValorXmlExcedente,
            contador.FotoUrl,
            cobranca is null ? null : CobrancaDtoMapper.ToDto(cobranca),
            full?.Tenant?.Plano ?? "Starter"));
    }
}
