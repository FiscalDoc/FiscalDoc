import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BlogAdminService, extractErrorMessage } from '@veloxml/services';
import { BlogCategoriaDto, BlogPostDto } from '@veloxml/models';

@Component({
  selector: 'app-blog-admin-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Blog</h2>
        <div class="header-actions">
          <button class="btn-ghost" (click)="abrirCategorias()">Categorias</button>
          <button class="btn-primary" (click)="novaPostagem()">+ Nova Postagem</button>
        </div>
      </div>

      <div class="card section">
        <div class="filters">
          <div class="search-box">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input class="search-input" [(ngModel)]="termo" (input)="buscar()" placeholder="Buscar por título..."/>
          </div>
          <select class="select" [(ngModel)]="status" (change)="buscar()">
            <option value="">Todos os status</option>
            <option value="Rascunho">Rascunho</option>
            <option value="Publicado">Publicado</option>
          </select>
          <select class="select" [(ngModel)]="categoriaId" (change)="buscar()">
            <option value="">Todas as categorias</option>
            @for (c of categorias(); track c.id) {
              <option [value]="c.id">{{ c.nome }}</option>
            }
          </select>
        </div>

        @if (erro()) { <div class="alert-error">{{ erro() }}</div> }

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (posts().length === 0) {
          <div class="empty">Nenhuma postagem cadastrada.</div>
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr><th>Título</th><th>Categoria</th><th>Autor</th><th>Data</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (p of posts(); track p.id) {
                <tr class="row-link" (click)="editar(p.id)">
                  <td>{{ p.titulo }}</td>
                  <td>{{ p.categoriaNome ?? '-' }}</td>
                  <td>{{ p.autor }}</td>
                  <td>{{ p.dataPublicacao ? (p.dataPublicacao | date:'dd/MM/yyyy') : '-' }}</td>
                  <td><span class="badge" [class]="badgeClass(p)">{{ statusLabel(p) }}</span></td>
                  <td class="actions" (click)="$event.stopPropagation()">
                    @if (p.status === 'Rascunho') {
                      <button class="link-btn" (click)="publicar(p)">Publicar</button>
                    } @else {
                      <button class="link-btn" (click)="despublicar(p)">Despublicar</button>
                    }
                    <button class="link-btn danger" (click)="excluir(p)">Excluir</button>
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

    @if (showCategorias()) {
      <div class="overlay" (click)="fecharCategorias()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title">Categorias do Blog</h3>
            <button class="modal-close" (click)="fecharCategorias()">✕</button>
          </header>
          <div class="modal-body">
            @if (erroCategoria()) { <div class="alert-error">{{ erroCategoria() }}</div> }
            <div class="cat-add">
              <input class="input" [(ngModel)]="novaCategoriaNome" placeholder="Nova categoria..." (keyup.enter)="criarCategoria()"/>
              <button class="btn-primary" (click)="criarCategoria()">Adicionar</button>
            </div>
            <ul class="cat-list">
              @for (c of categorias(); track c.id) {
                <li class="cat-item">
                  <span>{{ c.nome }}</span>
                  <button class="link-btn danger" (click)="excluirCategoria(c)">Excluir</button>
                </li>
              }
              @if (categorias().length === 0) {
                <li class="cat-empty">Nenhuma categoria cadastrada.</li>
              }
            </ul>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .header-actions { display: flex; gap: .75rem; }
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
    .row-link { cursor: pointer; }
    .row-link:hover td { background: rgba(255,255,255,.02); }
    .actions { display: flex; gap: .75rem; white-space: nowrap; }
    .link-btn { background: none; border: none; color: var(--accent); font-size: 12.5px; cursor: pointer; padding: 0; }
    .link-btn.danger { color: var(--red); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-rascunho { background: rgba(255,255,255,.08); color: var(--text2); }
    .badge-publicado { background: oklch(0.62 0.17 254 / .12); color: var(--accent); }
    .badge-agendado { background: rgba(255,193,7,.15); color: #ffc107; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:hover { opacity: .88; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: .5rem; }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { color: var(--text2); font-size: 13px; }
    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 640px; }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; gap: .75rem; }
      .header-actions { flex-direction: column; align-items: stretch; }
      .search-box { max-width: none; }
    }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 420px; max-height: 92vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .cat-add { display: flex; gap: .5rem; }
    .input { flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; }
    .cat-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
    .cat-item { display: flex; align-items: center; justify-content: space-between; padding: .5rem .75rem; background: var(--bg3); border-radius: 8px; font-size: 13.5px; color: var(--text); }
    .cat-empty { color: var(--text2); font-size: 13px; text-align: center; padding: 1rem; }
  `],
})
export class BlogAdminListComponent implements OnInit {
  private readonly _svc = inject(BlogAdminService);
  private readonly _router = inject(Router);

  readonly posts = signal<BlogPostDto[]>([]);
  readonly categorias = signal<BlogCategoriaDto[]>([]);
  readonly loading = signal(false);
  readonly erro = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly showCategorias = signal(false);
  readonly erroCategoria = signal<string | null>(null);
  novaCategoriaNome = '';

  termo = '';
  status = '';
  categoriaId = '';

  ngOnInit(): void {
    this._carregarCategorias();
    this.buscar();
  }

  novaPostagem(): void { this._router.navigate(['/admin/blog/nova-postagem']); }
  editar(id: string): void { this._router.navigate(['/admin/blog/editar', id]); }

  buscar(): void {
    this.page.set(1);
    this._carregar();
  }

  irPara(page: number): void {
    this.page.set(page);
    this._carregar();
  }

  statusLabel(p: BlogPostDto): string {
    if (p.status === 'Rascunho') return 'Rascunho';
    if (p.dataPublicacao && new Date(p.dataPublicacao) > new Date()) return 'Agendado';
    return 'Publicado';
  }

  badgeClass(p: BlogPostDto): string {
    const label = this.statusLabel(p);
    if (label === 'Agendado') return 'badge badge-agendado';
    if (label === 'Publicado') return 'badge badge-publicado';
    return 'badge badge-rascunho';
  }

  publicar(p: BlogPostDto): void {
    this._svc.publicar(p.id).subscribe({
      next: () => this._carregar(),
      error: err => this.erro.set(extractErrorMessage(err, 'Erro ao publicar postagem.')),
    });
  }

  despublicar(p: BlogPostDto): void {
    this._svc.despublicar(p.id).subscribe({
      next: () => this._carregar(),
      error: err => this.erro.set(extractErrorMessage(err, 'Erro ao despublicar postagem.')),
    });
  }

  excluir(p: BlogPostDto): void {
    if (!confirm(`Excluir a postagem "${p.titulo}"? Esta ação não pode ser desfeita.`)) return;
    this._svc.delete(p.id).subscribe({
      next: () => this._carregar(),
      error: err => this.erro.set(extractErrorMessage(err, 'Erro ao excluir postagem.')),
    });
  }

  abrirCategorias(): void { this.showCategorias.set(true); }
  fecharCategorias(): void { this.showCategorias.set(false); }

  criarCategoria(): void {
    if (!this.novaCategoriaNome.trim()) return;
    this._svc.createCategoria({ nome: this.novaCategoriaNome.trim() }).subscribe({
      next: () => {
        this.novaCategoriaNome = '';
        this.erroCategoria.set(null);
        this._carregarCategorias();
      },
      error: err => this.erroCategoria.set(extractErrorMessage(err, 'Erro ao criar categoria.')),
    });
  }

  excluirCategoria(c: BlogCategoriaDto): void {
    if (!confirm(`Excluir a categoria "${c.nome}"?`)) return;
    this._svc.deleteCategoria(c.id).subscribe({
      next: () => this._carregarCategorias(),
      error: err => this.erroCategoria.set(extractErrorMessage(err, 'Erro ao excluir categoria.')),
    });
  }

  private _carregarCategorias(): void {
    this._svc.getCategorias().subscribe(c => this.categorias.set(c));
  }

  private _carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this._svc.getPosts({
      termo: this.termo, status: this.status, categoriaId: this.categoriaId,
      page: this.page(), pageSize: 20,
    }).subscribe({
      next: r => {
        this.posts.set(r.items as BlogPostDto[]);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.erro.set(extractErrorMessage(err, 'Erro ao carregar postagens.'));
      },
    });
  }
}
