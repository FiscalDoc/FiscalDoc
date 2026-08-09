import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, ProdutoService } from '@veloxml/services';
import { ProdutoDto } from '@veloxml/models';

@Component({
  selector: 'app-produtos-list',
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
        <h2 class="page-title">Produtos</h2>
      </div>

      <div class="card section">
        <div class="list-header">
          <div class="search-box">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input class="search-input" [(ngModel)]="termo" (input)="buscar()" placeholder="Buscar produto..."/>
          </div>
          <button class="btn-primary" (click)="abrirProduto('novo')">+ Novo Produto</button>
        </div>

        <div class="filter-bar">
          <button class="filter-btn" [class.active]="filtroAtivo() === null" (click)="filtrarAtivo(null)">Todos</button>
          <button class="filter-btn" [class.active]="filtroAtivo() === true" (click)="filtrarAtivo(true)">Ativos</button>
          <button class="filter-btn" [class.active]="filtroAtivo() === false" (click)="filtrarAtivo(false)">Inativos</button>
        </div>

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (produtos().length === 0) {
          @if (termo) {
            <div class="empty">
              <p>Nenhum produto encontrado pra "{{ termo }}".</p>
              <button class="btn-ghost-sm" (click)="termo = ''; buscar()">Limpar busca</button>
            </div>
          } @else {
            <div class="empty">
              <p>Você ainda não tem nenhum produto cadastrado.</p>
              <button class="btn-primary" (click)="abrirProduto('novo')">+ Cadastrar o primeiro produto</button>
            </div>
          }
        } @else {
          <div class="table-scroll">
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
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .25rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; }
    .back-btn:hover { color: var(--accent); }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .list-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .search-box { display: flex; align-items: center; gap: 6px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; color: var(--text2); flex: 1; max-width: 320px; }
    .search-input { background: none; border: none; outline: none; color: var(--text); font-size: 13px; flex: 1; }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 2rem; }
    .empty p { margin: 0 0 1rem; }
    .btn-ghost-sm { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .45rem .875rem; font-size: 12.5px; cursor: pointer; }
    .filter-bar { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .875rem; }
    .filter-btn { background: var(--bg2); border: 1px solid var(--border); color: var(--text2); border-radius: 20px; padding: 4px 14px; font-size: 12px; cursor: pointer; }
    .filter-btn:hover { border-color: var(--text2); color: var(--text); }
    .filter-btn.active { background: var(--accent); color: #0d0f14; border-color: var(--accent); font-weight: 600; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .row-link { cursor: pointer; }
    .row-link:hover td { background: rgba(255,255,255,.02); }
    .mono { font-family: monospace; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: rgba(0, 229, 160, .12); color: var(--green); }
    .badge-red { background: rgba(255,77,109,.12); color: var(--red); }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:hover { opacity: .88; }
    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 640px; }

    @media (max-width: 640px) {
      .list-header { flex-direction: column; align-items: stretch; }
      .search-box { max-width: none; }
    }
  `],
})
export class ProdutosListComponent implements OnInit {
  private readonly _prodSvc = inject(ProdutoService);
  private readonly _route   = inject(ActivatedRoute);
  private readonly _router  = inject(Router);
  private readonly _auth    = inject(AuthService);

  private clienteId = '';
  readonly isCliente = computed(() => this._auth.currentUser()?.perfil === 'Cliente');

  readonly produtos = signal<ProdutoDto[]>([]);
  readonly loading  = signal(false);
  readonly filtroAtivo = signal<boolean | null>(null);
  termo = '';

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.buscar();
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId]); }

  filtrarAtivo(v: boolean | null): void {
    this.filtroAtivo.set(v);
    this.buscar();
  }

  buscar(): void {
    this.loading.set(true);
    const ativo = this.filtroAtivo();
    this._prodSvc.getAll(this.clienteId, { termo: this.termo, ativo: ativo ?? undefined }).subscribe({
      next: r => { this.produtos.set(r.items as ProdutoDto[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirProduto(id: string): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'produtos', id]); }
}
