import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContadorService, extractErrorMessage } from '@veloxml/services';
import { ContadorDto } from '@veloxml/models';

interface SuccessInfo { nome: string; email: string; }
type ModalMode = 'create';

@Component({
  selector: 'app-contadores-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
<div class="page">

  <!-- ── Header ── -->
  <header class="page-header">
    <div>
      <h2 class="font-heading">Contadores</h2>
      <p class="page-sub">{{ total() }} contador(es) cadastrado(s)</p>
    </div>
    <button class="btn-primary" (click)="openCreate()">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      Novo Contador
    </button>
  </header>

  <!-- ── Search ── -->
  <div class="toolbar">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
      </svg>
      <input class="search-input" type="text" placeholder="Buscar por nome ou e-mail..."
        [value]="termo()" (input)="onSearch($event)" />
    </div>
  </div>

  <!-- ── Table ── -->
  <div class="card">
    @if (loading()) {
      <div class="empty-state">Carregando...</div>
    } @else if (contadores().length === 0) {
      <div class="empty-state">Nenhum contador encontrado.</div>
    } @else {
      <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Contador</th>
            <th>Clientes</th>
            <th>Plano Mensal</th>
            <th>XMLs do Mês</th>
            <th>Cobrança Atual</th>
            <th>Licença</th>
          </tr>
        </thead>
        <tbody>
          @for (c of contadores(); track c.id) {
            <tr class="row-link" (click)="goTo(c.id)">
              <!-- Contador -->
              <td>
                <div class="cell-name">
                  <div class="avatar" [class.avatar-blocked]="c.statusLicenca === 'Bloqueado'">{{ initial(c.nome) }}</div>
                  <div>
                    <div class="cell-title">{{ c.nome }}</div>
                    <div class="cell-sub">{{ c.empresa ?? c.email }}</div>
                  </div>
                </div>
              </td>
              <!-- Clientes -->
              <td>
                <span class="badge badge-info">{{ c.totalClientes }}</span>
              </td>
              <!-- Plano -->
              <td>
                <div class="plan-cell">
                  <span class="plan-value">{{ c.totalClientes * c.valorPorCliente | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                  <span class="plan-sub">{{ c.valorPorCliente | currency:'BRL':'symbol':'1.0-0':'pt-BR' }}/cliente · {{ c.limiteXmlPorCliente }} XMLs</span>
                </div>
              </td>
              <!-- XMLs -->
              <td>
                @if (c.cobrancaAtual) {
                  <div class="xml-cell">
                    <div class="xml-bar-wrap">
                      <div class="xml-bar" [style.width.%]="xmlPercent(c)"></div>
                    </div>
                    <span class="xml-label">{{ c.cobrancaAtual.xmlsProcessados }} / {{ c.cobrancaAtual.limiteXmlTotal }}</span>
                    @if (c.cobrancaAtual.xmlsExcedentes > 0) {
                      <span class="badge badge-red" style="margin-top:2px">+{{ c.cobrancaAtual.xmlsExcedentes }} exc.</span>
                    }
                  </div>
                } @else {
                  <span class="cell-muted">—</span>
                }
              </td>
              <!-- Cobrança -->
              <td>
                @if (c.cobrancaAtual) {
                  <div class="cob-cell">
                    <span class="cob-valor">{{ c.cobrancaAtual.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                    <span class="badge" [ngClass]="cobClass(c.cobrancaAtual.status)">{{ c.cobrancaAtual.status }}</span>
                    <span class="cob-venc">Vence {{ c.cobrancaAtual.dataVencimento | date:'dd/MM/yy' }}</span>
                  </div>
                } @else {
                  <span class="cell-muted">—</span>
                }
              </td>
              <!-- Licença -->
              <td>
                <div class="licenca-cell">
                  <div class="badge-row">
                    @if (c.plano === 'Trial') {
                      <span class="badge badge-yellow">Teste</span>
                    }
                    <span class="badge" [class.badge-green]="c.statusLicenca === 'Ativo'" [class.badge-red]="c.statusLicenca === 'Bloqueado'">
                      {{ c.statusLicenca === 'Ativo' ? 'Ativo' : 'Bloqueado' }}
                    </span>
                  </div>
                  @if (c.dataLimiteAcesso) {
                    <div class="expiry-row"
                      [class.expiry-critico]="(diasParaVencer(c) ?? 999) <= 7 && (diasParaVencer(c) ?? 999) > 0"
                      [class.expiry-expirado]="(diasParaVencer(c) ?? 999) <= 0">
                      @if ((diasParaVencer(c) ?? 999) <= 0) {
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        <span>Expirado {{ c.dataLimiteAcesso | date:'dd/MM/yy' }}</span>
                      } @else if ((diasParaVencer(c) ?? 999) <= 7) {
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span>{{ diasParaVencer(c) }}d — {{ c.dataLimiteAcesso | date:'dd/MM/yy' }}</span>
                      } @else {
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span>{{ c.dataLimiteAcesso | date:'dd/MM/yy' }}</span>
                      }
                    </div>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" [disabled]="page() === 1" (click)="changePage(page() - 1)">‹ Anterior</button>
          <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">Próximo ›</button>
        </div>
      }
    }
  </div>
</div>

<!-- ════════════════════════════════════════════ MODAIS ════════════════════════════════════════════ -->
@if (showModal()) {
  <div class="overlay" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()" [style.max-width]="modalMode() === 'historico' ? '780px' : '560px'">

      <!-- ═══ CRIAR CONTADOR ═══ -->
      @if (modalMode() === 'create') {
        @if (successInfo(); as info) {
          <div class="success-wrap">
            <div class="success-icon">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="success-title font-heading">Contador cadastrado!</h3>
            <p class="success-sub"><strong>{{ info.nome }}</strong> vai receber um e-mail em <strong>{{ info.email }}</strong> com um link para definir a própria senha de acesso.</p>
            <button class="btn-primary success-close-btn" (click)="closeModal()">Fechar</button>
          </div>

        } @else {
          <header class="modal-header">
            <h3 class="modal-title font-heading">Novo Contador</h3>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </header>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
            <div class="form-row">
              <div class="field"><label class="label">Nome *</label>
                <input class="input" type="text" formControlName="nome" placeholder="João da Silva"/>
                @if (f['nome'].touched && f['nome'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
              </div>
              <div class="field"><label class="label">E-mail *</label>
                <input class="input" type="email" formControlName="email" placeholder="joao@escritorio.com" autocomplete="off"/>
                @if (f['email'].touched && f['email'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
              </div>
            </div>
            <div class="form-row">
              <div class="field"><label class="label">Telefone</label><input class="input" type="text" formControlName="telefone" placeholder="(11) 99999-9999"/></div>
              <div class="field"><label class="label">CRC</label><input class="input" type="text" formControlName="crc" placeholder="SP-123456"/></div>
            </div>
            <div class="field"><label class="label">Empresa / Escritório</label><input class="input" type="text" formControlName="empresa" placeholder="Contabilidade Ltda"/></div>
            @if (submitError()) { <div class="alert-error">{{ submitError() }}</div> }
            <div class="modal-footer">
              <button type="button" class="btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="submitting()">{{ submitting() ? 'Salvando...' : 'Cadastrar' }}</button>
            </div>
          </form>
        }
      }

    </div>
  </div>
}
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }
    .page-sub { color: var(--text2); font-size: 13px; margin-top: 2px; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost {
      background: transparent; color: var(--text2); border: 1px solid var(--border);
      border-radius: 8px; padding: 0.5rem 1rem; font-size: 13.5px; cursor: pointer;
    }
    .btn-ghost:hover { background: var(--bg3); color: var(--text); }
    .btn-danger {
      background: var(--red); color: #fff; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer;
    }
    .btn-danger:hover { opacity: 0.88; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-link {
      background: none; border: none; color: var(--accent); font-size: 12px;
      cursor: pointer; padding: 0; text-decoration: underline;
    }

    .toolbar { display: flex; gap: .75rem; }
    .search-wrap { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text2); pointer-events: none; }
    .search-input {
      width: 100%; box-sizing: border-box; background: var(--bg2); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); padding: .45rem .75rem .45rem 2rem; font-size: 13px; outline: none;
    }
    .search-input:focus { border-color: var(--accent); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th {
      padding: .625rem 1rem; text-align: left; font-size: 10.5px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .05em; color: var(--text2);
      border-bottom: 1px solid var(--border); background: var(--bg3);
    }
    .table td { padding: .75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover td { background: rgba(255,255,255,.02); }
    .row-link { cursor: pointer; }

    .cell-name { display: flex; align-items: center; gap: .625rem; }
    .cell-title { font-weight: 500; }
    .cell-sub { font-size: 11.5px; color: var(--text2); margin-top: 1px; }
    .cell-muted { color: var(--text2); }
    .mono { font-family: monospace; font-size: 12px; }

    .avatar {
      width: 32px; height: 32px; border-radius: 50%; background: var(--accent-dim); color: var(--accent);
      font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .avatar-blocked { background: rgba(255,77,109,.12); color: var(--red); }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green   { background: rgba(0, 229, 160, .12); color: var(--green); }
    .badge-red     { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-yellow  { background: rgba(255,209,102,.15); color: var(--yellow); }
    .badge-info    { background: var(--bg3); color: var(--text2); }
    .badge-Pago    { background: oklch(0.62 0.17 254 / .12); color: var(--accent); }
    .badge-Pendente{ background: rgba(255,209,102,.15); color: var(--yellow); }
    .badge-Atrasado{ background: rgba(255,77,109,.12); color: var(--red); }

    .plan-cell { display: flex; flex-direction: column; gap: 2px; }
    .plan-value { font-weight: 600; color: var(--text); }
    .plan-sub { font-size: 11px; color: var(--text2); }

    .xml-cell { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
    .xml-bar-wrap { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .xml-bar { height: 100%; background: var(--accent); border-radius: 2px; max-width: 100%; transition: width .3s; }
    .xml-label { font-size: 11.5px; color: var(--text2); }

    .cob-cell { display: flex; flex-direction: column; gap: 3px; }
    .cob-valor { font-weight: 600; }
    .cob-venc { font-size: 11px; color: var(--text2); }

    .actions-cell { width: 130px; }
    .action-group { display: flex; gap: 4px; flex-wrap: wrap; }
    .icon-btn {
      background: none; border: 1px solid var(--border); color: var(--text2);
      border-radius: 6px; padding: 5px; cursor: pointer; display: flex; align-items: center;
      transition: color 120ms, background 120ms, border-color 120ms;
    }
    .icon-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-dim); }
    .icon-btn-red:hover { color: var(--red); border-color: var(--red); background: rgba(255,77,109,.1); }
    .icon-btn-green:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-dim); }

    .empty-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: .875rem 1rem; border-top: 1px solid var(--border); }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 12px; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { font-size: 13px; color: var(--text2); }

    /* Modal */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-height: 92vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; padding-top: .5rem; border-top: 1px solid var(--border); margin-top: .5rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit;
    }
    .input:focus { border-color: var(--accent); }
    select.input { cursor: pointer; }
    .field-error { font-size: 11px; color: var(--red); }
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .warn-box {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(255,77,109,.08); border: 1px solid rgba(255,77,109,.2);
      border-radius: 8px; padding: .875rem 1rem; font-size: 13px; color: var(--text2); line-height: 1.5;
    }
    .warn-box svg { color: var(--red); flex-shrink: 0; margin-top: 1px; }
    .warn-box strong { color: var(--text); }

    .plan-preview {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 10px;
      padding: .875rem 1rem; display: flex; flex-direction: column; gap: 8px;
    }
    .plan-preview-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text2); }
    .plan-preview-row strong { color: var(--accent); }

    /* Sucesso */
    .success-wrap { display: flex; flex-direction: column; align-items: center; padding: 2.5rem 2rem; gap: 1rem; text-align: center; }
    .success-icon { width: 60px; height: 60px; border-radius: 50%; background: oklch(0.62 0.17 254 / .12); color: var(--accent); display: flex; align-items: center; justify-content: center; }
    .success-title { margin: 0; font-size: 1.25rem; }
    .success-sub { color: var(--text2); font-size: 14px; margin: 0; }
    .success-close-btn { min-width: 140px; justify-content: center; }

    .licenca-cell { display: flex; flex-direction: column; gap: 5px; }
    .badge-row { display: flex; gap: 4px; flex-wrap: wrap; }

    .expiry-row {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; color: var(--text2); white-space: nowrap;
    }
    .expiry-row svg { flex-shrink: 0; }

    .expiry-critico {
      color: var(--yellow);
      background: rgba(255,209,102,0.10);
      border: 1px solid rgba(255,209,102,0.25);
      border-radius: 4px; padding: 1px 6px;
    }
    .expiry-expirado {
      color: var(--red);
      background: rgba(255,77,109,0.10);
      border: 1px solid rgba(255,77,109,0.25);
      border-radius: 4px; padding: 1px 6px;
    }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 760px; }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; gap: .75rem; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-wrap { max-width: none; }
      .form-row { grid-template-columns: 1fr; }
      .modal-footer { flex-direction: column-reverse; align-items: stretch; }
    }
  `]
})
export class ContadoresListComponent implements OnInit {
  private readonly _svc    = inject(ContadorService);
  private readonly _fb     = inject(FormBuilder);
  private readonly _router = inject(Router);


  readonly contadores  = signal<ContadorDto[]>([]);
  readonly loading     = signal(true);
  readonly total       = signal(0);
  readonly page        = signal(1);
  readonly totalPages  = signal(1);
  readonly termo       = signal('');
  readonly showModal   = signal(false);
  readonly modalMode   = signal<ModalMode>('create');
  readonly submitting  = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly successInfo = signal<SuccessInfo | null>(null);

  readonly form = this._fb.group({
    nome:   ['', [Validators.required]],
    email:  ['', [Validators.required, Validators.email]],
    telefone: [''], crc: [''], empresa: [''],
    canalNotificacao: ['ambos'], notifNovasNotas: [true], notifAlertas: [true],
    notifResumoSemanal: [false], notifConsolidadoMensal: [false],
  });
  get f() { return this.form.controls; }

  private _timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this._svc.getAll({ page: this.page(), pageSize: 20, termo: this.termo() || undefined }).subscribe({
      next: r => { this.contadores.set(r.items); this.total.set(r.totalCount); this.totalPages.set(r.totalPages); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(e: Event) {
    this.termo.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.load(), 350);
  }

  changePage(p: number) { this.page.set(p); this.load(); }

  // ── Modal ──
  openCreate() {
    this.form.reset({ canalNotificacao: 'ambos', notifNovasNotas: true, notifAlertas: true });
    this.submitError.set(null); this.successInfo.set(null);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    if (this.successInfo()) { this.page.set(1); this.load(); }
    this.successInfo.set(null);
  }

  // ── Actions ──
  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true); this.submitError.set(null);
    const v = this.form.value;
    this._svc.create({ nome: v.nome!, email: v.email!, telefone: v.telefone || undefined, crc: v.crc || undefined, empresa: v.empresa || undefined, canalNotificacao: v.canalNotificacao ?? 'ambos', notifNovasNotas: v.notifNovasNotas ?? true, notifAlertas: v.notifAlertas ?? true, notifResumoSemanal: v.notifResumoSemanal ?? false, notifConsolidadoMensal: v.notifConsolidadoMensal ?? false }).subscribe({
      next: res => { this.submitting.set(false); this.successInfo.set({ nome: res.contador.nome, email: res.contador.email }); },
      error: err => { this.submitting.set(false); this.submitError.set(extractErrorMessage(err, 'Erro ao cadastrar.')); },
    });
  }

  goTo(id: string) { this._router.navigate(['/contadores', id]); }

  // ── Helpers ──
  xmlPercent(c: ContadorDto): number {
    if (!c.cobrancaAtual || c.cobrancaAtual.limiteXmlTotal === 0) return 0;
    return Math.min(100, (c.cobrancaAtual.xmlsProcessados / c.cobrancaAtual.limiteXmlTotal) * 100);
  }

  cobClass(status: string): Record<string, boolean> { return { [`badge-${status}`]: true }; }
  initial(nome: string) { return nome?.charAt(0)?.toUpperCase() ?? '?'; }

  diasParaVencer(c: ContadorDto): number | null {
    if (!c.dataLimiteAcesso) return null;
    const diff = new Date(c.dataLimiteAcesso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
