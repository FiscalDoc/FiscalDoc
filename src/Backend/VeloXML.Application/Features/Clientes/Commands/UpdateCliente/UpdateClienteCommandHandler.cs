using AutoMapper;
using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.UpdateCliente;

public sealed class UpdateClienteCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
    IMapper mapper) : IRequestHandler<UpdateClienteCommand, Result<ClienteDto>>
{
    public async Task<Result<ClienteDto>> Handle(UpdateClienteCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.Id, ct);
        if (cliente is null)
            return Result.Failure<ClienteDto>(ResultError.NotFound("Cliente"));

        cliente.RazaoSocial = request.RazaoSocial;
        cliente.NomeFantasia = request.NomeFantasia;
        cliente.Email = request.Email;
        cliente.Telefone = request.Telefone;
        cliente.Endereco = request.Endereco;
        cliente.Cidade = request.Cidade;
        cliente.Estado = request.Estado;
        cliente.Ativo = request.Ativo;
        cliente.UpdatedAt = DateTime.UtcNow;
        cliente.UpdatedBy = currentUser.Email;

        uow.Clientes.Update(cliente);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
