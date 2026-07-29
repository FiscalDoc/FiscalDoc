import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogService } from '@veloxml/services';
import { BlogCategoriaDto, BlogPostResumoDto } from '@veloxml/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" routerLink="/" aria-label="FiscalDoc — página inicial">
          <span class="brand-fiscal">Fiscal</span><span class="brand-doc">Doc</span>
        </a>
        <a href="https://app.fiscaldoc.com.br/auth/login" class="btn-outline">Acessar sistema</a>
      </div>
    </header>

    <main class="page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Blog FiscalDoc</h1>
          <p class="page-sub">Novidades, dicas e conteúdo sobre gestão fiscal e documentos eletrônicos.</p>
        </div>

        <div class="filters">
          <div class="search-box">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input class="search-input" [(ngModel)]="termo" (input)="buscar()" placeholder="Buscar por título..."/>
          </div>
          <select class="select" [(ngModel)]="categoriaSlug" (change)="buscar()">
            <option value="">Todas as categorias</option>
            @for (c of categorias(); track c.id) {
              <option [value]="c.slug">{{ c.nome }}</option>
            }
          </select>
        </div>

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (posts().length === 0) {
          <div class="empty">Nenhuma postagem encontrada.</div>
        } @else {
          <div class="grid">
            @for (p of posts(); track p.id) {
              <a class="card" [routerLink]="['/blog', p.slug]">
                @if (p.imagemUrl) {
                  <img class="cover" [src]="imgUrl(p.imagemUrl)" [alt]="p.titulo"/>
                } @else {
                  <div class="cover cover-placeholder"></div>
                }
                <div class="card-body">
                  @if (p.categoriaNome) { <span class="chip">{{ p.categoriaNome }}</span> }
                  <h3 class="card-title">{{ p.titulo }}</h3>
                  <p class="card-resumo">{{ p.resumo }}</p>
                  <div class="card-meta">
                    <span>{{ p.autor }}</span>
                    @if (p.dataPublicacao) { <span>{{ p.dataPublicacao | date:'dd/MM/yyyy' }}</span> }
                  </div>
                  <span class="read-more">Ler mais →</span>
                </div>
              </a>
            }
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
    </main>
  `,
  styles: [`
    :host { display: block; background: var(--bg); min-height: 100vh; }
    .nav { border-bottom: 1px solid var(--border); }
    .nav-inner { max-width: 1100px; margin: 0 auto; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .brand { font-size: 1.2rem; font-weight: 800; }
    .brand-fiscal { color: var(--text); }
    .brand-doc { color: var(--accent); }
    .btn-outline { border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }

    .container { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
    .page-header { margin-bottom: 2rem; }
    .page-title { margin: 0 0 .5rem; font-size: 2.25rem; font-weight: 800; color: var(--text); }
    .page-sub { margin: 0; color: var(--text2); font-size: 1.05rem; }

    .filters { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .search-box { display: flex; align-items: center; gap: 6px; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text2); flex: 1; min-width: 220px; max-width: 360px; }
    .search-input { background: none; border: none; outline: none; color: var(--text); font-size: 14px; flex: 1; }
    .select { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text); font-size: 14px; }

    .empty { text-align: center; color: var(--text2); padding: 3rem; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .card { display: flex; flex-direction: column; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; color: var(--text); }
    .card:hover { border-color: var(--accent); text-decoration: none; }
    .cover { width: 100%; height: 170px; object-fit: cover; }
    .cover-placeholder { background: linear-gradient(135deg, var(--bg3), var(--bg2)); }
    .card-body { padding: 1.1rem; display: flex; flex-direction: column; gap: .5rem; flex: 1; }
    .chip { align-self: flex-start; background: rgba(0,229,160,.12); color: var(--accent); border-radius: 999px; padding: 2px 9px; font-size: 11px; font-weight: 600; }
    .card-title { margin: 0; font-size: 1.1rem; font-weight: 700; line-height: 1.3; }
    .card-resumo { margin: 0; color: var(--text2); font-size: 13.5px; line-height: 1.5; flex: 1; }
    .card-meta { display: flex; gap: .75rem; color: var(--text2); font-size: 12px; }
    .read-more { color: var(--accent); font-size: 13px; font-weight: 600; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2.5rem; }
    .page-btn { background: var(--bg2); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { color: var(--text2); font-size: 13px; }
  `],
})
export class BlogListComponent implements OnInit {
  private readonly _svc = inject(BlogService);

  readonly posts = signal<BlogPostResumoDto[]>([]);
  readonly categorias = signal<BlogCategoriaDto[]>([]);
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  termo = '';
  categoriaSlug = '';

  ngOnInit(): void {
    this._svc.getCategorias().subscribe(c => this.categorias.set(c));
    this.buscar();
  }

  imgUrl(path: string): string {
    return `${environment.apiUrl}${path}`;
  }

  buscar(): void {
    this.page.set(1);
    this.carregar();
  }

  irPara(page: number): void {
    this.page.set(page);
    this.carregar();
  }

  private carregar(): void {
    this.loading.set(true);
    this._svc.getPosts({ termo: this.termo, categoriaSlug: this.categoriaSlug, page: this.page(), pageSize: 12 }).subscribe({
      next: r => {
        this.posts.set(r.items as BlogPostResumoDto[]);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
