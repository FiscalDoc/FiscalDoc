using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;

public sealed class CreateDestinatarioCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CreateDestinatarioCommand, Result<DestinatarioDto>>
{
    public async Task<Result<DestinatarioDto>> Handle(CreateDestinatarioCommand request, CancellationToken ct)
    {
        var dest = new Destinatario
        {
            ClienteId = request.ClienteId,
            RazaoSocial = request.RazaoSocial,
            NomeFantasia = request.NomeFantasia,
            CpfCnpj = request.CpfCnpj,
            InscricaoEstadual = request.InscricaoEstadual,
            Email = request.Email,
            Telefone = request.Telefone,
            Logradouro = request.Logradouro,
            Numero = request.Numero,
            Complemento = request.Complemento,
            Bairro = request.Bairro,
            Cidade = request.Cidade,
            Estado = request.Estado,
            Cep = request.Cep,
            CodigoIbgeCidade = request.CodigoIbgeCidade,
        };

        await uow.Destinatarios.AddAsync(dest, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(ToDto(dest));
    }

    internal static DestinatarioDto ToDto(Destinatario d) => new(
        d.Id, d.ClienteId, d.RazaoSocial, d.NomeFantasia, d.CpfCnpj,
        d.InscricaoEstadual, d.Email, d.Telefone, d.Logradouro, d.Numero,
        d.Complemento, d.Bairro, d.Cidade, d.Estado, d.Cep,
        d.CodigoIbgeCidade, d.Ativo, d.CreatedAt);
}
