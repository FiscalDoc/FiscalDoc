using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.UpdateDestinatario;

public sealed class UpdateDestinatarioCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateDestinatarioCommand, Result<DestinatarioDto>>
{
    public async Task<Result<DestinatarioDto>> Handle(UpdateDestinatarioCommand request, CancellationToken ct)
    {
        var dest = await uow.Destinatarios.GetByIdAsync(request.Id, ct);
        if (dest is null || dest.ClienteId != request.ClienteId)
            throw new NotFoundException("Destinatario", request.Id);

        dest.RazaoSocial = request.RazaoSocial;
        dest.NomeFantasia = request.NomeFantasia;
        dest.CpfCnpj = request.CpfCnpj;
        dest.InscricaoEstadual = request.InscricaoEstadual;
        dest.Email = request.Email;
        dest.Telefone = request.Telefone;
        dest.Logradouro = request.Logradouro;
        dest.Numero = request.Numero;
        dest.Complemento = request.Complemento;
        dest.Bairro = request.Bairro;
        dest.Cidade = request.Cidade;
        dest.Estado = request.Estado;
        dest.Cep = request.Cep;
        dest.CodigoIbgeCidade = request.CodigoIbgeCidade;
        dest.Ativo = request.Ativo;

        uow.Destinatarios.Update(dest);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreateDestinatarioCommandHandler.ToDto(dest));
    }
}
