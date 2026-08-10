using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.DuplicarDestinatario;

public sealed class DuplicarDestinatarioCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DuplicarDestinatarioCommand, Result<DestinatarioDto>>
{
    public async Task<Result<DestinatarioDto>> Handle(DuplicarDestinatarioCommand request, CancellationToken ct)
    {
        var original = await uow.Destinatarios.GetByIdAsync(request.Id, ct);
        if (original is null || original.ClienteId != request.ClienteId)
            throw new NotFoundException("Destinatário", request.Id);

        // CPF/CNPJ não é copiado de propósito — é o dado que precisa ser único de verdade por
        // trás de cada destinatário (duas empresas com o mesmo CNPJ na base é sempre um erro).
        var copia = new Destinatario
        {
            ClienteId = original.ClienteId,
            RazaoSocial = $"{original.RazaoSocial} (cópia)",
            NomeFantasia = original.NomeFantasia,
            CpfCnpj = null,
            InscricaoEstadual = original.InscricaoEstadual,
            Email = original.Email,
            Telefone = original.Telefone,
            Logradouro = original.Logradouro,
            Numero = original.Numero,
            Complemento = original.Complemento,
            Bairro = original.Bairro,
            Cidade = original.Cidade,
            Estado = original.Estado,
            Cep = original.Cep,
            CodigoIbgeCidade = original.CodigoIbgeCidade,
        };

        await uow.Destinatarios.AddAsync(copia, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreateDestinatarioCommandHandler.ToDto(copia));
    }
}
