using MediatR;
using VeloXML.Application.Common;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Queries.GetGroqConfig;

public sealed class GetGroqConfigQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetGroqConfigQuery, Result<GroqConfigDto>>
{
    public async Task<Result<GroqConfigDto>> Handle(GetGroqConfigQuery request, CancellationToken ct)
    {
        var config = await uow.Configuracoes.GetByChaveAsync(GroqConfigKeys.ApiKey, ct);
        return Result.Success(new GroqConfigDto(!string.IsNullOrEmpty(config?.Valor)));
    }
}
