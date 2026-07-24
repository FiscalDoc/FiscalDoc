using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.DeleteCliente;

public sealed class DeleteClienteCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeleteClienteCommand, Result>
{
    public async Task<Result> Handle(DeleteClienteCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.Id, ct);
        if (cliente is null)
            return Result.Failure(ResultError.NotFound("Cliente"));

        uow.Clientes.Remove(cliente);
        await uow.SaveChangesAsync(ct);

        return Result.Success();
    }
}
