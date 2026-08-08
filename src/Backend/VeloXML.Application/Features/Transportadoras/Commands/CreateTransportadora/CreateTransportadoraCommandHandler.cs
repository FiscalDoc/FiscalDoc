using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;

public sealed class CreateTransportadoraCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CreateTransportadoraCommand, Result<TransportadoraDto>>
{
    public async Task<Result<TransportadoraDto>> Handle(CreateTransportadoraCommand request, CancellationToken ct)
    {
        var transportadora = new Transportadora
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
            WebhookAtivo = request.WebhookAtivo,
            WebhookUrl = request.WebhookUrl,
        };

        await uow.Transportadoras.AddAsync(transportadora, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(ToDto(transportadora));
    }

    internal static TransportadoraDto ToDto(Transportadora t) => new(
        t.Id, t.ClienteId, t.RazaoSocial, t.NomeFantasia, t.CpfCnpj,
        t.InscricaoEstadual, t.Email, t.Telefone, t.Logradouro, t.Numero,
        t.Complemento, t.Bairro, t.Cidade, t.Estado, t.Cep,
        t.CodigoIbgeCidade, t.Ativo, t.CreatedAt, t.WebhookAtivo, t.WebhookUrl);
}
