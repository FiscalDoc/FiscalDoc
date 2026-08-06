import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProdutoService, extractErrorMessage, extractFieldErrors } from '@veloxml/services';
import { ProdutoDto } from '@veloxml/models';

type Tab = 'geral' | 'fiscal';

@Component({
  selector: 'app-produto-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (loading()) {
      <div class="loading-state">Carregando...</div>
    } @else {
      <div class="page">
        <div class="page-header">
          <button class="back-btn" (click)="goBack()">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Cadastros
          </button>
          <div class="header-top">
            <h2 class="page-title">{{ isNew() ? 'Novo Produto' : form.descricao || 'Produto' }}</h2>
            @if (!isNew()) {
              <button class="btn-danger-outline" (click)="excluir()">Excluir</button>
            }
          </div>
        </div>

        <nav class="tabs">
          <button class="tab-btn" [class.active]="tab() === 'geral'" (click)="tab.set('geral')">Dados Gerais</button>
          <button class="tab-btn" [class.active]="tab() === 'fiscal'" (click)="tab.set('fiscal')">Fiscal</button>
        </nav>

        @if (tab() === 'geral') {
          <div class="card section">
            <h4 class="section-title">Dados Gerais</h4>
            <div class="form-grid">
              <div class="field">
                <label class="label">Código *</label>
                <input class="input" [class.error]="fieldErrors()['codigo']" [(ngModel)]="form.codigo" placeholder="SKU001"/>
                @if (fieldErrors()['codigo']) { <span class="field-error">{{ fieldErrors()['codigo'] }}</span> }
              </div>
              <div class="field col-2">
                <label class="label">Descrição *</label>
                <input class="input" [class.error]="fieldErrors()['descricao']" [(ngModel)]="form.descricao" placeholder="Nome do produto"/>
                @if (fieldErrors()['descricao']) { <span class="field-error">{{ fieldErrors()['descricao'] }}</span> }
              </div>
              <div class="field">
                <label class="label">Unidade *</label>
                <input class="input" [class.error]="fieldErrors()['unidade']" [(ngModel)]="form.unidade" placeholder="UN"/>
                @if (fieldErrors()['unidade']) { <span class="field-error">{{ fieldErrors()['unidade'] }}</span> }
              </div>
              <div class="field">
                <label class="label">Preço Unitário *</label>
                <input class="input" type="number" min="0" step="0.001" [(ngModel)]="form.precoUnitario"/>
              </div>
              @if (!isNew()) {
                <div class="field" style="justify-content:flex-end;padding-bottom:2px;">
                  <label class="label">Status</label>
                  <label class="toggle-row">
                    <input type="checkbox" [(ngModel)]="form.ativo" style="width:16px;height:16px;accent-color:var(--accent);"/>
                    Produto ativo
                  </label>
                </div>
              }
            </div>
          </div>
        }

        @if (tab() === 'fiscal') {
          <div class="card section">
            <h4 class="section-title">Dados Fiscais</h4>
            <p class="field-hint" style="margin:0">NCM e CFOP são obrigatórios pra emitir NF-e — sem eles, a emissão desse produto é rejeitada.</p>
            <div class="form-grid">
              <div class="field">
                <label class="label">NCM (p/ NF-e)</label>
                <input class="input" [(ngModel)]="form.ncm" placeholder="0000.00.00"/>
              </div>
              <div class="field">
                <label class="label">CFOP (p/ NF-e)</label>
                <input class="input" [(ngModel)]="form.cfop" placeholder="5102"/>
              </div>
              <div class="field">
                <label class="label">Alíquota ICMS (%)</label>
                <input class="input" type="number" min="0" step="0.01" [(ngModel)]="form.aliquotaIcms"/>
              </div>
              <div class="field">
                <label class="label">Alíquota PIS (%)</label>
                <input class="input" type="number" min="0" step="0.01" [(ngModel)]="form.aliquotaPis"/>
              </div>
              <div class="field">
                <label class="label">Alíquota COFINS (%)</label>
                <input class="input" type="number" min="0" step="0.01" [(ngModel)]="form.aliquotaCofins"/>
              </div>
            </div>
          </div>

          <div class="card section">
            <h4 class="section-title">Situação Tributária (CST)</h4>
            <p class="field-hint" style="margin:0">
              Obrigatórios pra emitir — precisam ser um código válido, não só "preenchido" (ex.: "0" sozinho é rejeitado pela SEFAZ). Regime <strong>Simples Nacional/MEI</strong> usa <strong>CSOSN de 3 dígitos</strong> no ICMS
              (ex.: 102 — sem crédito, o mais comum); regime <strong>Normal</strong> (Lucro Presumido/Real) usa <strong>CST de 2 dígitos</strong> (ex.: 00 — tributada integralmente). PIS/COFINS sempre têm 2 dígitos (ex.: 07 — isento). Confira com o contador se tiver dúvida.
            </p>
            <div class="form-grid">
              <div class="field">
                <label class="label">CST/CSOSN ICMS</label>
                <input class="input" [(ngModel)]="form.cstIcms" placeholder="102 (Simples/MEI) ou 00 (Normal)" maxlength="3"/>
              </div>
              <div class="field">
                <label class="label">CST PIS</label>
                <input class="input" [(ngModel)]="form.cstPis" placeholder="07" maxlength="2"/>
              </div>
              <div class="field">
                <label class="label">CST COFINS</label>
                <input class="input" [(ngModel)]="form.cstCofins" placeholder="07" maxlength="2"/>
              </div>
              <div class="field col-2">
                <label class="label">Origem da Mercadoria</label>
                <select class="input" [(ngModel)]="form.icmsOrigem">
                  @for (o of origensMercadoria; track o.valor) {
                    <option [ngValue]="o.valor">{{ o.valor }} - {{ o.label }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <div class="card section">
            <h4 class="section-title">IBS/CBS (Reforma Tributária)</h4>
            <p class="field-hint" style="margin:0">
              Obrigatório a partir de 03/08/2026 pra empresas do regime Normal (Simples Nacional e MEI entram só em 04/2027).
              As alíquotas do período de teste de 2026 (0,9% CBS + 0,1% IBS) são fixas por lei — o sistema já aplica sozinho, não precisa preencher aqui.
            </p>
            <div class="form-grid">
              <div class="field">
                <label class="label">CST IBS/CBS</label>
                <input class="input" [(ngModel)]="form.ibsCbsCst" placeholder="000" maxlength="3"/>
              </div>
              <div class="field">
                <label class="label" title="Classificação Tributária (cClassTrib)">Classif. Tributária</label>
                <input class="input" [(ngModel)]="form.ibsCbsClassificacaoTributaria" placeholder="000001" maxlength="6"/>
              </div>
              <div class="field">
                <label class="label">Alíquota CBS (%)</label>
                <input class="input" disabled value="0,90"/>
              </div>
              <div class="field">
                <label class="label">Alíquota IBS — UF (%)</label>
                <input class="input" disabled value="0,10"/>
              </div>
              <div class="field">
                <label class="label">Alíquota IBS — Município (%)</label>
                <input class="input" disabled value="0,00"/>
              </div>
            </div>
          </div>
        }

        @if (erro()) { <div class="alert-error">{{ erro() }}</div> }
        @if (sucesso()) { <div class="alert-ok">Produto salvo!</div> }

        <div class="form-actions">
          <button class="btn-ghost" (click)="goBack()">Cancelar</button>
          <button class="btn-primary" [disabled]="salvando()" (click)="salvar()">
            {{ salvando() ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; align-self: flex-start; }
    .back-btn:hover { color: var(--accent); }
    .header-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .btn-danger-outline { background: none; border: 1px solid rgba(255,77,109,.4); color: var(--red); border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: pointer; }
    .btn-danger-outline:hover { background: rgba(255,77,109,.1); }

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; }
    .input:focus { border-color: var(--accent); }
    .input.error { border-color: var(--red); }
    .field-error { font-size: 11px; color: var(--red); }
    .field-hint { font-size: 12px; color: var(--text2); }
    .toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); margin-top: 6px; }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { background: oklch(0.62 0.17 254 / .1); border: 1px solid oklch(0.62 0.17 254 / .3); color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }

    /* Tablet/iPad e mobile */
    @media (max-width: 640px) {
      .header-top { flex-direction: column; align-items: stretch; }
      .form-grid { grid-template-columns: 1fr; }
      .col-2 { grid-column: span 1; }
      .form-actions { flex-direction: column-reverse; }
      .form-actions button { width: 100%; }
    }
  `],
})
export class ProdutoDetailComponent implements OnInit {
  private readonly _svc    = inject(ProdutoService);
  private readonly _route  = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  private clienteId = '';
  private produtoId = '';

  readonly isNew    = signal(true);
  readonly loading  = signal(true);
  readonly salvando = signal(false);
  readonly erro     = signal<string | null>(null);
  readonly sucesso  = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly tab      = signal<Tab>('geral');

  form = this._empty();

  readonly origensMercadoria = [
    { valor: 0, label: 'Nacional' },
    { valor: 1, label: 'Estrangeira (importação direta)' },
    { valor: 2, label: 'Estrangeira (adquirida no mercado interno)' },
    { valor: 3, label: 'Nacional (conteúdo de importação entre 40% e 70%)' },
    { valor: 4, label: 'Nacional (Processos Produtivos Básicos)' },
    { valor: 5, label: 'Nacional (conteúdo de importação até 40%)' },
    { valor: 6, label: 'Estrangeira (importação direta, sem similar nacional)' },
    { valor: 7, label: 'Estrangeira (mercado interno, sem similar nacional)' },
    { valor: 8, label: 'Nacional (conteúdo de importação acima de 70%)' },
  ];

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.produtoId = this._route.snapshot.paramMap.get('produtoId') ?? '';
    this.isNew.set(!this.produtoId || this.produtoId === 'novo');

    if (this.isNew()) {
      this.loading.set(false);
      return;
    }

    this._svc.getById(this.clienteId, this.produtoId).subscribe({
      next: p => { this._sync(p); this.loading.set(false); },
      error: () => { this.loading.set(false); this.erro.set('Produto não encontrado.'); },
    });
  }

  private _sync(p: ProdutoDto): void {
    this.form = {
      codigo: p.codigo, descricao: p.descricao, ncm: p.ncm ?? '', unidade: p.unidade,
      cfop: p.cfop ?? '', precoUnitario: p.precoUnitario, aliquotaIcms: p.aliquotaIcms,
      aliquotaPis: p.aliquotaPis, aliquotaCofins: p.aliquotaCofins, ativo: p.ativo,
      cstIcms: p.cstIcms ?? '', cstPis: p.cstPis ?? '', cstCofins: p.cstCofins ?? '',
      icmsOrigem: p.icmsOrigem ?? 0,
      ibsCbsCst: p.ibsCbsCst ?? '', ibsCbsClassificacaoTributaria: p.ibsCbsClassificacaoTributaria ?? '',
    };
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'produtos']); }

  salvar(): void {
    if (this.salvando()) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(false);
    this.fieldErrors.set({});

    const req = {
      codigo: this.form.codigo,
      descricao: this.form.descricao,
      ncm: this.form.ncm || undefined,
      unidade: this.form.unidade || 'UN',
      cfop: this.form.cfop || undefined,
      precoUnitario: +this.form.precoUnitario,
      aliquotaIcms: +this.form.aliquotaIcms,
      aliquotaPis: +this.form.aliquotaPis,
      aliquotaCofins: +this.form.aliquotaCofins,
      cstIcms: this.form.cstIcms || undefined,
      cstPis: this.form.cstPis || undefined,
      cstCofins: this.form.cstCofins || undefined,
      icmsOrigem: +this.form.icmsOrigem,
      ibsCbsCst: this.form.ibsCbsCst || undefined,
      ibsCbsClassificacaoTributaria: this.form.ibsCbsClassificacaoTributaria || undefined,
    };

    const obs = this.isNew()
      ? this._svc.create(this.clienteId, req)
      : this._svc.update(this.clienteId, this.produtoId, { ...req, ativo: this.form.ativo });

    obs.subscribe({
      next: p => {
        this.salvando.set(false);
        this.sucesso.set(true);
        if (this.isNew()) { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'produtos', p.id]); }
        else { this._sync(p); }
        setTimeout(() => this.sucesso.set(false), 3000);
      },
      error: err => {
        this.salvando.set(false);
        this.erro.set(extractErrorMessage(err, 'Erro ao salvar produto.'));
        this.fieldErrors.set(extractFieldErrors(err) ?? {});
      },
    });
  }

  excluir(): void {
    if (!confirm(`Excluir o produto "${this.form.descricao}"? Esta ação não pode ser desfeita.`)) return;
    this._svc.delete(this.clienteId, this.produtoId).subscribe({
      next: () => this.goBack(),
      error: err => this.erro.set(extractErrorMessage(err, 'Erro ao excluir produto.')),
    });
  }

  private _empty() {
    return {
      codigo: '', descricao: '', ncm: '', unidade: 'UN', cfop: '', precoUnitario: 0,
      aliquotaIcms: 0, aliquotaPis: 0, aliquotaCofins: 0, ativo: true,
      cstIcms: '', cstPis: '', cstCofins: '', icmsOrigem: 0,
      ibsCbsCst: '', ibsCbsClassificacaoTributaria: '',
    };
  }
}
