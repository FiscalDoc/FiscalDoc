import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogPostDto } from '@veloxml/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-blog-post-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (post) {
      <article class="post">
        @if (post.imagemUrl) {
          <img class="cover" [src]="imgUrl(post.imagemUrl)" [alt]="post.titulo"/>
        }
        <div class="meta">
          @if (post.categoriaNome) { <span class="chip">{{ post.categoriaNome }}</span> }
          <span class="meta-item">{{ post.autor }}</span>
          @if (post.dataPublicacao) { <span class="meta-item">{{ post.dataPublicacao | date:'dd/MM/yyyy' }}</span> }
        </div>
        <h1 class="title">{{ post.titulo }}</h1>
        @if (post.resumo) { <p class="resumo">{{ post.resumo }}</p> }

        <div class="conteudo" [innerHTML]="post.conteudo"></div>

        @if (post.tags?.length) {
          <div class="tags">
            @for (tag of post.tags; track tag) { <span class="tag">#{{ tag }}</span> }
          </div>
        }

        <div class="share">
          <span class="share-label">Compartilhar:</span>
          <a class="share-btn" target="_blank" rel="noopener" [href]="'https://wa.me/?text=' + encodedShare()">WhatsApp</a>
          <a class="share-btn" target="_blank" rel="noopener" [href]="'https://twitter.com/intent/tweet?text=' + encodedTitle() + '&url=' + encodedUrl()">X / Twitter</a>
          <a class="share-btn" target="_blank" rel="noopener" [href]="'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl()">LinkedIn</a>
          <a class="share-btn" [href]="'mailto:?subject=' + encodedTitle() + '&body=' + encodedUrl()">E-mail</a>
        </div>
      </article>
    }
  `,
  styles: [`
    .post { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .cover { width: 100%; max-height: 420px; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--border); }
    .meta { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
    .chip { background: rgba(0,229,160,.12); color: var(--accent); border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
    .meta-item { color: var(--text2); font-size: 13px; }
    .title { margin: 0; font-size: 2rem; font-weight: 800; color: var(--text); line-height: 1.2; }
    .resumo { color: var(--text2); font-size: 1.05rem; margin: 0; }
    /* Base igual à do editor (body { font-size: 14px } global, herdado pelo .ql-editor sem
       override) e escala de heading em "em" igual ao default do navegador (o que o Quill também
       usa) — garante que o que foi formatado no editor renderize com o mesmo tamanho aqui. */
    .conteudo { color: var(--text); font-size: 14px; line-height: 1.75; max-width: 100%; overflow-wrap: break-word; }
    .conteudo ::ng-deep * { max-width: 100%; box-sizing: border-box; }
    .conteudo ::ng-deep img { border-radius: 8px; height: auto; }
    .conteudo ::ng-deep a { color: var(--accent); }
    .conteudo ::ng-deep h1 { font-size: 2em; margin: 1.5rem 0 .75rem; line-height: 1.3; }
    .conteudo ::ng-deep h2 { font-size: 1.5em; margin: 1.5rem 0 .75rem; line-height: 1.3; }
    .conteudo ::ng-deep h3 { font-size: 1.17em; margin: 1.25rem 0 .5rem; line-height: 1.3; }
    .conteudo ::ng-deep p { margin: 0 0 1rem; }
    .conteudo ::ng-deep blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; color: var(--text2); margin: 1rem 0; }
    .conteudo ::ng-deep hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    .conteudo ::ng-deep table { border-collapse: collapse; display: block; overflow-x: auto; }
    .conteudo ::ng-deep pre { white-space: pre-wrap; word-break: break-word; overflow-x: auto; background: var(--bg3); padding: .75rem 1rem; border-radius: 8px; }
    /* Conteúdo colado de fora (Word/Docs, etc.) traz cor/fundo — inline ou via classe do Quill —
       que deixam o texto invisível no tema escuro. Força sempre a cor do tema, sem exceção. */
    .conteudo, .conteudo ::ng-deep * { color: var(--text) !important; background-color: transparent !important; }
    .conteudo ::ng-deep a { color: var(--accent) !important; }
    .tags { display: flex; gap: .5rem; flex-wrap: wrap; }
    .tag { color: var(--text2); font-size: 12px; background: var(--bg3); border-radius: 999px; padding: 3px 10px; }
    .share { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; border-top: 1px solid var(--border); padding-top: 1.25rem; margin-top: .5rem; }
    .share-label { color: var(--text2); font-size: 13px; }
    .share-btn { background: var(--bg2); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: .4rem .75rem; font-size: 12.5px; }
    .share-btn:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
  `],
})
export class BlogPostViewComponent {
  @Input() post: BlogPostDto | null = null;

  imgUrl(path: string): string {
    return `${environment.apiUrl}${path}`;
  }

  encodedTitle(): string {
    return encodeURIComponent(this.post?.titulo ?? '');
  }

  encodedUrl(): string {
    return encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
  }

  encodedShare(): string {
    return `${this.encodedTitle()}%20-%20${this.encodedUrl()}`;
  }
}
