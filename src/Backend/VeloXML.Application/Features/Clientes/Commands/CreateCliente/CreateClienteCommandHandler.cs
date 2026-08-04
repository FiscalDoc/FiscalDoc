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

        // Um Administrador pode cadastrar um Cliente sem vincular a nenhum Contador — nesse
        // caso o Cliente fica visível/gerenciável só pelo próprio Administrador. Um Contador
        // logado sempre tem currentUser.ContadorId, então esse caminho nunca fica nulo pra ele.
        var contadorId = currentUser.ContadorId ?? request.ContadorId;

        var cliente = new Cliente
        {
            TenantId = currentUser.TenantId!.Value,
            RazaoSocial = request.RazaoSocial,
            NomeFantasia = request.NomeFantasia,
            Cnpj = cnpjLimpo,
            Email = request.Email,
            Telefone = request.Telefone,
            Endereco = request.Endereco,
            Logradouro = request.Logradouro,
            Numero = request.Numero,
            Complemento = request.Complemento,
            Bairro = request.Bairro,
            Cep = request.Cep,
            CodigoIbgeCidade = request.CodigoIbgeCidade,
            Cidade = request.Cidade,
            Estado = request.Estado,
            ContadorId = contadorId,
            CreatedBy = currentUser.Email
        };

        await uow.Clientes.AddAsync(cliente, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
