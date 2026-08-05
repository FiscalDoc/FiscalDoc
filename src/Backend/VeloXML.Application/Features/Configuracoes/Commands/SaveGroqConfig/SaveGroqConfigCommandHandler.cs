using MediatR;
using VeloXML.Application.Common;
using VeloXML.Application.Features.Configuracoes.Queries.GetGroqConfig;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveGroqConfig;

public sealed class SaveGroqConfigCommandHandler(IUnitOfWork uow)
    : IRequestHandler<SaveGroqConfigCommand, Result<GroqConfigDto>>
{
    public async Task<Result<GroqConfigDto>> Handle(SaveGroqConfigCommand request, CancellationToken ct)
    {
        if (request.ApiKey is not null)
            await uow.Configuracoes.UpsertAsync(GroqConfigKeys.ApiKey, request.ApiKey, "Chave da API do Groq (assistente de IA)", ct);

        await uow.SaveChangesAsync(ct);

        var config = await uow.Configuracoes.GetByChaveAsync(GroqConfigKeys.ApiKey, ct);
        return Result.Success(new GroqConfigDto(!string.IsNullOrEmpty(config?.Valor)));
    }
}
