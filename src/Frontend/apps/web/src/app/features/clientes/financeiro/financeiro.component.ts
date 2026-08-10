import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceiroService, DestinatarioService, ConfirmDialogService, ToastService, extractErrorMessage } from '@veloxml/services';
import { ContaReceberDto, ContaReceberResumoDto, DestinatarioDto } from '@veloxml/models';
import { DecimalInputDirective } from '../../../shared/decimal-input.directive';
import { SalvarAtalhoDirective } from '../../../shared/salvar-atalho.directive';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalInputDirective, SalvarAtalhoDirective],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Financeiro</h2>
          <p class="page-sub">Contas a receber dos seus clientes</p>
        </div>
        <button class="btn-primary" (click)="abrirNova()">+ Nova Conta a Receber</button>
      </div>

      @if (resumo(); as r) {
        <div class="kpis">
          <div class="kpi-card">
            <span class="kpi-label">Pendente</span>
            <span class="kpi-value">{{ r.totalPendente | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="kpi-sub">{{ r.qtdPendente }} conta(s)</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Atrasado</span>
            <span class="kpi-value red">{{ r.totalAtrasado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            <span class="kpi-sub">{{ r.qtdAtrasado }} conta(s)</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Recebido no mês</span>
            <span class="kpi-value accent">{{ r.totalPagoNoMes | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
        </div>
      }

      <div class="card section">
        <div class="filters">
          <select class="select" [(ngModel)]="status" (change)="buscar()">
            <option value="">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Pago">Pago</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <input class="input date-input" type="date" [(ngModel)]="de" (change)="buscar()" title="De"/>
          <input class="input date-input" type="date" [(ngModel)]="ate" (change)="buscar()" title="Até"/>
        </div>

        @if (erro()) { <div class="alert-error">{{ erro() }}</div> }

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (contas().length === 0) {
          <div class="empty">Nenhuma conta a receber encontrada.</div>
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (c of contas(); track c.id) {
                <tr>
                  <td>{{ c.destinatarioNome }}</td>
                  <td>
                    <div>{{ c.descricao }}</div>
                    @if (c.pedidoNumero) { <div class="sub-text">Pedido #{{ c.pedidoNumero }}</div> }
                  </td>
                  <td>{{ c.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                  <td>{{ c.dataVencimento | date:'dd/MM/yyyy' }}</td>
                  <td><span class="badge" [ngClass]="'badge-' + c.status">{{ c.status }}</span></td>
                  <td class="actions">
                    @if (c.status === 'Pendente' || c.status === 'Atrasado') {
                      <button class="link-btn" (click)="abrirBaixa(c)">Dar baixa</button>
                      <button class="link-btn danger" (click)="cancelar(c)">Cancelar</button>
                    }
                    <button class="link-btn danger" (click)="excluir(c)">Excluir</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>

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
        <div class="modal" appSalvarAtalho (appSalvarAtalho)="criarConta()" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title">Nova Conta a Receber</h3>
            <button class="modal-close" (click)="fecharModal()">✕</button>
          </header>
          <div class="modal-body">
            @if (erroModal()) { <div class="alert-error">{{ erroModal() }}</div> }

            <div class="field">
              <label class="label">Cliente *</label>
              <select class="input" [(ngModel)]="novoDestinatarioId">
                <option value="">Selecione...</option>
                @for (d of destinatarios(); track d.id) { <option [value]="d.id">{{ d.razaoSocial }}</option> }
              </select>
            </div>

            <div class="field">
              <label class="label">Descrição *</label>
              <input class="input" type="text" [(ngModel)]="novaDescricao" placeholder="Ex: Venda de mercadorias"/>
            </div>

            <div class="form-row">
              <div class="field">
                <label class="label">Valor (R$) *</label>
                <input class="input" type="text" appDecimalInput [(ngModel)]="novoValor"/>
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
            <button class="btn-primary" [disabled]="salvando()" (click)="criarConta()" title="Atalho: Ctrl+S">
              {{ salvando() ? 'Criando...' : 'Criar Conta' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showBaixaModal(); as conta) {
      <div class="overlay" (click)="fecharBaixa()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title">Dar baixa</h3>
            <button class="modal-close" (click)="fecharBaixa()">✕</button>
          </header>
          <div class="modal-body">
            @if (erroBaixa()) { <div class="alert-error">{{ erroBaixa() }}</div> }
            <p class="baixa-info">{{ conta.destinatarioNome }} — {{ conta.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</p>

            <div class="field">
              <label class="label">Data do pagamento</label>
              <input class="input" type="date" [(ngModel)]="baixaData"/>
            </div>
            <div class="field">
              <label class="label">Forma de pagamento</label>
              <input class="input" type="text" [(ngModel)]="baixaForma" placeholder="Ex: PIX, Boleto, Dinheiro"/>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="fecharBaixa()">Cancelar</button>
            <button class="btn-primary" [disabled]="salvandoBaixa()" (click)="confirmarBaixa()">
              {{ salvandoBaixa() ? 'Salvando...' : 'Confirmar baixa' }}
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
    .select, .date-input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; color: var(--text); font-size: 13px; }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 2rem; }

    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .sub-text { font-size: 11px; color: var(--text2); margin-top: 2px; }
    .actions { white-space: nowrap; display: flex; gap: .75rem; }
    .link-btn { background: none; border: none; color: var(--accent); font-size: 12.5px; cursor: pointer; padding: 0; }
    .link-btn.danger { color: var(--red); }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-Pendente { background: rgba(255,209,102,.15); color: var(--yellow); }
    .badge-Pago { background: oklch(0.60 0.14 225 / .12); color: var(--accent); }
    .badge-Atrasado { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-Cancelado { background: rgba(124,130,153,.15); color: var(--text2); }

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
    .baixa-info { margin: 0; font-size: 13.5px; color: var(--text); }

    .field { display: flex; flex-direction: column; gap: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }

    @media (max-width: 900px) {
      .kpis { grid-template-columns: 1fr; }
    }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 640px; }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .filters { flex-direction: column; align-items: stretch; }
      .form-row { grid-template-columns: 1fr; }
      .modal-footer { flex-direction: column-reverse; align-items: stretch; }
    }
  `],
})
export class FinanceiroComponent implements OnInit {
  private readonly _svc = inject(FinanceiroService);
  private readonly _destSvc = inject(DestinatarioService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _confirm = inject(ConfirmDialogService);
  private readonly _toast = inject(ToastService);

  private clienteId = '';

  readonly contas = signal<ContaReceberDto[]>([]);
  readonly resumo = signal<ContaReceberResumoDto | null>(null);
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  status = '';
  de = '';
  ate = '';

  readonly destinatarios = signal<DestinatarioDto[]>([]);

  readonly showModal = signal(false);
  readonly salvando = signal(false);
  readonly erroModal = signal<string | null>(null);

  novoDestinatarioId = '';
  novaDescricao = '';
  novoValor: number | null = null;
  novoVencimento = '';
  novaObservacao = '';

  readonly showBaixaModal = signal<ContaReceberDto | null>(null);
  readonly salvandoBaixa = signal(false);
  readonly erroBaixa = signal<string | null>(null);
  baixaData = '';
  baixaForma = '';

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
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
    this._svc.getAll(this.clienteId, {
      status: this.status || undefined,
      de: this.de || undefined,
      ate: this.ate || undefined,
      page: this.page(), pageSize: 20,
    }).subscribe({
      next: r => {
        this.contas.set(r.items as ContaReceberDto[]);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.erro.set(extractErrorMessage(err, 'Erro ao carregar contas a receber.'));
      },
    });
  }

  carregarResumo(): void {
    this._svc.getResumo(this.clienteId).subscribe(r => this.resumo.set(r));
  }

  abrirNova(): void {
    this.novoDestinatarioId = '';
    this.novaDescricao = '';
    this.novoValor = null;
    this.novoVencimento = '';
    this.novaObservacao = '';
    this.erroModal.set(null);
    this.showModal.set(true);
    if (this.destinatarios().length === 0) {
      this._destSvc.getAll(this.clienteId, { pageSize: 500 }).subscribe(r => this.destinatarios.set(r.items as DestinatarioDto[]));
    }
  }

  fecharModal(): void {
    this.showModal.set(false);
  }

  criarConta(): void {
    if (!this.novoDestinatarioId) { this.erroModal.set('Selecione um cliente.'); return; }
    if (!this.novaDescricao.trim()) { this.erroModal.set('Informe a descrição.'); return; }
    if (!this.novoValor || this.novoValor <= 0) { this.erroModal.set('Informe um valor válido.'); return; }
    if (!this.novoVencimento) { this.erroModal.set('Informe a data de vencimento.'); return; }

    this.salvando.set(true);
    this.erroModal.set(null);

    this._svc.create(this.clienteId, {
      destinatarioId: this.novoDestinatarioId,
      descricao: this.novaDescricao,
      valorTotal: this.novoValor,
      dataVencimento: this.novoVencimento,
      observacao: this.novaObservacao || undefined,
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.showModal.set(false);
        this._toast.success('Conta a receber criada!');
        this._carregar();
        this.carregarResumo();
      },
      error: err => {
        this.salvando.set(false);
        this.erroModal.set(extractErrorMessage(err, 'Erro ao criar conta a receber.'));
      },
    });
  }

  abrirBaixa(c: ContaReceberDto): void {
    this.baixaData = new Date().toISOString().slice(0, 10);
    this.baixaForma = '';
    this.erroBaixa.set(null);
    this.showBaixaModal.set(c);
  }

  fecharBaixa(): void {
    this.showBaixaModal.set(null);
  }

  confirmarBaixa(): void {
    const conta = this.showBaixaModal();
    if (!conta) return;
    this.salvandoBaixa.set(true);
    this.erroBaixa.set(null);
    this._svc.darBaixa(this.clienteId, conta.id, {
      dataPagamento: this.baixaData || undefined,
      formaPagamento: this.baixaForma || undefined,
    }).subscribe({
      next: () => {
        this.salvandoBaixa.set(false);
        this.showBaixaModal.set(null);
        this._toast.success('Baixa registrada!');
        this._carregar();
        this.carregarResumo();
      },
      error: err => {
        this.salvandoBaixa.set(false);
        this.erroBaixa.set(extractErrorMessage(err, 'Erro ao dar baixa.'));
      },
    });
  }

  async cancelar(c: ContaReceberDto): Promise<void> {
    const ok = await this._confirm.ask(`Cancelar a conta "${c.descricao}" de ${c.destinatarioNome}?`, { confirmLabel: 'Cancelar conta', destrutivo: true });
    if (!ok) return;
    this._svc.cancelar(this.clienteId, c.id).subscribe({
      next: () => { this._toast.success('Conta cancelada!'); this._carregar(); this.carregarResumo(); },
      error: err => this._toast.error(extractErrorMessage(err, 'Erro ao cancelar conta.')),
    });
  }

  async excluir(c: ContaReceberDto): Promise<void> {
    const ok = await this._confirm.ask(`Excluir "${c.descricao}" de ${c.destinatarioNome}? Esta ação não pode ser desfeita.`, { confirmLabel: 'Excluir' });
    if (!ok) return;
    this._svc.delete(this.clienteId, c.id).subscribe({
      next: () => { this._toast.success('Conta excluída!'); this._carregar(); this.carregarResumo(); },
      error: err => this._toast.error(extractErrorMessage(err, 'Erro ao excluir conta.')),
    });
  }
}
