import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { BlogService } from '@veloxml/services';
import { BlogPostDto } from '@veloxml/models';
import { BlogPostViewComponent } from '../blog-post-view/blog-post-view.component';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterLink, BlogPostViewComponent],
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
        <a routerLink="/blog" class="back-link">← Voltar para o blog</a>

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (!post()) {
          <div class="empty">Postagem não encontrada.</div>
        } @else {
          <app-blog-post-view [post]="post()"/>
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

    .container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    .back-link { display: inline-block; color: var(--text2); font-size: 13.5px; margin-bottom: 1.5rem; }
    .back-link:hover { color: var(--accent); text-decoration: none; }
    .empty { text-align: center; color: var(--text2); padding: 3rem; }
  `],
})
export class BlogPostComponent implements OnInit {
  private readonly _svc = inject(BlogService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _meta = inject(Meta);
  private readonly _title = inject(Title);

  readonly post = signal<BlogPostDto | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const slug = this._route.snapshot.paramMap.get('slug')!;
    this._svc.getPostBySlug(slug).subscribe({
      next: p => {
        this.post.set(p);
        this.loading.set(false);
        this._aplicarSeo(p);
      },
      error: () => {
        this.loading.set(false);
        this._router.navigate(['/blog']);
      },
    });
  }

  private _aplicarSeo(post: BlogPostDto): void {
    const titulo = post.metaTitulo || post.titulo;
    const descricao = post.metaDescricao || post.resumo;
    this._title.setTitle(`${titulo} | Blog FiscalDoc`);
    this._meta.updateTag({ name: 'description', content: descricao });
    this._meta.updateTag({ property: 'og:title', content: titulo });
    this._meta.updateTag({ property: 'og:description', content: descricao });
    this._meta.updateTag({ property: 'og:type', content: 'article' });
  }
}
