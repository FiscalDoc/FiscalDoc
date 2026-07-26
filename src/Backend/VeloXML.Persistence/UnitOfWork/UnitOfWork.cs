using Microsoft.EntityFrameworkCore.Storage;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.Persistence.Repositories;

namespace VeloXML.Persistence.UnitOfWork;

public sealed class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    private IDbContextTransaction? _transaction;

    public IUserRepository Users { get; } = new UserRepository(context);
    public IRefreshTokenRepository Tokens { get; } = new RefreshTokenRepository(context);
    public IContadorRepository Contadores { get; } = new ContadorRepository(context);
    public IClienteRepository Clientes { get; } = new ClienteRepository(context);
    public IDocumentoRepository Documentos { get; } = new DocumentoRepository(context);
    public IArquivoRepository Arquivos { get; } = new ArquivoRepository(context);
    public IAlertaRepository Alertas { get; } = new AlertaRepository(context);
    public ICobrancaRepository Cobrancas { get; } = new CobrancaRepository(context);
    public IAuditLogRepository Logs { get; } = new AuditLogRepository(context);
    public IConfiguracaoRepository Configuracoes { get; } = new ConfiguracaoRepository(context);
    public IProdutoRepository Produtos { get; } = new ProdutoRepository(context);
    public IDestinatarioRepository Destinatarios { get; } = new DestinatarioRepository(context);
    public IPedidoRepository Pedidos { get; } = new PedidoRepository(context);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        await context.SaveChangesAsync(ct);

    public async Task BeginTransactionAsync(CancellationToken ct = default) =>
        _transaction = await context.Database.BeginTransactionAsync(ct);

    public async Task CommitTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction is not null)
            await _transaction.CommitAsync(ct);
    }

    public async Task RollbackTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction is not null)
            await _transaction.RollbackAsync(ct);
    }

    public void Dispose() => _transaction?.Dispose();
}
