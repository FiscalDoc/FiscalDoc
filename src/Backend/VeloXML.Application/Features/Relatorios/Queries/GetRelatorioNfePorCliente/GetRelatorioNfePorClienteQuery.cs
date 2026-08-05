using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Relatorios.Queries.GetRelatorioNfePorCliente;

// Só pra Administrador (checado no controller) — sem filtro de cliente de propósito, é
// exatamente o "todos os clientes" que o relatório precisa mostrar.
public record GetRelatorioNfePorClienteQuery(int Mes, int Ano) : IRequest<Result<List<RelatorioNfePorClienteItemDto>>>;

public record RelatorioNfePorClienteItemDto(
    Guid ClienteId,
    string ClienteNome,
    int Quantidade,
    int TotalAutorizadas,
    int TotalCanceladas,
    decimal ValorTotal
);
