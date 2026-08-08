using AutoMapper;
using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.ConfigurarEmailNfe;

public sealed class ConfigurarEmailNfeCommandHandler(IUnitOfWork uow, IMapper mapper)
    : IRequestHandler<ConfigurarEmailNfeCommand, Result<ClienteDto>>
{
    public async Task<Result<ClienteDto>> Handle(ConfigurarEmailNfeCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<ClienteDto>(ResultError.NotFound("Cliente não encontrado."));

        var gatilho = request.Gatilho is "Pedido" or "NotaFiscal" ? request.Gatilho : "NotaFiscal";

        cliente.EmailNfeDestinatarioHabilitado = request.Habilitado;
        cliente.EmailNfeDestinatarioGatilho    = gatilho;

        uow.Clientes.Update(cliente);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
