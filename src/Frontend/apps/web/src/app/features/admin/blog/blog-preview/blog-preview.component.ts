import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BlogAdminService } from '@veloxml/services';
import { BlogPostDto } from '@veloxml/models';
import { BlogPostViewComponent } from '../../../blog/blog-post-view/blog-post-view.component';

@Component({
  selector: 'app-blog-preview',
  standalone: true,
  imports: [CommonModule, BlogPostViewComponent],
  template: `
    <div class="preview-banner">Pré-visualização — esta postagem pode não estar publicada</div>
    <div class="page">
      @if (loading()) {
        <div class="empty">Carregando...</div>
      } @else if (!post()) {
        <div class="empty">Postagem não encontrada.</div>
      } @else {
        <app-blog-post-view [post]="post()"/>
      }
    </div>
  `,
  styles: [`
    :host { display: block; padding: 1.5rem; }
    .preview-banner { background: rgba(255,193,7,.12); color: #ffc107; border: 1px solid rgba(255,193,7,.3); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; margin-bottom: 1.5rem; text-align: center; }
    .page { max-width: 900px; margin: 0 auto; }
    .empty { text-align: center; color: var(--text2); padding: 3rem; }
  `],
})
export class BlogPreviewComponent implements OnInit {
  private readonly _svc = inject(BlogAdminService);
  private readonly _route = inject(ActivatedRoute);

  readonly post = signal<BlogPostDto | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._svc.getById(id).subscribe({
      next: p => { this.post.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
