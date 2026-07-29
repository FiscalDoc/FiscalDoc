namespace VeloXML.Application.Features.Contadores.Queries.GetContadores;

public record ContadorDto(
    Guid Id,
    string Nome,
    string Email,
    string? Telefone,
    string? Crc,
    string? Empresa,
    bool Ativo,
    int TotalClientes,
    string CanalNotificacao,
    // Licenciamento
    string StatusLicenca,
    string? MotivoBloqueio,
    DateTime? DataLimiteAcesso,
    // Plano
    decimal ValorPorCliente,
    int LimiteXmlPorCliente,
    decimal ValorXmlExcedente,
    string? FotoUrl,
    // Cobrança do mês corrente (pode ser null se não gerada ainda)
    CobrancaDto? CobrancaAtual,
    // Plano do tenant (Trial, Starter, etc.)
    string Plano
);

public record CobrancaDto(
    Guid Id,
    Guid? ContadorId,
    Guid? ClienteId,
    string Tipo,
    string EntidadeNome,
    int Mes,
    int Ano,
    int TotalClientes,
    decimal ValorPorCliente,
    decimal ValorBase,
    int LimiteXmlTotal,
    int XmlsProcessados,
    int XmlsExcedentes,
    decimal ValorExcedente,
    decimal ValorTotal,
    string Status,
    DateTime DataVencimento,
    DateTime? DataPagamento,
    string? Observacao
);
