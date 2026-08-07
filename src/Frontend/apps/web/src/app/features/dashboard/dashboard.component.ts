import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, ContadorService, AuthService } from '@veloxml/services';
import { DashboardStatsDto, AdminDashboardDto, ClienteDashboardDto, DocumentoPorMesDto, DocumentoPorMesClienteDto } from '@veloxml/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="loading">Carregando...</div>
      } @else if (isAdmin()) {
        <!-- ════ ADMIN DASHBOARD ════ -->
        <header class="page-header">
          <div>
            <h2 class="font-heading">Dashboard Administrativo</h2>
            <p class="page-sub">Visão geral do sistema</p>
          </div>
        </header>

        @if (adminStats(); as a) {
          <!-- KPIs principais -->
          <div class="kpis">
            <div class="kpi-card kpi-accent">
              <span class="kpi-label">Contadores Ativos</span>
              <span class="kpi-value font-heading">{{ a.contadoresAtivos }}</span>
              <span class="kpi-sub">de {{ a.totalContadores }} total · {{ a.contadoresBloqueados }} bloqueado(s)</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Total de Clientes</span>
              <span class="kpi-value font-heading">{{ a.totalClientes }}</span>
              <span class="kpi-sub">{{ a.clientesAtivos }} ativos</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Receita do Mês</span>
              <span class="kpi-value font-heading accent">{{ a.receitaMesAtual | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              <span class="kpi-sub">{{ a.receitaPendenteMes | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} pendente</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Cobranças</span>
              <span class="kpi-value font-heading" [class.red]="a.cobrancasAtrasadas > 0">{{ a.cobrancasPendentes + a.cobrancasAtrasadas }}</span>
              <span class="kpi-sub">{{ a.cobrancasPendentes }} pendentes · <span [class.red]="a.cobrancasAtrasadas > 0">{{ a.cobrancasAtrasadas }} atrasadas</span></span>
            </div>
          </div>

          <!-- Status badges -->
          <div class="status-row">
            <div class="status-item" [class.status-ok]="a.contadoresBloqueados === 0" [class.status-warn]="a.contadoresBloqueados > 0">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              {{ a.contadoresBloqueados === 0 ? 'Nenhum contador bloqueado' : a.contadoresBloqueados + ' contador(es) bloqueado(s)' }}
            </div>
            <div class="status-item" [class.status-ok]="a.cobrancasAtrasadas === 0" [class.status-err]="a.cobrancasAtrasadas > 0">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ a.cobrancasAtrasadas === 0 ? 'Sem cobranças atrasadas' : a.cobrancasAtrasadas + ' cobrança(s) atrasada(s)' }}
            </div>
          </div>

          <!-- Top Contadores -->
          <div class="card">
            <h3 class="card-title">Top Contadores por Volume de Clientes</h3>
            @if (a.topContadores.length === 0) {
              <p class="empty">Nenhum contador cadastrado ainda.</p>
            } @else {
              <div class="table-scroll">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Contador</th>
                    <th>Clientes</th>
                    <th>Mensalidade</th>
                    <th>Licença</th>
                    <th>Cobrança</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of a.topContadores; track c.id) {
                    <tr>
                      <td>
                        <div class="cell-name">
                          <div class="mini-avatar" [class.mini-avatar-blocked]="c.statusLicenca === 'Bloqueado'">{{ c.nome.charAt(0).toUpperCase() }}</div>
                          <div>
                            <div style="font-weight:500">{{ c.nome }}</div>
                            @if (c.empresa) { <div class="cell-sub">{{ c.empresa }}</div> }
                          </div>
                        </div>
                      </td>
                      <td>{{ c.totalClientes }}</td>
                      <td>{{ c.valorMensal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                      <td>
                        <span class="badge" [class.badge-green]="c.statusLicenca === 'Ativo'" [class.badge-red]="c.statusLicenca === 'Bloqueado'">
                          {{ c.statusLicenca }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="'badge-' + c.statusCobranca">{{ c.statusCobranca }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              </div>
            }
          </div>
        }

      } @else if (isCliente()) {
        <!-- ════ CLIENTE DASHBOARD ════ -->
        <header class="page-header">
          <h2 class="font-heading">Dashboard</h2>
          <p class="page-sub">Visão geral da sua empresa</p>
        </header>

        @if (clienteStats(); as c) {
          <div class="kpis kpis-cliente">
            <div class="kpi-card kpi-accent">
              <span class="kpi-label">Notas Fiscais (NF-e)</span>
              <span class="kpi-value font-heading">{{ c.totalNotasFiscais }}</span>
              <span class="kpi-sub">de {{ c.totalDocumentos }} documentos</span>
            </div>
            <div class="kpi-card kpi-accent">
              <span class="kpi-label">Faturamento Total</span>
              <span class="kpi-value font-heading accent">{{ c.faturamentoTotalNotas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              <span class="kpi-sub">soma de todas as NF-e emitidas</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Alertas Ativos</span>
              <span class="kpi-value font-heading" [class.red]="c.alertasAtivos > 0">{{ c.alertasAtivos }}</span>
              <span class="kpi-sub">requerem atenção</span>
            </div>
          </div>

          <!-- Monthly volume chart -->
          <div class="card">
            <h3 class="card-title">Documentos por Mês (12 meses)</h3>
            @if (c.documentosPorMes.length === 0 || maxQtdCliente(c.documentosPorMes) === 0) {
              <p class="empty">Nenhum documento no período.</p>
            } @else {
              <div class="bar-chart">
                @for (m of c.documentosPorMes; track m.label) {
                  <div class="bar-col">
                    <span class="bar-qty">{{ m.quantidade || '' }}</span>
                    <div class="bar-track">
                      <div class="bar-fill" [style.height.%]="m.quantidade / maxQtdCliente(c.documentosPorMes) * 100"></div>
                    </div>
                    <span class="bar-label">{{ m.label }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="grid-2">
            <div class="card">
              <h3 class="card-title">Documentos por Tipo</h3>
              <div class="tipo-list">
                @for (item of c.documentosPorTipo; track item.tipo) {
                  <div class="tipo-row">
                    <span class="tipo-name">{{ item.tipo }}</span>
                    <div class="tipo-bar-wrap"><div class="tipo-bar" [style.width.%]="item.percentual"></div></div>
                    <span class="tipo-pct">{{ item.percentual }}%</span>
                    <span class="tipo-qty">{{ item.quantidade }}</span>
                  </div>
                }
                @if (!c.documentosPorTipo.length) {
                  <p class="empty">Nenhum documento no período.</p>
                }
              </div>
            </div>

            <div class="card">
              <h3 class="card-title">Notas Fiscais por Status</h3>
              <div class="status-list">
                <div class="status-row-item" (click)="irParaPedidos()">
                  <span class="status-dot status-dot-ok"></span>
                  <span class="status-name">Nota Fiscal</span>
                  <span class="status-qty">{{ c.pedidosEmitidos }}</span>
                </div>
                <div class="status-row-item" (click)="irParaPedidos()">
                  <span class="status-dot status-dot-err"></span>
                  <span class="status-name">Cancelada</span>
                  <span class="status-qty">{{ c.pedidosCancelados }}</span>
                </div>
                @if (c.totalPedidos === 0) {
                  <p class="empty">Nenhum pedido cadastrado ainda.</p>
                }
              </div>
            </div>
          </div>
        }

      } @else {
        <!-- ════ CONTADOR DASHBOARD ════ -->
        <header class="page-header">
          <h2 class="font-heading">Dashboard</h2>
          <p class="page-sub">Últimos {{ dias }} dias</p>
        </header>

        @if (stats(); as s) {
          <div class="kpis">
            <div class="kpi-card">
              <span class="kpi-label">Total de Documentos</span>
              <span class="kpi-value font-heading">{{ s.totalDocumentos }}</span>
              <span class="kpi-sub">{{ s.totalDocumentosHoje }} hoje</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Valor Total (mês)</span>
              <span class="kpi-value font-heading accent">{{ s.valorTotalMes | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Alertas Ativos</span>
              <span class="kpi-value font-heading" [class.red]="s.alertasAtivos > 0">{{ s.alertasAtivos }}</span>
              <span class="kpi-sub">{{ s.pendenciasAtivas }} pendências</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Duplicados</span>
              <span class="kpi-value font-heading" [class.red]="s.duplicados > 0">{{ s.duplicados }}</span>
              <span class="kpi-sub">{{ s.totalClientes }} clientes</span>
            </div>
          </div>

          <!-- Monthly volume chart -->
          <div class="card">
            <h3 class="card-title">Documentos por Mês (12 meses)</h3>
            @if (s.documentosPorMes.length === 0 || maxQtd(s.documentosPorMes) === 0) {
              <p class="empty">Nenhum documento no período.</p>
            } @else {
              <div class="bar-chart">
                @for (m of s.documentosPorMes; track m.label) {
                  <div class="bar-col">
                    <span class="bar-qty">{{ m.quantidade || '' }}</span>
                    <div class="bar-track">
                      <div class="bar-fill" [style.height.%]="m.quantidade / maxQtd(s.documentosPorMes) * 100"></div>
                    </div>
                    <span class="bar-label">{{ m.label }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="grid-2">
            <div class="card">
              <h3 class="card-title">Por Tipo</h3>
              <div class="tipo-list">
                @for (item of s.documentosPorTipo; track item.tipo) {
                  <div class="tipo-row">
                    <span class="tipo-name">{{ item.tipo }}</span>
                    <div class="tipo-bar-wrap"><div class="tipo-bar" [style.width.%]="item.percentual"></div></div>
                    <span class="tipo-pct">{{ item.percentual }}%</span>
                    <span class="tipo-qty">{{ item.quantidade }}</span>
                  </div>
                }
                @if (!s.documentosPorTipo.length) {
                  <p class="empty">Nenhum documento no período.</p>
                }
              </div>
            </div>

            <div class="card">
              <h3 class="card-title">Top Clientes</h3>
              <div class="table-scroll">
              <table class="mini-table">
                <thead><tr><th>Cliente</th><th>Docs</th><th>Valor</th></tr></thead>
                <tbody>
                  @for (c of s.topClientes; track c.clienteId) {
                    <tr>
                      <td>{{ c.nome }}</td>
                      <td>{{ c.totalDocumentos }}</td>
                      <td>{{ c.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                    </tr>
                  }
                  @if (!s.topClientes.length) {
                    <tr><td colspan="3" class="empty">—</td></tr>
                  }
                </tbody>
              </table>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }
    .page-sub { color: var(--text2); font-size: 13px; margin-top: 2px; }
    .loading { color: var(--text2); font-size: 14px; padding: 2rem; text-align: center; }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .kpis-cliente { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 640px) { .kpis-cliente { grid-template-columns: 1fr; } }
    .kpi-card {
      background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem;
    }
    .kpi-card.kpi-accent { border-color: oklch(0.62 0.17 254 / .25); background: oklch(0.62 0.17 254 / .04); }
    .kpi-label { font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: var(--text); line-height: 1; }
    .kpi-value.accent { color: var(--accent); }
    .kpi-value.red { color: var(--red); }
    .kpi-sub { font-size: 12px; color: var(--text2); }

    .status-row { display: flex; gap: .75rem; flex-wrap: wrap; }
    .status-item {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 500; padding: 6px 12px;
      border-radius: 999px; border: 1px solid var(--border); color: var(--text2);
    }
    .status-ok  { background: rgba(0, 229, 160, .07); border-color: rgba(0, 229, 160, .25); color: var(--green); }
    .status-warn{ background: rgba(255,209,102,.07); border-color: rgba(255,209,102,.25); color: var(--yellow); }
    .status-err { background: rgba(255,77,109,.07); border-color: rgba(255,77,109,.25); color: var(--red); }
    .red { color: var(--red); }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; }
    .card-title { font-size: 14px; font-weight: 600; margin: 0 0 1rem; color: var(--text); }

    .mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .mini-table th { color: var(--text2); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; text-align: left; padding: 0 0 .625rem; border-bottom: 1px solid var(--border); }
    .mini-table td { padding: .625rem 0; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .mini-table tr:last-child td { border-bottom: none; }

    .cell-name { display: flex; align-items: center; gap: .5rem; }
    .cell-sub { font-size: 11px; color: var(--text2); }
    .mini-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--accent-dim); color: var(--accent);
      font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .mini-avatar-blocked { background: rgba(255,77,109,.12); color: var(--red); }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green   { background: rgba(0, 229, 160, .12); color: var(--green); }
    .badge-red     { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-Pago    { background: oklch(0.62 0.17 254 / .12); color: var(--accent); }
    .badge-Pendente{ background: rgba(255,209,102,.15); color: var(--yellow); }
    .badge-Atrasado{ background: rgba(255,77,109,.12); color: var(--red); }

    .tipo-list { display: flex; flex-direction: column; gap: .625rem; }
    .tipo-row { display: grid; grid-template-columns: 4rem 1fr 3rem 2.5rem; align-items: center; gap: .5rem; font-size: 13px; }
    .tipo-name { color: var(--text2); }
    .tipo-bar-wrap { background: var(--bg3); border-radius: 4px; height: 6px; overflow: hidden; }
    .tipo-bar { background: var(--accent); height: 100%; border-radius: 4px; transition: width 300ms; }
    .tipo-pct { color: var(--text2); text-align: right; }
    .tipo-qty { color: var(--text); font-weight: 600; text-align: right; }

    .empty { color: var(--text2); font-size: 13px; text-align: center; padding: 1rem 0; }

    /* Bar chart */
    .bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 140px; overflow-x: auto; padding-bottom: .25rem; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 36px; }
    .bar-qty { font-size: 10px; color: var(--text2); min-height: 14px; }
    .bar-track { flex: 1; width: 100%; background: var(--bg3); border-radius: 4px 4px 0 0; overflow: hidden; display: flex; align-items: flex-end; }
    .bar-fill { width: 100%; background: var(--accent); border-radius: 4px 4px 0 0; min-height: 2px; transition: height 300ms; }
    .bar-label { font-size: 10px; color: var(--text2); text-align: center; white-space: nowrap; }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .mini-table { min-width: 480px; }

    @media (max-width: 900px) {
      .kpis { grid-template-columns: 1fr 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
      .status-row { flex-direction: column; }
    }

    @media (max-width: 640px) {
      .kpis { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; gap: .5rem; }
      .tipo-row { grid-template-columns: 3.5rem 1fr 2.5rem 2rem; gap: .375rem; }
    }

    /* Cliente: Pedidos por Status */
    .status-list { display: flex; flex-direction: column; gap: .5rem; }
    .status-row-item { display: flex; align-items: center; gap: 10px; padding: .625rem .25rem; border-bottom: 1px solid var(--border); cursor: pointer; }
    .status-row-item:last-of-type { border-bottom: none; }
    .status-row-item:hover { background: rgba(255,255,255,.02); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .status-dot-neutral { background: var(--text2); }
    .status-dot-ok { background: var(--accent); }
    .status-dot-err { background: var(--red); }
    .status-name { flex: 1; font-size: 13.5px; color: var(--text); }
    .status-qty { font-size: 14px; font-weight: 700; color: var(--text); }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly _dash    = inject(DashboardService);
  private readonly _contSvc = inject(ContadorService);
  private readonly _auth    = inject(AuthService);
  private readonly _router  = inject(Router);

  private clienteId = '';

  readonly dias         = 30;
  readonly loading      = signal(true);
  readonly isAdmin      = signal(false);
  readonly isCliente    = signal(false);
  readonly stats        = signal<DashboardStatsDto | null>(null);
  readonly adminStats   = signal<AdminDashboardDto | null>(null);
  readonly clienteStats = signal<ClienteDashboardDto | null>(null);

  maxQtd(months: DocumentoPorMesDto[]): number {
    return Math.max(...months.map(m => m.quantidade), 1);
  }

  maxQtdCliente(months: DocumentoPorMesClienteDto[]): number {
    return Math.max(...months.map(m => m.quantidade), 1);
  }

  irParaPedidos(): void {
    this._router.navigate(['/clientes', this.clienteId, 'pedidos']);
  }

  ngOnInit(): void {
    const user = this._auth.currentUser();
    const perfil = user?.perfil ?? '';
    this.isAdmin.set(perfil === 'Administrador');
    this.isCliente.set(perfil === 'Cliente');

    if (this.isAdmin()) {
      this._contSvc.getAdminDashboard().subscribe({
        next: s => { this.adminStats.set(s); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else if (this.isCliente()) {
      this.clienteId = user?.clienteId ?? '';
      this._dash.getClienteStats(this.clienteId).subscribe({
        next: s => { this.clienteStats.set(s); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else {
      this._dash.getStats(this.dias).subscribe({
        next: s => { this.stats.set(s); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }
}
