using AutoMapper;
using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.ConfigurarWebhook;

public sealed class ConfigurarWebhookCommandHandler(IUnitOfWork uow, IMapper mapper)
    : IRequestHandler<ConfigurarWebhookCommand, Result<ClienteDto>>
{
    public async Task<Result<ClienteDto>> Handle(ConfigurarWebhookCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<ClienteDto>(ResultError.NotFound("Cliente não encontrado."));

        cliente.WebhookHabilitado = request.Habilitado;
        cliente.WebhookUrl        = request.Url;

        uow.Clientes.Update(cliente);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
