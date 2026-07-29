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
                <input class="input" type="number" min="0" step="0.01" [(ngModel)]="form.precoUnitario"/>
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
            <div class="form-grid">
              <div class="field">
                <label class="label">NCM</label>
                <input class="input" [(ngModel)]="form.ncm" placeholder="0000.00.00"/>
              </div>
              <div class="field">
                <label class="label">CFOP</label>
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
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; }
    .input:focus { border-color: var(--accent); }
    .input.error { border-color: var(--red); }
    .field-error { font-size: 11px; color: var(--red); }
    .toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); margin-top: 6px; }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { background: rgba(0,229,160,.1); border: 1px solid rgba(0,229,160,.3); color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
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
    return { codigo: '', descricao: '', ncm: '', unidade: 'UN', cfop: '', precoUnitario: 0, aliquotaIcms: 0, aliquotaPis: 0, aliquotaCofins: 0, ativo: true };
  }
}
