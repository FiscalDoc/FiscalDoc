using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Auth;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.CreateContador;

public sealed class CreateContadorCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
    ITokenService tokenService,
    IEmailService emailService) : IRequestHandler<CreateContadorCommand, Result<CreateContadorResponse>>
{
    public async Task<Result<CreateContadorResponse>> Handle(CreateContadorCommand request, CancellationToken ct)
    {
        var emailEmUso = await uow.Contadores.ExistsAsync(c => c.Email == request.Email, ct)
                      || await uow.Users.ExistsAsync(u => u.Email == request.Email, ct);
        if (emailEmUso)
            return Result.Failure<CreateContadorResponse>(ResultError.Conflict("Contador"));

        var tenantId = currentUser.TenantId!.Value;

        var contador = new Contador
        {
            TenantId = tenantId,
            Nome = request.Nome,
            Email = request.Email,
            Telefone = request.Telefone,
            Crc = request.Crc,
            Empresa = request.Empresa,
            CanalNotificacao = request.CanalNotificacao,
            NotifNovasNotas = request.NotifNovasNotas,
            NotifAlertas = request.NotifAlertas,
            NotifResumoSemanal = request.NotifResumoSemanal,
            NotifConsolidadoMensal = request.NotifConsolidadoMensal,
            CreatedBy = currentUser.Email,
            DataLimiteAcesso = DateTime.UtcNow.AddDays(30)
        };

        await uow.Contadores.AddAsync(contador, ct);

        var user = new User
        {
            TenantId = tenantId,
            Nome = request.Nome,
            Email = request.Email,
            PasswordHash = PrimeiroAcessoHelper.GerarHashInutilizavel(tokenService),
            SenhaDefinida = false,
            Perfil = PerfilEnum.Contador,
            ContadorId = contador.Id,
            CreatedBy = currentUser.Email
        };

        await uow.Users.AddAsync(user, ct);
        var link = await PrimeiroAcessoHelper.CriarTokenAsync(uow, tokenService, user, ct);
        await uow.SaveChangesAsync(ct);

        // CancellationToken.None: o token HTTP é cancelado ao retornar a resposta,
        // então usamos None para o e-mail não ser abortado junto.
        _ = PrimeiroAcessoHelper.EnviarEmailAsync(emailService, request.Nome, request.Email, link, primeiroAcesso: true, CancellationToken.None);

        var dto = new ContadorDto(
            contador.Id, contador.Nome, contador.Email, contador.Telefone, contador.Crc, contador.Empresa,
            contador.Ativo,
            TotalClientes: 0,
            contador.CanalNotificacao,
            contador.StatusLicenca.ToString(),
            contador.MotivoBloqueio,
            contador.DataLimiteAcesso,
            contador.ValorPorCliente, contador.LimiteXmlPorCliente, contador.ValorXmlExcedente,
            FotoUrl: null,
            CobrancaAtual: null,
            Plano: "Starter");

        return Result.Success(new CreateContadorResponse(Contador: dto));
    }
}
