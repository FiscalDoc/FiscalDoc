import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ProdutoDto, CreateProdutoRequest, UpdateProdutoRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { termo?: string }): Observable<PagedResult<ProdutoDto>> {
    return this._api.get<PagedResult<ProdutoDto>>(`/clientes/${clienteId}/produtos`, q as Record<string, unknown>);
  }

  getById(clienteId: string, id: string): Observable<ProdutoDto> {
    return this._api.get<ProdutoDto>(`/clientes/${clienteId}/produtos/${id}`);
  }

  create(clienteId: string, req: CreateProdutoRequest): Observable<ProdutoDto> {
    return this._api.post<ProdutoDto>(`/clientes/${clienteId}/produtos`, req);
  }

  update(clienteId: string, id: string, req: UpdateProdutoRequest): Observable<ProdutoDto> {
    return this._api.put<ProdutoDto>(`/clientes/${clienteId}/produtos/${id}`, req);
  }

  delete(clienteId: string, id: string): Observable<void> {
    return this._api.delete<void>(`/clientes/${clienteId}/produtos/${id}`);
  }
}
