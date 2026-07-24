namespace VeloXML.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IRefreshTokenRepository Tokens { get; }
    IContadorRepository Contadores { get; }
    IClienteRepository Clientes { get; }
    IDocumentoRepository Documentos { get; }
    IArquivoRepository Arquivos { get; }
    IAlertaRepository Alertas { get; }
    ICobrancaRepository Cobrancas { get; }
    IAuditLogRepository Logs { get; }
    IConfiguracaoRepository Configuracoes { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task BeginTransactionAsync(CancellationToken ct = default);
    Task CommitTransactionAsync(CancellationToken ct = default);
    Task RollbackTransactionAsync(CancellationToken ct = default);
}
