import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProdutoService, DestinatarioService } from '@veloxml/services';
import { ProdutoDto, DestinatarioDto } from '@veloxml/models';

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
            <button class="btn-primary" (click)="abrirProduto('novo')">+ Novo Produto</button>
          </div>

          @if (loadingProdutos()) {
            <div class="empty">Carregando...</div>
          } @else if (produtos().length === 0) {
            <div class="empty">Nenhum produto cadastrado.</div>
          } @else {
            <table class="table">
              <thead>
                <tr><th>Código</th><th>Descrição</th><th>NCM</th><th>Unidade</th><th>Preço</th><th>Status</th></tr>
              </thead>
              <tbody>
                @for (p of produtos(); track p.id) {
                  <tr class="row-link" (click)="abrirProduto(p.id)">
                    <td class="mono">{{ p.codigo }}</td>
                    <td>{{ p.descricao }}</td>
                    <td class="mono">{{ p.ncm ?? '-' }}</td>
                    <td>{{ p.unidade }}</td>
                    <td>{{ p.precoUnitario | currency:'BRL':'symbol':'1.2-2' }}</td>
                    <td><span class="badge" [class.badge-green]="p.ativo" [class.badge-red]="!p.ativo">{{ p.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
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
            <button class="btn-primary" (click)="abrirDestinatario('novo')">+ Novo Destinatário</button>
          </div>

          @if (loadingDest()) {
            <div class="empty">Carregando...</div>
          } @else if (destinatarios().length === 0) {
            <div class="empty">Nenhum destinatário cadastrado.</div>
          } @else {
            <table class="table">
              <thead>
                <tr><th>Razão Social</th><th>CPF/CNPJ</th><th>Cidade/UF</th><th>Status</th></tr>
              </thead>
              <tbody>
                @for (d of destinatarios(); track d.id) {
                  <tr class="row-link" (click)="abrirDestinatario(d.id)">
                    <td>
                      <div>{{ d.razaoSocial }}</div>
                      @if (d.nomeFantasia) { <div class="sub-text">{{ d.nomeFantasia }}</div> }
                    </td>
                    <td class="mono">{{ d.cpfCnpj ?? '-' }}</td>
                    <td>{{ d.cidade ? (d.cidade + '/' + d.estado) : '-' }}</td>
                    <td><span class="badge" [class.badge-green]="d.ativo" [class.badge-red]="!d.ativo">{{ d.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
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
    .row-link { cursor: pointer; }
    .row-link:hover td { background: rgba(255,255,255,.02); }
    .mono { font-family: monospace; font-size: 12px; }
    .sub-text { font-size: 11px; color: var(--text2); margin-top: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-red { background: rgba(255,77,109,.12); color: var(--red); }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:hover { opacity: .88; }
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
  termoProduto = '';

  readonly destinatarios   = signal<DestinatarioDto[]>([]);
  readonly loadingDest     = signal(false);
  termoDest = '';

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    const tabParam = this._route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'destinatarios') this.tab.set('destinatarios');

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

  abrirProduto(id: string): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'produtos', id]); }

  // ── Destinatários ──
  buscarDestinatarios(): void {
    this.loadingDest.set(true);
    this._destSvc.getAll(this.clienteId, { termo: this.termoDest }).subscribe({
      next: r => { this.destinatarios.set(r.items as DestinatarioDto[]); this.loadingDest.set(false); },
      error: () => this.loadingDest.set(false),
    });
  }

  abrirDestinatario(id: string): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'destinatarios', id]); }
}
