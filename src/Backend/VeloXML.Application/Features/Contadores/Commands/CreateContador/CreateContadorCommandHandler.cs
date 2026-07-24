using System.Security.Cryptography;
using System.Text;
using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.CreateContador;

public sealed class CreateContadorCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
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

        var senhaTemporaria = GerarSenhaTemporaria();

        var user = new User
        {
            TenantId = tenantId,
            Nome = request.Nome,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(senhaTemporaria),
            Perfil = PerfilEnum.Contador,
            ContadorId = contador.Id,
            CreatedBy = currentUser.Email
        };

        await uow.Users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        // CancellationToken.None: o token HTTP é cancelado ao retornar a resposta,
        // então usamos None para o e-mail não ser abortado junto.
        _ = EnviarBoasVindasAsync(request.Nome, request.Email, senhaTemporaria, CancellationToken.None);

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
            CobrancaAtual: null);

        return Result.Success(new CreateContadorResponse(Contador: dto, SenhaTemporaria: senhaTemporaria));
    }

    private async Task EnviarBoasVindasAsync(string nome, string email, string senha, CancellationToken ct)
    {
        try
        {
            var primeiroNome = nome.Split(' ')[0];
            var html = $"""
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0">
                    <tr><td align="center">
                      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

                        <!-- Header -->
                        <tr><td style="background:#0d0f14;padding:28px 36px;text-align:center">
                          <span style="display:inline-flex;align-items:center;gap:10px">
                            <span style="background:#00e5a0;border-radius:7px;padding:6px 10px;font-size:18px">📄</span>
                            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.02em">FiscalDoc</span>
                          </span>
                        </td></tr>

                        <!-- Body -->
                        <tr><td style="padding:36px 36px 28px">
                          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0d0f14">Bem-vindo, {primeiroNome}! 👋</p>
                          <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">
                            Seu acesso ao <strong>FiscalDoc</strong> foi criado. Use as credenciais abaixo para entrar pela primeira vez e cadastrar sua nova senha.
                          </p>

                          <!-- Credentials box -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px">
                            <tr>
                              <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0">
                                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888">E-mail de acesso</span><br>
                                <span style="font-size:15px;font-weight:600;color:#0d0f14">{email}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:16px 20px">
                                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888">Senha temporária</span><br>
                                <span style="font-size:18px;font-weight:800;color:#0d0f14;letter-spacing:0.06em;font-family:monospace">{senha}</span>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:0 0 24px;font-size:13px;color:#e53e3e;background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:12px 16px">
                            ⚠️ <strong>Troque sua senha no primeiro acesso.</strong> Esta senha temporária expira em 48h.
                          </p>

                          <!-- CTA -->
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
                            <tr><td style="background:#00e5a0;border-radius:8px;text-align:center">
                              <a href="http://app.fiscaldoc.com.br/auth/login" style="display:inline-block;padding:14px 32px;color:#0d0f14;font-size:15px;font-weight:700;text-decoration:none">
                                Acessar o FiscalDoc →
                              </a>
                            </td></tr>
                          </table>

                          <p style="margin:0;font-size:13px;color:#888;line-height:1.6">
                            Dúvidas? Responda este e-mail ou entre em contato com o suporte.<br>
                            Período de avaliação gratuito: <strong>30 dias</strong>.
                          </p>
                        </td></tr>

                        <!-- Footer -->
                        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;text-align:center">
                          <p style="margin:0;font-size:12px;color:#aaa">© {DateTime.UtcNow.Year} FiscalDoc · Hub Fiscal para Contadores</p>
                        </td></tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """;

            await emailService.SendAsync(email, "Bem-vindo ao FiscalDoc — suas credenciais de acesso", html, ct);
        }
        catch
        {
            // Falha no e-mail não deve derrubar o cadastro
        }
    }

    private static string GerarSenhaTemporaria()
    {
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower = "abcdefghjkmnpqrstuvwxyz";
        const string digits = "23456789";
        const string special = "@#!";
        const string all = upper + lower + digits + special;

        Span<byte> bytes = stackalloc byte[12];
        RandomNumberGenerator.Fill(bytes);

        var sb = new StringBuilder(12);
        for (var i = 0; i < 12; i++)
            sb.Append(all[bytes[i] % all.Length]);

        // garante pelo menos 1 maiúscula, 1 dígito e 1 especial
        sb[9]  = upper[bytes[9] % upper.Length];
        sb[10] = digits[bytes[10] % digits.Length];
        sb[11] = special[bytes[11] % special.Length];

        return sb.ToString();
    }
}
