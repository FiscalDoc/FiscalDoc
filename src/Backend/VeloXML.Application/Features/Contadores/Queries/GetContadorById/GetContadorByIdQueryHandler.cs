using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetContadorById;

public sealed class GetContadorByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetContadorByIdQuery, Result<ContadorDto>>
{
    public async Task<Result<ContadorDto>> Handle(GetContadorByIdQuery request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetWithClientesAsync(request.Id, ct);
        if (contador is null)
            return Result.Failure<ContadorDto>(ResultError.NotFound("Contador"));

        var cobranca = await uow.Cobrancas.GetCobrancaAtualAsync(request.Id, ct);
        if (cobranca is not null) cobranca.Contador = contador;

        return Result.Success(new ContadorDto(
            contador.Id, contador.Nome, contador.Email, contador.Telefone, contador.Crc, contador.Empresa,
            contador.Ativo,
            contador.Clientes.Count(c => c.DeletedAt == null),
            contador.CanalNotificacao,
            contador.StatusLicenca.ToString(),
            contador.MotivoBloqueio,
            contador.DataLimiteAcesso,
            contador.ValorPorCliente, contador.LimiteXmlPorCliente, contador.ValorXmlExcedente,
            contador.FotoUrl,
            cobranca is null ? null : CobrancaDtoMapper.ToDto(cobranca),
            contador.Tenant?.Plano ?? "Starter"));
    }
}
