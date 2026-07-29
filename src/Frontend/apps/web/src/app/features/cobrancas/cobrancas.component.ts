import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CobrancaService, ContadorService, ClienteService, extractErrorMessage } from '@veloxml/services';
import { CobrancaDto, CobrancasResumoDto, ContadorDto, ClienteDto } from '@veloxml/models';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

@Component({
  selector: 'app-cobrancas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Contas a Receber</h2>
          <p class="page-sub">Cobranças de Contadores e Clientes diretos, em um só lugar</p>
        </div>
        <button class="btn-primary" (click)="abrirNova()">+ Nova Cobrança</button>
      </div>

      @if (resumo(); as r) {
        <div class="kpis">
          <div class="kpi-card">
            <span class="kpi-label">Pendente</span>
            <span class="kpi-value">{{ r.totalPendente | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="kpi-sub">{{ r.qtdPendente }} cobrança(s)</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Atrasado</span>
            <span class="kpi-value red">{{ r.totalAtrasado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="kpi-sub">{{ r.qtdAtrasado }} cobrança(s)</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Recebido no mês</span>
            <span class="kpi-value accent">{{ r.totalRecebidoMesAtual | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
        </div>
      }

      <div class="card section">
        <div class="filters">
          <div class="search-box">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input class="search-input" [(ngModel)]="termo" (input)="buscar()" placeholder="Buscar contador ou cliente..."/>
          </div>
          <select class="select" [(ngModel)]="tipo" (change)="buscar()">
            <option value="">Todos os tipos</option>
            <option value="Contador">Contador</option>
            <option value="Cliente">Cliente</option>
          </select>
          <select class="select" [(ngModel)]="status" (change)="buscar()">
            <option value="">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Atrasado">Atrasado</option>
          </select>
        </div>

        @if (erro()) { <div class="alert-error">{{ erro() }}</div> }

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (cobrancas().length === 0) {
          <div class="empty">Nenhuma cobrança encontrada.</div>
        } @else {
          <table class="table">
            <thead>
              <tr><th>Entidade</th><th>Período</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (c of cobrancas(); track c.id) {
                <tr>
                  <td>
                    <div class="entidade">
                      <span class="tipo-badge" [class.tipo-contador]="c.tipo === 'Contador'">{{ c.tipo }}</span>
                      {{ c.entidadeNome }}
                    </div>
                  </td>
                  <td>{{ MESES[c.mes - 1] }}/{{ c.ano }}</td>
                  <td>{{ c.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                  <td>{{ c.dataVencimento | date:'dd/MM/yyyy' }}</td>
                  <td><span class="badge" [ngClass]="'badge-' + c.status">{{ c.status }}</span></td>
                  <td class="actions">
                    @if (c.status !== 'Pago') {
                      <button class="link-btn" (click)="marcarPaga(c)">Marcar como Pago</button>
                    } @else {
                      <button class="link-btn" (click)="reabrir(c)">Reabrir</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (totalPages() > 1) {
            <div class="pagination">
              <button class="page-btn" [disabled]="page() <= 1" (click)="irPara(page() - 1)">Anterior</button>
              <span class="page-info">Página {{ page() }} de {{ totalPages() }}</span>
              <button class="page-btn" [disabled]="page() >= totalPages()" (click)="irPara(page() + 1)">Próxima</button>
            </div>
          }
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="overlay" (click)="fecharModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title">Nova Cobrança</h3>
            <button class="modal-close" (click)="fecharModal()">✕</button>
          </header>
          <div class="modal-body">
            @if (erroModal()) { <div class="alert-error">{{ erroModal() }}</div> }

            <div class="field">
              <label class="label">Tipo *</label>
              <div class="status-toggle">
                <button type="button" class="status-btn" [class.active]="novoTipo === 'Contador'" (click)="mudarTipo('Contador')">Contador</button>
                <button type="button" class="status-btn" [class.active]="novoTipo === 'Cliente'" (click)="mudarTipo('Cliente')">Cliente Direto</button>
              </div>
            </div>

            <div class="field">
              <label class="label">{{ novoTipo === 'Contador' ? 'Contador' : 'Cliente' }} *</label>
              <select class="input" [(ngModel)]="novoEntidadeId">
                <option value="">Selecione...</option>
                @if (novoTipo === 'Contador') {
                  @for (c of contadores(); track c.id) { <option [value]="c.id">{{ c.nome }}</option> }
                } @else {
                  @for (c of clientes(); track c.id) { <option [value]="c.id">{{ c.razaoSocial }}</option> }
                }
              </select>
            </div>

            <div class="form-row">
              <div class="field">
                <label class="label">Mês *</label>
                <select class="input" [(ngModel)]="novoMes">
                  @for (m of MESES; track m; let i = $index) { <option [value]="i + 1">{{ m }}</option> }
                </select>
              </div>
              <div class="field">
                <label class="label">Ano *</label>
                <input class="input" type="number" [(ngModel)]="novoAno"/>
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label class="label">Valor (R$) *</label>
                <input class="input" type="number" min="0.01" step="0.01" [(ngModel)]="novoValor"/>
              </div>
              <div class="field">
                <label class="label">Vencimento *</label>
                <input class="input" type="date" [(ngModel)]="novoVencimento"/>
              </div>
            </div>

            <div class="field">
              <label class="label">Observação</label>
              <textarea class="input" rows="2" [(ngModel)]="novaObservacao" placeholder="Opcional"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="fecharModal()">Cancelar</button>
            <button class="btn-primary" [disabled]="criando()" (click)="criarCobranca()">
              {{ criando() ? 'Criando...' : 'Criar Cobrança' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .page-sub { color: var(--text2); font-size: 13px; margin-top: 2px; }

    .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .kpi-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 1.6rem; font-weight: 700; color: var(--text); }
    .kpi-value.red { color: var(--red); }
    .kpi-value.accent { color: var(--accent); }
    .kpi-sub { font-size: 12px; color: var(--text2); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .filters { display: flex; gap: .75rem; flex-wrap: wrap; }
    .search-box { display: flex; align-items: center; gap: 6px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; color: var(--text2); flex: 1; max-width: 320px; }
    .search-input { background: none; border: none; outline: none; color: var(--text); font-size: 13px; flex: 1; }
    .select { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; color: var(--text); font-size: 13px; }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 2rem; }

    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .entidade { display: flex; align-items: center; gap: 8px; }
    .tipo-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 2px 7px; border-radius: 999px; background: rgba(124,130,153,.15); color: var(--text2); }
    .tipo-badge.tipo-contador { background: rgba(0,102,255,.12); color: #4d94ff; }
    .actions { white-space: nowrap; }
    .link-btn { background: none; border: none; color: var(--accent); font-size: 12.5px; cursor: pointer; padding: 0; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-Pendente { background: rgba(255,209,102,.15); color: var(--yellow); }
    .badge-Pago { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-Atrasado { background: rgba(255,77,109,.12); color: var(--red); }

    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: .5rem; }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { font-size: 13px; color: var(--text2); }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border); }

    .field { display: flex; flex-direction: column; gap: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .status-toggle { display: flex; gap: .5rem; }
    .status-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1.25rem; font-size: 13px; cursor: pointer; flex: 1; }
    .status-btn.active { background: rgba(0,229,160,.12); border-color: var(--accent); color: var(--accent); font-weight: 600; }

    @media (max-width: 900px) {
      .kpis { grid-template-columns: 1fr; }
    }
  `],
})
export class CobrancasComponent implements OnInit {
  private readonly _svc = inject(CobrancaService);
  private readonly _contadorSvc = inject(ContadorService);
  private readonly _clienteSvc = inject(ClienteService);

  readonly MESES = MESES;

  readonly cobrancas = signal<CobrancaDto[]>([]);
  readonly resumo = signal<CobrancasResumoDto | null>(null);
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  termo = '';
  tipo = '';
  status = '';

  readonly showModal = signal(false);
  readonly criando = signal(false);
  readonly erroModal = signal<string | null>(null);
  readonly contadores = signal<ContadorDto[]>([]);
  readonly clientes = signal<ClienteDto[]>([]);

  novoTipo: 'Contador' | 'Cliente' = 'Contador';
  novoEntidadeId = '';
  novoMes = new Date().getMonth() + 1;
  novoAno = new Date().getFullYear();
  novoValor: number | null = null;
  novoVencimento = '';
  novaObservacao = '';

  ngOnInit(): void {
    this.carregarResumo();
    this.buscar();
  }

  buscar(): void {
    this.page.set(1);
    this._carregar();
  }

  irPara(page: number): void {
    this.page.set(page);
    this._carregar();
  }

  private _carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this._svc.getAll({
      termo: this.termo || undefined, tipo: this.tipo || undefined, status: this.status || undefined,
      page: this.page(), pageSize: 20,
    }).subscribe({
      next: r => {
        this.cobrancas.set(r.items as CobrancaDto[]);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.erro.set(extractErrorMessage(err, 'Erro ao carregar cobranças.'));
      },
    });
  }

  carregarResumo(): void {
    this._svc.getResumo().subscribe(r => this.resumo.set(r));
  }

  marcarPaga(c: CobrancaDto): void {
    if (!confirm(`Marcar a cobrança de ${c.entidadeNome} (${this.MESES[c.mes - 1]}/${c.ano}) como paga?`)) return;
    this._svc.marcarPaga(c.id).subscribe({
      next: () => { this._carregar(); this.carregarResumo(); },
      error: err => this.erro.set(extractErrorMessage(err, 'Erro ao marcar cobrança como paga.')),
    });
  }

  reabrir(c: CobrancaDto): void {
    if (!confirm(`Reabrir a cobrança de ${c.entidadeNome} (${this.MESES[c.mes - 1]}/${c.ano})?`)) return;
    this._svc.reabrir(c.id).subscribe({
      next: () => { this._carregar(); this.carregarResumo(); },
      error: err => this.erro.set(extractErrorMessage(err, 'Erro ao reabrir cobrança.')),
    });
  }

  abrirNova(): void {
    this.novoTipo = 'Contador';
    this.novoEntidadeId = '';
    this.novoMes = new Date().getMonth() + 1;
    this.novoAno = new Date().getFullYear();
    this.novoValor = null;
    this.novoVencimento = '';
    this.novaObservacao = '';
    this.erroModal.set(null);
    this.showModal.set(true);
    if (this.contadores().length === 0) {
      this._contadorSvc.getAll({ pageSize: 500 }).subscribe(r => this.contadores.set(r.items as ContadorDto[]));
    }
    if (this.clientes().length === 0) {
      this._clienteSvc.getAll({ pageSize: 500 }).subscribe(r => this.clientes.set(r.items as ClienteDto[]));
    }
  }

  mudarTipo(tipo: 'Contador' | 'Cliente'): void {
    this.novoTipo = tipo;
    this.novoEntidadeId = '';
  }

  fecharModal(): void {
    this.showModal.set(false);
  }

  criarCobranca(): void {
    if (!this.novoEntidadeId) { this.erroModal.set(`Selecione um ${this.novoTipo === 'Contador' ? 'contador' : 'cliente'}.`); return; }
    if (!this.novoValor || this.novoValor <= 0) { this.erroModal.set('Informe um valor válido.'); return; }
    if (!this.novoVencimento) { this.erroModal.set('Informe a data de vencimento.'); return; }

    this.criando.set(true);
    this.erroModal.set(null);

    this._svc.criarManual({
      contadorId: this.novoTipo === 'Contador' ? this.novoEntidadeId : undefined,
      clienteId: this.novoTipo === 'Cliente' ? this.novoEntidadeId : undefined,
      mes: this.novoMes,
      ano: this.novoAno,
      valorTotal: this.novoValor,
      dataVencimento: this.novoVencimento,
      observacao: this.novaObservacao || undefined,
    }).subscribe({
      next: () => {
        this.criando.set(false);
        this.showModal.set(false);
        this._carregar();
        this.carregarResumo();
      },
      error: err => {
        this.criando.set(false);
        this.erroModal.set(extractErrorMessage(err, 'Erro ao criar cobrança.'));
      },
    });
  }
}
