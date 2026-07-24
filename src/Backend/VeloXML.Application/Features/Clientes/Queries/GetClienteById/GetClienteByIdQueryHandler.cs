using AutoMapper;
using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Queries.GetClienteById;

public sealed class GetClienteByIdQueryHandler(IUnitOfWork uow, IMapper mapper)
    : IRequestHandler<GetClienteByIdQuery, Result<ClienteDto>>
{
    public async Task<Result<ClienteDto>> Handle(GetClienteByIdQuery request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.Id, ct);
        return cliente is null
            ? Result.Failure<ClienteDto>(ResultError.NotFound("Cliente"))
            : Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
