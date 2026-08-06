import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { BlogAdminService, extractErrorMessage, extractFieldErrors } from '@veloxml/services';
import { BlogCategoriaDto, BlogPostDto, BlogStatus } from '@veloxml/models';
import { environment } from '../../../../../environments/environment';

type Tab = 'conteudo' | 'publicacao' | 'seo';

@Component({
  selector: 'app-blog-post-form',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
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
            Blog
          </button>
          <div class="header-top">
            <h2 class="page-title">{{ isNew() ? 'Nova Postagem' : form.titulo || 'Postagem' }}</h2>
            @if (!isNew()) {
              <button class="btn-ghost" (click)="visualizar()">Visualizar</button>
            }
          </div>
        </div>

        <nav class="tabs">
          <button class="tab-btn" [class.active]="tab() === 'conteudo'" (click)="tab.set('conteudo')">Conteúdo</button>
          <button class="tab-btn" [class.active]="tab() === 'publicacao'" (click)="tab.set('publicacao')">Publicação</button>
          <button class="tab-btn" [class.active]="tab() === 'seo'" (click)="tab.set('seo')">SEO</button>
        </nav>

        @if (tab() === 'conteudo') {
          <div class="card section">
            <h4 class="section-title">Conteúdo</h4>
            <div class="form-grid">
              <div class="field col-2">
                <label class="label">Título *</label>
                <input class="input" [class.error]="fieldErrors()['titulo']" [(ngModel)]="form.titulo" placeholder="Título da postagem"/>
                @if (fieldErrors()['titulo']) { <span class="field-error">{{ fieldErrors()['titulo'] }}</span> }
              </div>
              <div class="field col-2">
                <label class="label">Slug (URL)</label>
                <input class="input" [class.error]="fieldErrors()['slug']" [(ngModel)]="form.slug" placeholder="gerado-automaticamente"/>
                @if (fieldErrors()['slug']) { <span class="field-error">{{ fieldErrors()['slug'] }}</span> }
              </div>
              <div class="field col-2">
                <label class="label">Resumo</label>
                <textarea class="input textarea-sm" [(ngModel)]="form.resumo" placeholder="Resumo exibido na listagem do blog" maxlength="500"></textarea>
              </div>
              <div class="field col-2">
                <label class="label">Imagem de Capa</label>
                @if (imagemUrl()) {
                  <img class="preview-img" [src]="imagemUrl()" alt="Capa"/>
                }
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" (change)="onImagemSelecionada($event)"/>
                @if (uploadingImagem()) { <span class="hint">Enviando imagem...</span> }
              </div>
              <div class="field col-2">
                <label class="label">Conteúdo *</label>
                <quill-editor class="editor" [(ngModel)]="form.conteudo" theme="snow"></quill-editor>
                @if (fieldErrors()['conteudo']) { <span class="field-error">{{ fieldErrors()['conteudo'] }}</span> }
              </div>
            </div>
          </div>
        }

        @if (tab() === 'publicacao') {
          <div class="card section">
            <h4 class="section-title">Publicação</h4>
            <div class="form-grid">
              <div class="field">
                <label class="label">Categoria</label>
                <select class="input" [(ngModel)]="form.categoriaId">
                  <option [ngValue]="undefined">Sem categoria</option>
                  @for (c of categorias(); track c.id) {
                    <option [ngValue]="c.id">{{ c.nome }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label class="label">Autor *</label>
                <input class="input" [class.error]="fieldErrors()['autor']" [(ngModel)]="form.autor" placeholder="Nome do autor"/>
                @if (fieldErrors()['autor']) { <span class="field-error">{{ fieldErrors()['autor'] }}</span> }
              </div>
              <div class="field">
                <label class="label">Tags (separadas por vírgula)</label>
                <input class="input" [(ngModel)]="tagsTexto" placeholder="fiscal, nfe, gestão"/>
              </div>
              <div class="field">
                <label class="label">Data de Publicação</label>
                <input class="input" type="date" [(ngModel)]="dataPublicacaoTexto"/>
                <span class="hint">Uma data futura agenda a publicação automaticamente.</span>
              </div>
              <div class="field col-2">
                <label class="label">Status</label>
                <div class="status-toggle">
                  <button type="button" class="status-btn" [class.active]="form.status === 'Rascunho'" (click)="form.status = 'Rascunho'">Rascunho</button>
                  <button type="button" class="status-btn" [class.active]="form.status === 'Publicado'" (click)="form.status = 'Publicado'">Publicado</button>
                </div>
              </div>
            </div>
          </div>
        }

        @if (tab() === 'seo') {
          <div class="card section">
            <h4 class="section-title">SEO</h4>
            <div class="form-grid">
              <div class="field col-2">
                <label class="label">Meta Título ({{ (form.metaTitulo ?? '').length }}/200)</label>
                <input class="input" [(ngModel)]="form.metaTitulo" maxlength="200" placeholder="Se vazio, usa o título da postagem"/>
              </div>
              <div class="field col-2">
                <label class="label">Meta Descrição ({{ (form.metaDescricao ?? '').length }}/300)</label>
                <textarea class="input textarea-sm" [(ngModel)]="form.metaDescricao" maxlength="300" placeholder="Se vazio, usa o resumo da postagem"></textarea>
              </div>
            </div>
          </div>
        }

        @if (erro()) { <div class="alert-error">{{ erro() }}</div> }
        @if (sucesso()) { <div class="alert-ok">Postagem salva!</div> }

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

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; }
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
    .textarea-sm { min-height: 70px; resize: vertical; }
    .field-error { font-size: 11px; color: var(--red); }
    .hint { font-size: 11px; color: var(--text2); }
    .preview-img { max-width: 260px; max-height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 6px; }
    .editor { display: block; width: 100%; background: var(--bg3); border-radius: 8px; }
    .editor ::ng-deep .ql-toolbar { border-color: var(--border); border-radius: 8px 8px 0 0; background: var(--bg2); }
    .editor ::ng-deep .ql-toolbar .ql-stroke { stroke: var(--text2); }
    .editor ::ng-deep .ql-toolbar .ql-fill { fill: var(--text2); }
    .editor ::ng-deep .ql-toolbar .ql-picker { color: var(--text2); }
    .editor ::ng-deep .ql-container { border-color: var(--border); border-radius: 0 0 8px 8px; font-family: inherit; font-size: 13.5px; }
    .editor ::ng-deep .ql-editor { color: var(--text); min-height: 260px; max-height: 480px; overflow-y: auto; overflow-wrap: break-word; }
    .editor ::ng-deep .ql-editor img { max-width: 100%; height: auto; }
    .editor ::ng-deep .ql-editor hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
    /* Conteúdo colado de fora (Word/Docs, etc.) traz cor/fundo (inline ou via classe do Quill)
       que deixam o texto invisível no tema escuro — força sempre a cor do tema, sem exceção. */
    .editor ::ng-deep .ql-editor, .editor ::ng-deep .ql-editor * {
      color: var(--text) !important;
      background-color: transparent !important;
    }
    .editor ::ng-deep .ql-editor.ql-blank::before { color: var(--text2) !important; }
    .editor ::ng-deep .ql-editor a { color: var(--accent) !important; }
    .status-toggle { display: flex; gap: .5rem; }
    .status-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1.25rem; font-size: 13px; cursor: pointer; }
    .status-btn.active { background: oklch(0.62 0.17 254 / .12); border-color: var(--accent); color: var(--accent); font-weight: 600; }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { background: oklch(0.62 0.17 254 / .1); border: 1px solid oklch(0.62 0.17 254 / .3); color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .col-2 { grid-column: span 1; }
      .header-top { flex-direction: column; align-items: stretch; gap: .5rem; }
      .form-actions { flex-direction: column-reverse; align-items: stretch; }
      .status-toggle { flex-direction: column; }
    }
  `],
})
export class BlogPostFormComponent implements OnInit {
  private readonly _svc = inject(BlogAdminService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  private postId = '';

  readonly isNew = signal(true);
  readonly loading = signal(true);
  readonly salvando = signal(false);
  readonly uploadingImagem = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly tab = signal<Tab>('conteudo');
  readonly categorias = signal<BlogCategoriaDto[]>([]);
  readonly imagemUrl = signal<string | null>(null);

  tagsTexto = '';
  dataPublicacaoTexto = '';

  form = this._empty();

  ngOnInit(): void {
    this._svc.getCategorias().subscribe(c => this.categorias.set(c));

    this.postId = this._route.snapshot.paramMap.get('id') ?? '';
    this.isNew.set(!this.postId);

    if (this.isNew()) {
      this.loading.set(false);
      return;
    }

    this._svc.getById(this.postId).subscribe({
      next: p => { this._sync(p); this.loading.set(false); },
      error: () => { this.loading.set(false); this.erro.set('Postagem não encontrada.'); },
    });
  }

  private _sync(p: BlogPostDto): void {
    this.form = {
      titulo: p.titulo, slug: p.slug, resumo: p.resumo, conteudo: p.conteudo,
      imagemCapaKey: p.imagemUrl ? p.imagemUrl.split('/').pop() : undefined,
      categoriaId: p.categoriaId, tags: p.tags, autor: p.autor,
      dataPublicacao: p.dataPublicacao, status: p.status,
      metaTitulo: p.metaTitulo, metaDescricao: p.metaDescricao,
    };
    this.tagsTexto = p.tags.join(', ');
    this.dataPublicacaoTexto = p.dataPublicacao ? p.dataPublicacao.substring(0, 10) : '';
    this.imagemUrl.set(p.imagemUrl ? `${environment.apiUrl}${p.imagemUrl}` : null);
  }

  onImagemSelecionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingImagem.set(true);
    this._svc.uploadImagem(file).subscribe({
      next: r => {
        this.form.imagemCapaKey = r.key;
        this.imagemUrl.set(`${environment.apiUrl}${r.url}`);
        this.uploadingImagem.set(false);
      },
      error: err => {
        this.uploadingImagem.set(false);
        this.erro.set(extractErrorMessage(err, 'Erro ao enviar imagem.'));
      },
    });
  }

  visualizar(): void {
    if (!this.postId) return;
    window.open(`/admin/blog/preview/${this.postId}`, '_blank');
  }

  goBack(): void { this._router.navigate(['/admin/blog']); }

  salvar(): void {
    if (this.salvando()) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(false);
    this.fieldErrors.set({});

    const req = {
      titulo: this.form.titulo,
      slug: this.form.slug || undefined,
      resumo: this.form.resumo,
      conteudo: this.form.conteudo,
      imagemCapaKey: this.form.imagemCapaKey,
      categoriaId: this.form.categoriaId || undefined,
      tags: this.tagsTexto.split(',').map(t => t.trim()).filter(Boolean),
      autor: this.form.autor,
      dataPublicacao: this.dataPublicacaoTexto ? new Date(this.dataPublicacaoTexto).toISOString() : undefined,
      status: this.form.status,
      metaTitulo: this.form.metaTitulo || undefined,
      metaDescricao: this.form.metaDescricao || undefined,
    };

    const obs = this.isNew() ? this._svc.create(req) : this._svc.update(this.postId, req);

    obs.subscribe({
      next: p => {
        this.salvando.set(false);
        this.sucesso.set(true);
        if (this.isNew()) { this._router.navigate(['/admin/blog/editar', p.id]); }
        else { this._sync(p); }
        setTimeout(() => this.sucesso.set(false), 3000);
      },
      error: err => {
        this.salvando.set(false);
        this.erro.set(extractErrorMessage(err, 'Erro ao salvar postagem.'));
        this.fieldErrors.set(extractFieldErrors(err) ?? {});
      },
    });
  }

  private _empty() {
    return {
      titulo: '', slug: '', resumo: '', conteudo: '',
      imagemCapaKey: undefined as string | undefined,
      categoriaId: undefined as string | undefined,
      tags: [] as string[], autor: '',
      dataPublicacao: undefined as string | undefined,
      status: 'Rascunho' as BlogStatus,
      metaTitulo: undefined as string | undefined,
      metaDescricao: undefined as string | undefined,
    };
  }
}
