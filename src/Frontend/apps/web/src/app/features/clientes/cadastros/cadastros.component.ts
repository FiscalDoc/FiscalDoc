import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProdutoService, DestinatarioService, extractErrorMessage } from '@veloxml/services';
import { ProdutoDto, CreateProdutoRequest, DestinatarioDto, CreateDestinatarioRequest } from '@veloxml/models';

type Tab = 'produtos' | 'destinatarios';

@Component({
  selector: 'app-cadastros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao cliente
        </button>
        <h2 class="page-title">Cadastros</h2>
      </div>

      <nav class="tabs">
        <button class="tab-btn" [class.active]="tab() === 'produtos'" (click)="tab.set('produtos')">Produtos</button>
        <button class="tab-btn" [class.active]="tab() === 'destinatarios'" (click)="tab.set('destinatarios')">Destinatários (Clientes)</button>
      </nav>

      <!-- ── Produtos Tab ── -->
      @if (tab() === 'produtos') {
        <div class="card section">
          <div class="list-header">
            <div class="search-box">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <input class="search-input" [(ngModel)]="termoProduto" (input)="buscarProdutos()" placeholder="Buscar produto..."/>
            </div>
            <button class="btn-primary" (click)="abrirFormProduto()">+ Novo Produto</button>
          </div>

          @if (loadingProdutos()) {
            <div class="empty">Carregando...</div>
          } @else if (produtos().length === 0) {
            <div class="empty">Nenhum produto cadastrado.</div>
          } @else {
            <table class="table">
              <thead>
                <tr><th>Código</th><th>Descrição</th><th>NCM</th><th>Unidade</th><th>Preço</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                @for (p of produtos(); track p.id) {
                  <tr>
                    <td class="mono">{{ p.codigo }}</td>
                    <td>{{ p.descricao }}</td>
                    <td class="mono">{{ p.ncm ?? '-' }}</td>
                    <td>{{ p.unidade }}</td>
                    <td>{{ p.precoUnitario | currency:'BRL':'symbol':'1.2-2' }}</td>
                    <td><span class="badge" [class.badge-green]="p.ativo" [class.badge-red]="!p.ativo">{{ p.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                    <td>
                      <button class="row-btn" (click)="editarProduto(p)">Editar</button>
                      <button class="row-btn danger" (click)="excluirProduto(p)">Excluir</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        @if (formProduto()) {
          <div class="modal-overlay" (click)="fecharFormProduto()">
            <div class="modal" (click)="$event.stopPropagation()">
              <h4 class="modal-title">{{ editandoProdutoId() ? 'Editar Produto' : 'Novo Produto' }}</h4>
              <div class="form-grid">
                <div class="field">
                  <label class="label">Código *</label>
                  <input class="input" [(ngModel)]="fprod.codigo" placeholder="SKU001"/>
                </div>
                <div class="field col-2">
                  <label class="label">Descrição *</label>
                  <input class="input" [(ngModel)]="fprod.descricao" placeholder="Nome do produto"/>
                </div>
                <div class="field">
                  <label class="label">NCM</label>
                  <input class="input" [(ngModel)]="fprod.ncm" placeholder="0000.00.00"/>
                </div>
                <div class="field">
                  <label class="label">Unidade *</label>
                  <input class="input" [(ngModel)]="fprod.unidade" placeholder="UN"/>
                </div>
                <div class="field">
                  <label class="label">CFOP</label>
                  <input class="input" [(ngModel)]="fprod.cfop" placeholder="5102"/>
                </div>
                <div class="field">
                  <label class="label">Preço Unitário *</label>
                  <input class="input" type="number" [(ngModel)]="fprod.precoUnitario" min="0" step="0.01"/>
                </div>
                <div class="field">
                  <label class="label">Alíquota ICMS (%)</label>
                  <input class="input" type="number" [(ngModel)]="fprod.aliquotaIcms" min="0" step="0.01"/>
                </div>
                <div class="field">
                  <label class="label">Alíquota PIS (%)</label>
                  <input class="input" type="number" [(ngModel)]="fprod.aliquotaPis" min="0" step="0.01"/>
                </div>
                <div class="field">
                  <label class="label">Alíquota COFINS (%)</label>
                  <input class="input" type="number" [(ngModel)]="fprod.aliquotaCofins" min="0" step="0.01"/>
                </div>
              </div>
              @if (erroProduto()) { <div class="alert-error">{{ erroProduto() }}</div> }
              <div class="modal-actions">
                <button class="btn-ghost" (click)="fecharFormProduto()">Cancelar</button>
                <button class="btn-primary" [disabled]="salvandoProduto()" (click)="salvarProduto()">
                  {{ salvandoProduto() ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- ── Destinatários Tab ── -->
      @if (tab() === 'destinatarios') {
        <div class="card section">
          <div class="list-header">
            <div class="search-box">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <input class="search-input" [(ngModel)]="termoDest" (input)="buscarDestinatarios()" placeholder="Buscar destinatário..."/>
            </div>
            <button class="btn-primary" (click)="abrirFormDest()">+ Novo Destinatário</button>
          </div>

          @if (loadingDest()) {
            <div class="empty">Carregando...</div>
          } @else if (destinatarios().length === 0) {
            <div class="empty">Nenhum destinatário cadastrado.</div>
          } @else {
            <table class="table">
              <thead>
                <tr><th>Razão Social</th><th>CPF/CNPJ</th><th>Cidade/UF</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                @for (d of destinatarios(); track d.id) {
                  <tr>
                    <td>
                      <div>{{ d.razaoSocial }}</div>
                      @if (d.nomeFantasia) { <div class="sub-text">{{ d.nomeFantasia }}</div> }
                    </td>
                    <td class="mono">{{ d.cpfCnpj ?? '-' }}</td>
                    <td>{{ d.cidade ? (d.cidade + '/' + d.estado) : '-' }}</td>
                    <td><span class="badge" [class.badge-green]="d.ativo" [class.badge-red]="!d.ativo">{{ d.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                    <td>
                      <button class="row-btn" (click)="editarDest(d)">Editar</button>
                      <button class="row-btn danger" (click)="excluirDest(d)">Excluir</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        @if (formDest()) {
          <div class="modal-overlay" (click)="fecharFormDest()">
            <div class="modal" (click)="$event.stopPropagation()">
              <h4 class="modal-title">{{ editandoDestId() ? 'Editar Destinatário' : 'Novo Destinatário' }}</h4>
              <div class="form-grid">
                <div class="field col-2">
                  <label class="label">Razão Social *</label>
                  <input class="input" [(ngModel)]="fdest.razaoSocial" placeholder="Empresa Ltda"/>
                </div>
                <div class="field col-2">
                  <label class="label">Nome Fantasia</label>
                  <input class="input" [(ngModel)]="fdest.nomeFantasia" placeholder="Opcional"/>
                </div>
                <div class="field">
                  <label class="label">CPF / CNPJ</label>
                  <input class="input" [(ngModel)]="fdest.cpfCnpj" placeholder="00.000.000/0001-00"/>
                </div>
                <div class="field">
                  <label class="label">Inscrição Estadual</label>
                  <input class="input" [(ngModel)]="fdest.inscricaoEstadual" placeholder="Opcional"/>
                </div>
                <div class="field">
                  <label class="label">E-mail</label>
                  <input class="input" [(ngModel)]="fdest.email" type="email"/>
                </div>
                <div class="field">
                  <label class="label">Telefone</label>
                  <input class="input" [(ngModel)]="fdest.telefone" placeholder="(11) 99999-9999"/>
                </div>
                <div class="field col-2">
                  <label class="label">Logradouro</label>
                  <input class="input" [(ngModel)]="fdest.logradouro"/>
                </div>
                <div class="field">
                  <label class="label">Número</label>
                  <input class="input" [(ngModel)]="fdest.numero"/>
                </div>
                <div class="field">
                  <label class="label">Complemento</label>
                  <input class="input" [(ngModel)]="fdest.complemento"/>
                </div>
                <div class="field">
                  <label class="label">Bairro</label>
                  <input class="input" [(ngModel)]="fdest.bairro"/>
                </div>
                <div class="field">
                  <label class="label">CEP</label>
                  <input class="input" [(ngModel)]="fdest.cep" placeholder="00000-000"/>
                </div>
                <div class="field">
                  <label class="label">Cidade</label>
                  <input class="input" [(ngModel)]="fdest.cidade"/>
                </div>
                <div class="field">
                  <label class="label">UF</label>
                  <input class="input" [(ngModel)]="fdest.estado" maxlength="2" placeholder="SP"/>
                </div>
                <div class="field">
                  <label class="label">Código IBGE</label>
                  <input class="input" [(ngModel)]="fdest.codigoIbgeCidade" placeholder="3550308"/>
                </div>
              </div>
              @if (erroDest()) { <div class="alert-error">{{ erroDest() }}</div> }
              <div class="modal-actions">
                <button class="btn-ghost" (click)="fecharFormDest()">Cancelar</button>
                <button class="btn-primary" [disabled]="salvandoDest()" (click)="salvarDest()">
                  {{ salvandoDest() ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .25rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; }
    .back-btn:hover { color: var(--accent); }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .list-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .search-box { display: flex; align-items: center; gap: 6px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; color: var(--text2); flex: 1; max-width: 320px; }
    .search-input { background: none; border: none; outline: none; color: var(--text); font-size: 13px; flex: 1; }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 2rem; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .mono { font-family: monospace; font-size: 12px; }
    .sub-text { font-size: 11px; color: var(--text2); margin-top: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-red { background: rgba(255,77,109,.12); color: var(--red); }
    .row-btn { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer; margin-right: 4px; }
    .row-btn:hover { color: var(--accent); border-color: var(--accent); }
    .row-btn.danger:hover { color: var(--red); border-color: var(--red); }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; }
    .modal-title { margin: 0 0 1rem; font-size: 1rem; font-weight: 700; color: var(--text); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; }
    .input:focus { border-color: var(--accent); }
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.25rem; }
  `],
})
export class CadastrosComponent implements OnInit {
  private readonly _prodSvc  = inject(ProdutoService);
  private readonly _destSvc  = inject(DestinatarioService);
  private readonly _route    = inject(ActivatedRoute);
  private readonly _router   = inject(Router);

  private clienteId = '';

  readonly tab = signal<Tab>('produtos');

  readonly produtos        = signal<ProdutoDto[]>([]);
  readonly loadingProdutos = signal(false);
  readonly formProduto     = signal(false);
  readonly editandoProdutoId = signal<string | null>(null);
  readonly salvandoProduto = signal(false);
  readonly erroProduto     = signal<string | null>(null);
  termoProduto = '';

  readonly destinatarios   = signal<DestinatarioDto[]>([]);
  readonly loadingDest     = signal(false);
  readonly formDest        = signal(false);
  readonly editandoDestId  = signal<string | null>(null);
  readonly salvandoDest    = signal(false);
  readonly erroDest        = signal<string | null>(null);
  termoDest = '';

  fprod = this._emptyProd();
  fdest = this._emptyDest();

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.buscarProdutos();
    this.buscarDestinatarios();
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId]); }

  // ── Produtos ──
  buscarProdutos(): void {
    this.loadingProdutos.set(true);
    this._prodSvc.getAll(this.clienteId, { termo: this.termoProduto }).subscribe({
      next: r => { this.produtos.set(r.items as ProdutoDto[]); this.loadingProdutos.set(false); },
      error: () => this.loadingProdutos.set(false),
    });
  }

  abrirFormProduto(): void { this.fprod = this._emptyProd(); this.editandoProdutoId.set(null); this.erroProduto.set(null); this.formProduto.set(true); }
  fecharFormProduto(): void { this.formProduto.set(false); }

  editarProduto(p: ProdutoDto): void {
    this.fprod = { codigo: p.codigo, descricao: p.descricao, ncm: p.ncm ?? '', unidade: p.unidade, cfop: p.cfop ?? '', precoUnitario: p.precoUnitario, aliquotaIcms: p.aliquotaIcms, aliquotaPis: p.aliquotaPis, aliquotaCofins: p.aliquotaCofins };
    this.editandoProdutoId.set(p.id);
    this.erroProduto.set(null);
    this.formProduto.set(true);
  }

  salvarProduto(): void {
    if (this.salvandoProduto()) return;
    this.salvandoProduto.set(true);
    this.erroProduto.set(null);
    const id = this.editandoProdutoId();
    const req: CreateProdutoRequest = {
      codigo: this.fprod.codigo,
      descricao: this.fprod.descricao,
      ncm: this.fprod.ncm || undefined,
      unidade: this.fprod.unidade || 'UN',
      cfop: this.fprod.cfop || undefined,
      precoUnitario: +this.fprod.precoUnitario,
      aliquotaIcms: +this.fprod.aliquotaIcms,
      aliquotaPis: +this.fprod.aliquotaPis,
      aliquotaCofins: +this.fprod.aliquotaCofins,
    };
    const obs = id
      ? this._prodSvc.update(this.clienteId, id, { ...req, ativo: true })
      : this._prodSvc.create(this.clienteId, req);

    obs.subscribe({
      next: () => { this.salvandoProduto.set(false); this.formProduto.set(false); this.buscarProdutos(); },
      error: (err) => { this.salvandoProduto.set(false); this.erroProduto.set(extractErrorMessage(err, 'Erro ao salvar produto.')); },
    });
  }

  excluirProduto(p: ProdutoDto): void {
    if (!confirm(`Excluir produto "${p.descricao}"?`)) return;
    this._prodSvc.delete(this.clienteId, p.id).subscribe({ next: () => this.buscarProdutos() });
  }

  // ── Destinatários ──
  buscarDestinatarios(): void {
    this.loadingDest.set(true);
    this._destSvc.getAll(this.clienteId, { termo: this.termoDest }).subscribe({
      next: r => { this.destinatarios.set(r.items as DestinatarioDto[]); this.loadingDest.set(false); },
      error: () => this.loadingDest.set(false),
    });
  }

  abrirFormDest(): void { this.fdest = this._emptyDest(); this.editandoDestId.set(null); this.erroDest.set(null); this.formDest.set(true); }
  fecharFormDest(): void { this.formDest.set(false); }

  editarDest(d: DestinatarioDto): void {
    this.fdest = {
      razaoSocial: d.razaoSocial, nomeFantasia: d.nomeFantasia ?? '', cpfCnpj: d.cpfCnpj ?? '',
      inscricaoEstadual: d.inscricaoEstadual ?? '', email: d.email ?? '', telefone: d.telefone ?? '',
      logradouro: d.logradouro ?? '', numero: d.numero ?? '', complemento: d.complemento ?? '',
      bairro: d.bairro ?? '', cep: d.cep ?? '', cidade: d.cidade ?? '', estado: d.estado ?? '',
      codigoIbgeCidade: d.codigoIbgeCidade ?? '',
    };
    this.editandoDestId.set(d.id);
    this.erroDest.set(null);
    this.formDest.set(true);
  }

  salvarDest(): void {
    if (this.salvandoDest()) return;
    this.salvandoDest.set(true);
    this.erroDest.set(null);
    const id = this.editandoDestId();
    const req: CreateDestinatarioRequest = {
      razaoSocial: this.fdest.razaoSocial,
      nomeFantasia: this.fdest.nomeFantasia || undefined,
      cpfCnpj: this.fdest.cpfCnpj || undefined,
      inscricaoEstadual: this.fdest.inscricaoEstadual || undefined,
      email: this.fdest.email || undefined,
      telefone: this.fdest.telefone || undefined,
      logradouro: this.fdest.logradouro || undefined,
      numero: this.fdest.numero || undefined,
      complemento: this.fdest.complemento || undefined,
      bairro: this.fdest.bairro || undefined,
      cep: this.fdest.cep || undefined,
      cidade: this.fdest.cidade || undefined,
      estado: this.fdest.estado || undefined,
      codigoIbgeCidade: this.fdest.codigoIbgeCidade || undefined,
    };
    const obs = id
      ? this._destSvc.update(this.clienteId, id, { ...req, ativo: true })
      : this._destSvc.create(this.clienteId, req);

    obs.subscribe({
      next: () => { this.salvandoDest.set(false); this.formDest.set(false); this.buscarDestinatarios(); },
      error: (err) => { this.salvandoDest.set(false); this.erroDest.set(extractErrorMessage(err, 'Erro ao salvar destinatário.')); },
    });
  }

  excluirDest(d: DestinatarioDto): void {
    if (!confirm(`Excluir "${d.razaoSocial}"?`)) return;
    this._destSvc.delete(this.clienteId, d.id).subscribe({ next: () => this.buscarDestinatarios() });
  }

  private _emptyProd() {
    return { codigo: '', descricao: '', ncm: '', unidade: 'UN', cfop: '', precoUnitario: 0, aliquotaIcms: 0, aliquotaPis: 0, aliquotaCofins: 0 };
  }

  private _emptyDest() {
    return { razaoSocial: '', nomeFantasia: '', cpfCnpj: '', inscricaoEstadual: '', email: '', telefone: '', logradouro: '', numero: '', complemento: '', bairro: '', cep: '', cidade: '', estado: '', codigoIbgeCidade: '' };
  }
}
