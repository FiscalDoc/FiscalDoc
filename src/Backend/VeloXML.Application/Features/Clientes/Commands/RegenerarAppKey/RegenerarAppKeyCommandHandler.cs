using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.RegenerarAppKey;

public sealed class RegenerarAppKeyCommandHandler(IUnitOfWork uow)
    : IRequestHandler<RegenerarAppKeyCommand, Result<string>>
{
    public async Task<Result<string>> Handle(RegenerarAppKeyCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<string>(ResultError.NotFound("Cliente não encontrado."));

        cliente.AppKey = Guid.NewGuid().ToString("N");
        await uow.SaveChangesAsync(ct);

        return Result.Success(cliente.AppKey);
    }
}
