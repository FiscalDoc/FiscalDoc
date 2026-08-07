import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, PedidoService } from '@veloxml/services';
import { PedidoDto, PedidosResumoDto } from '@veloxml/models';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        @if (!isCliente()) {
          <button class="back-btn" (click)="goBack()">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Voltar ao cliente
          </button>
        }
        <div class="header-row">
          <h2 class="page-title">Pedidos / Nota Fiscal</h2>
          <button class="btn-primary" (click)="novoPedido()">+ Novo Pedido</button>
        </div>
      </div>

      @if (resumo(); as r) {
        <div class="kpi-row">
          <div class="kpi-card">
            <p class="kpi-label">Faturamento do mês</p>
            <p class="kpi-value">{{ r.faturamentoMes | currency:'BRL':'symbol':'1.0-0' }}</p>
            @if (r.faturamentoVariacaoPercentual != null) {
              <p class="kpi-delta" [class.down]="r.faturamentoVariacaoPercentual < 0">
                {{ r.faturamentoVariacaoPercentual >= 0 ? '↑' : '↓' }} {{ Math.abs(r.faturamentoVariacaoPercentual) }}%
              </p>
            }
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Notas autorizadas</p>
            <p class="kpi-value">{{ r.notasAutorizadasMes }}</p>
            @if (r.notasAutorizadasVariacaoPercentual != null) {
              <p class="kpi-delta" [class.down]="r.notasAutorizadasVariacaoPercentual < 0">
                {{ r.notasAutorizadasVariacaoPercentual >= 0 ? '↑' : '↓' }} {{ Math.abs(r.notasAutorizadasVariacaoPercentual) }}%
              </p>
            }
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Notas canceladas</p>
            <p class="kpi-value">{{ r.notasCanceladasMes }}</p>
            @if (r.notasCanceladasVariacaoPercentual != null) {
              <p class="kpi-delta" [class.down]="r.notasCanceladasVariacaoPercentual < 0">
                {{ r.notasCanceladasVariacaoPercentual >= 0 ? '↑' : '↓' }} {{ Math.abs(r.notasCanceladasVariacaoPercentual) }}%
              </p>
            }
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Rejeições</p>
            <p class="kpi-value">{{ r.percentualRejeicaoMes }}%</p>
            @if (r.percentualRejeicaoVariacaoPontos != null) {
              <p class="kpi-delta" [class.down]="r.percentualRejeicaoVariacaoPontos < 0">
                {{ r.percentualRejeicaoVariacaoPontos >= 0 ? '↑' : '↓' }} {{ Math.abs(r.percentualRejeicaoVariacaoPontos) }} p.p.
              </p>
            }
          </div>
        </div>
      }

      <!-- Filtro de status -->
      <div class="filter-bar">
        <button class="filter-btn" [class.active]="statusFiltro() === null" (click)="filtrar(null)">Todos</button>
        <button class="filter-btn" [class.active]="statusFiltro() === 'Rascunho'" (click)="filtrar('Rascunho')">Rascunho</button>
        <button class="filter-btn" [class.active]="statusFiltro() === 'Autorizada'" (click)="filtrar('Autorizada')">Autorizada</button>
        <button class="filter-btn" [class.active]="statusFiltro() === 'Cancelada'" (click)="filtrar('Cancelada')">Cancelada</button>
      </div>

      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input class="search-input" type="text" placeholder="Buscar por número ou destinatário..." [value]="termo()" (input)="onSearch($event)"/>
        </div>
        <div class="date-field">
          <label>De</label>
          <input class="date-input" type="date" [(ngModel)]="de" (ngModelChange)="carregar()"/>
        </div>
        <div class="date-field">
          <label>Até</label>
          <input class="date-input" type="date" [(ngModel)]="ate" (ngModelChange)="carregar()"/>
        </div>
        @if (termo() || de || ate) {
          <button class="btn-ghost-sm" (click)="limparFiltros()">Limpar</button>
        }
      </div>

      <div class="card section">
        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (pedidos().length === 0) {
          <div class="empty">Nenhum pedido encontrado.</div>
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr><th>Nº</th><th>Tipo</th><th>Destinatário</th><th>Data</th><th>Valor Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              @for (p of pedidos(); track p.id) {
                <tr class="row-link" (click)="abrirPedido(p)">
                  <td class="mono">{{ p.numero }}</td>
                  <td>
                    <span class="badge-tipo" [class.badge-tipo--nf]="!!p.documentoId">{{ p.documentoId ? 'Nota Fiscal' : 'Pedido' }}</span>
                  </td>
                  <td>{{ p.destinatarioNome }}</td>
                  <td>{{ p.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>{{ p.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td>
                    <span class="badge" [class]="statusClass(p)">{{ statusLabel(p) }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; }
    .back-btn:hover { color: var(--accent); }
    .header-row { display: flex; align-items: center; justify-content: space-between; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
    .kpi-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; }
    .kpi-label { margin: 0; font-size: 11.5px; color: var(--text2); }
    .kpi-value { margin: 4px 0 0; font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .kpi-delta { margin: 4px 0 0; font-size: 11.5px; font-weight: 600; color: var(--green); }
    .kpi-delta.down { color: var(--red); }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .kpi-row { grid-template-columns: 1fr; } }

    .filter-bar { display: flex; gap: .5rem; flex-wrap: wrap; }
    .filter-btn { background: var(--bg2); border: 1px solid var(--border); color: var(--text2); border-radius: 20px; padding: 4px 14px; font-size: 12px; cursor: pointer; }
    .filter-btn:hover { border-color: var(--text2); color: var(--text); }
    .filter-btn.active { background: var(--accent); color: #0d0f14; border-color: var(--accent); font-weight: 600; }
    .toolbar { display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; }
    .search-wrap { position: relative; flex: 1; min-width: 220px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text2); pointer-events: none; }
    .search-input { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem .5rem 2rem; font-size: 13.5px; outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: var(--accent); }
    .date-field { display: flex; align-items: center; gap: 6px; }
    .date-field label { font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
    .date-input { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .45rem .625rem; font-size: 13px; outline: none; }
    .date-input:focus { border-color: var(--accent); }
    .btn-ghost-sm { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .45rem .875rem; font-size: 12.5px; cursor: pointer; }
    .btn-ghost-sm:hover { color: var(--accent); border-color: var(--accent); }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 2rem; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .mono { font-family: monospace; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-rascunho { background: rgba(124,130,153,.15); color: var(--text2); }
    .badge-emitido  { background: var(--green-dim); color: var(--green); }
    .badge-cancelado { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-tipo { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; background: rgba(124,130,153,.15); color: var(--text2); }
    .badge-tipo--nf { background: oklch(0.62 0.17 254 / .12); color: var(--accent); }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .row-link { cursor: pointer; }
    .row-link:hover td { background: rgba(255,255,255,.02); }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 640px; }

    @media (max-width: 640px) {
      .header-row { flex-direction: column; align-items: stretch; gap: .5rem; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-wrap { min-width: 0; }
      .date-field { justify-content: space-between; }
    }
  `],
})
export class PedidosComponent implements OnInit {
  private readonly _svc    = inject(PedidoService);
  private readonly _route  = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _auth   = inject(AuthService);

  private clienteId = '';
  protected readonly Math = Math;
  // Cliente (ou Admin atuando como Cliente) não tem uma "tela do cliente" pra voltar — pra esse
  // perfil, Pedidos já é a raiz da navegação (não existe lista de Clientes no menu dele).
  readonly isCliente = computed(() => this._auth.currentUser()?.perfil === 'Cliente');

  readonly pedidos       = signal<PedidoDto[]>([]);
  readonly loading       = signal(false);
  readonly statusFiltro  = signal<string | null>(null);
  readonly termo         = signal('');
  readonly resumo        = signal<PedidosResumoDto | null>(null);
  de = '';
  ate = '';
  private _searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.carregar();
    this._svc.getResumo(this.clienteId).subscribe({
      next: r => this.resumo.set(r),
      error: () => this.resumo.set(null),
    });
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId]); }
  novoPedido(): void { this._router.navigate(['/clientes', this.clienteId, 'pedidos', 'novo']); }

  abrirPedido(p: PedidoDto): void { this._router.navigate(['/clientes', this.clienteId, 'pedidos', p.id]); }

  filtrar(status: string | null): void {
    this.statusFiltro.set(status);
    this.carregar();
  }

  onSearch(e: Event): void {
    this.termo.set((e.target as HTMLInputElement).value);
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.carregar(), 350);
  }

  limparFiltros(): void {
    this.termo.set('');
    this.de = '';
    this.ate = '';
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this._svc.getAll(this.clienteId, {
      status: this.statusFiltro() ?? undefined,
      termo: this.termo() || undefined,
      de: this.de || undefined,
      ate: this.ate || undefined,
    }).subscribe({
      next: r => { this.pedidos.set(r.items as PedidoDto[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // "Emitido" sozinho é só o flip interno antigo (sem NF-e real). Quando o pedido tem um
  // Documento vinculado (emitido via Focus ou uma NF-e importada/vinculada), o Status já não
  // precisa repetir "NF-e"/"Nota Fiscal" — a coluna Tipo já mostra isso, aqui só o estado importa.
  statusLabel(p: PedidoDto): string {
    if (p.status === 'Emitido' && p.documentoId) {
      return p.documentoStatus === 'Cancelado' ? 'Cancelada' : 'Autorizada';
    }
    return p.status;
  }

  statusClass(p: PedidoDto): string {
    if (p.status === 'Emitido' && p.documentoId && p.documentoStatus === 'Cancelado') return 'badge badge-cancelado';
    return {
      Rascunho: 'badge badge-rascunho',
      Emitido: 'badge badge-emitido',
      Cancelado: 'badge badge-cancelado',
    }[p.status] ?? 'badge';
  }
}
