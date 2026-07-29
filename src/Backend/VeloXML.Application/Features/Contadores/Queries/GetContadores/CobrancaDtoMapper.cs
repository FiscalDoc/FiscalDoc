using VeloXML.Domain.Entities;

namespace VeloXML.Application.Features.Contadores.Queries.GetContadores;

public static class CobrancaDtoMapper
{
    public static CobrancaDto ToDto(Cobranca c) => new(
        c.Id, c.ContadorId, c.ClienteId,
        Tipo: c.ContadorId != null ? "Contador" : "Cliente",
        EntidadeNome: c.Contador?.Nome ?? c.Cliente?.RazaoSocial ?? "—",
        c.Mes, c.Ano,
        c.TotalClientes, c.ValorPorCliente, c.ValorBase,
        c.LimiteXmlTotal, c.XmlsProcessados, c.XmlsExcedentes,
        c.ValorExcedente, c.ValorTotal,
        c.Status.ToString(), c.DataVencimento, c.DataPagamento, c.Observacao);
}
