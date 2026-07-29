import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BlogCategoriaDto, BlogPostDto, BlogPostResumoDto } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly _api = inject(ApiService);

  getPosts(q?: PaginationQuery & { categoriaSlug?: string }): Observable<PagedResult<BlogPostResumoDto>> {
    return this._api.get<PagedResult<BlogPostResumoDto>>('/blog/posts', q as Record<string, unknown>);
  }

  getPostBySlug(slug: string): Observable<BlogPostDto> {
    return this._api.get<BlogPostDto>(`/blog/posts/${slug}`);
  }

  getCategorias(): Observable<BlogCategoriaDto[]> {
    return this._api.get<BlogCategoriaDto[]>('/blog/categorias');
  }
}
