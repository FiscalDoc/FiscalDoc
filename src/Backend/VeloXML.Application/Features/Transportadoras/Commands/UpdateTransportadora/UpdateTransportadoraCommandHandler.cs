using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.UpdateTransportadora;

public sealed class UpdateTransportadoraCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateTransportadoraCommand, Result<TransportadoraDto>>
{
    public async Task<Result<TransportadoraDto>> Handle(UpdateTransportadoraCommand request, CancellationToken ct)
    {
        var transportadora = await uow.Transportadoras.GetByIdAsync(request.Id, ct);
        if (transportadora is null || transportadora.ClienteId != request.ClienteId)
            throw new NotFoundException("Transportadora", request.Id);

        transportadora.RazaoSocial = request.RazaoSocial;
        transportadora.NomeFantasia = request.NomeFantasia;
        transportadora.CpfCnpj = request.CpfCnpj;
        transportadora.InscricaoEstadual = request.InscricaoEstadual;
        transportadora.Email = request.Email;
        transportadora.Telefone = request.Telefone;
        transportadora.Logradouro = request.Logradouro;
        transportadora.Numero = request.Numero;
        transportadora.Complemento = request.Complemento;
        transportadora.Bairro = request.Bairro;
        transportadora.Cidade = request.Cidade;
        transportadora.Estado = request.Estado;
        transportadora.Cep = request.Cep;
        transportadora.CodigoIbgeCidade = request.CodigoIbgeCidade;
        transportadora.Ativo = request.Ativo;

        uow.Transportadoras.Update(transportadora);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreateTransportadoraCommandHandler.ToDto(transportadora));
    }
}
