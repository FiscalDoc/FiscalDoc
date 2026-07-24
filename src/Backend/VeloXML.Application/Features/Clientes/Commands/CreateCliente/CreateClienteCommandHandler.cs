using AutoMapper;
using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.CreateCliente;

public sealed class CreateClienteCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
    IMapper mapper) : IRequestHandler<CreateClienteCommand, Result<ClienteDto>>
{
    public async Task<Result<ClienteDto>> Handle(CreateClienteCommand request, CancellationToken ct)
    {
        var cnpjLimpo = new string(request.Cnpj.Where(char.IsDigit).ToArray());
        var exists = await uow.Clientes.GetByCnpjAsync(cnpjLimpo, ct);
        if (exists is not null)
            return Result.Failure<ClienteDto>(ResultError.Conflict("Cliente"));

        var contadorId = currentUser.ContadorId ?? request.ContadorId;
        if (contadorId is null)
            return Result.Failure<ClienteDto>(ResultError.Validation("ContadorId", "Informe o contador responsável."));

        var cliente = new Cliente
        {
            TenantId = currentUser.TenantId!.Value,
            RazaoSocial = request.RazaoSocial,
            NomeFantasia = request.NomeFantasia,
            Cnpj = cnpjLimpo,
            Email = request.Email,
            Telefone = request.Telefone,
            Endereco = request.Endereco,
            Cidade = request.Cidade,
            Estado = request.Estado,
            ContadorId = contadorId.Value,
            CreatedBy = currentUser.Email
        };

        await uow.Clientes.AddAsync(cliente, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
