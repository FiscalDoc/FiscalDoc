using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.TestSmtpConfig;

public sealed class TestSmtpConfigCommandHandler(IEmailService emailService, IUnitOfWork uow)
    : IRequestHandler<TestSmtpConfigCommand, Result>
{
    public async Task<Result> Handle(TestSmtpConfigCommand request, CancellationToken ct)
    {
        var senha = request.Password;
        if (string.IsNullOrWhiteSpace(senha))
        {
            var salva = await uow.Configuracoes.GetByChaveAsync("smtp.password", ct);
            senha = salva?.Valor;
        }

        try
        {
            await emailService.TestSmtpAsync(
                request.Host, request.Port, request.From, request.FromName,
                request.Username, senha, request.EnableSsl, request.EmailDestino, ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ResultError.BadRequest($"Falha ao enviar e-mail de teste: {ex.Message}"));
        }
    }
}
