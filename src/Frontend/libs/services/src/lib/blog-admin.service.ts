import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  BlogCategoriaDto,
  BlogCategoriaRequest,
  BlogPostDto,
  BlogPostRequest,
  UploadBlogImagemResult,
} from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class BlogAdminService {
  private readonly _api = inject(ApiService);

  getPosts(q?: PaginationQuery & { status?: string; categoriaId?: string }): Observable<PagedResult<BlogPostDto>> {
    return this._api.get<PagedResult<BlogPostDto>>('/admin/blog/posts', q as Record<string, unknown>);
  }

  getById(id: string): Observable<BlogPostDto> {
    return this._api.get<BlogPostDto>(`/admin/blog/posts/${id}`);
  }

  create(req: BlogPostRequest): Observable<BlogPostDto> {
    return this._api.post<BlogPostDto>('/admin/blog/posts', req);
  }

  update(id: string, req: BlogPostRequest): Observable<BlogPostDto> {
    return this._api.put<BlogPostDto>(`/admin/blog/posts/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this._api.delete<void>(`/admin/blog/posts/${id}`);
  }

  publicar(id: string): Observable<BlogPostDto> {
    return this._api.post<BlogPostDto>(`/admin/blog/posts/${id}/publicar`, {});
  }

  despublicar(id: string): Observable<BlogPostDto> {
    return this._api.post<BlogPostDto>(`/admin/blog/posts/${id}/despublicar`, {});
  }

  uploadImagem(file: File): Observable<UploadBlogImagemResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this._api.postForm<UploadBlogImagemResult>('/admin/blog/upload-imagem', form);
  }

  getCategorias(): Observable<BlogCategoriaDto[]> {
    return this._api.get<BlogCategoriaDto[]>('/admin/blog/categorias');
  }

  createCategoria(req: BlogCategoriaRequest): Observable<BlogCategoriaDto> {
    return this._api.post<BlogCategoriaDto>('/admin/blog/categorias', req);
  }

  updateCategoria(id: string, req: BlogCategoriaRequest): Observable<BlogCategoriaDto> {
    return this._api.put<BlogCategoriaDto>(`/admin/blog/categorias/${id}`, req);
  }

  deleteCategoria(id: string): Observable<void> {
    return this._api.delete<void>(`/admin/blog/categorias/${id}`);
  }
}
