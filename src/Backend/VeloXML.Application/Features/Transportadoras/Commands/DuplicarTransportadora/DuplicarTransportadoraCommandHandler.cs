using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.DuplicarTransportadora;

public sealed class DuplicarTransportadoraCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DuplicarTransportadoraCommand, Result<TransportadoraDto>>
{
    public async Task<Result<TransportadoraDto>> Handle(DuplicarTransportadoraCommand request, CancellationToken ct)
    {
        var original = await uow.Transportadoras.GetByIdAsync(request.Id, ct);
        if (original is null || original.ClienteId != request.ClienteId)
            throw new NotFoundException("Transportadora", request.Id);

        // CPF/CNPJ e webhook não são copiados de propósito: documento precisa ser único por
        // trás de cada transportadora, e o webhook é o endpoint real de UMA transportadora —
        // copiar mandaria os eventos da cópia pro sistema da original, por engano.
        var copia = new Transportadora
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
            WebhookAtivo = false,
            WebhookUrl = null,
        };

        await uow.Transportadoras.AddAsync(copia, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreateTransportadoraCommandHandler.ToDto(copia));
    }
}
