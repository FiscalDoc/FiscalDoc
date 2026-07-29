using MediatR;
using VeloXML.Application.Features.Configuracoes.Queries.GetIntervaloImportacao;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveIntervaloImportacao;

public sealed class SaveIntervaloImportacaoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<SaveIntervaloImportacaoCommand, Result<int>>
{
    public async Task<Result<int>> Handle(SaveIntervaloImportacaoCommand request, CancellationToken ct)
    {
        await uow.Configuracoes.UpsertAsync(
            GetIntervaloImportacaoQueryHandler.ChaveConfiguracao,
            request.IntervaloMinutos.ToString(),
            "Intervalo, em minutos, entre execuções do robô de importação de XML por e-mail", ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(request.IntervaloMinutos);
    }
}
