import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ProdutoDto, CreateProdutoRequest, UpdateProdutoRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery, VizinhosDto } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { termo?: string; ativo?: boolean }): Observable<PagedResult<ProdutoDto>> {
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

  getVizinhos(clienteId: string, id: string): Observable<VizinhosDto> {
    return this._api.get<VizinhosDto>(`/clientes/${clienteId}/produtos/${id}/vizinhos`);
  }

  duplicar(clienteId: string, id: string): Observable<ProdutoDto> {
    return this._api.post<ProdutoDto>(`/clientes/${clienteId}/produtos/${id}/duplicar`, {});
  }

  bulkAtivar(clienteId: string, ids: string[], ativo: boolean): Observable<void> {
    return this._api.patch<void>(`/clientes/${clienteId}/produtos/ativo-lote`, { ids, ativo });
  }

  exportarXlsx(clienteId: string, termo?: string, ativo?: boolean): Observable<Blob> {
    return this._api.getBlob(`/clientes/${clienteId}/produtos/exportar`, { termo, ativo });
  }

  importarXlsx(clienteId: string, arquivo: File): Observable<{ criados: number; erros: string[] }> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this._api.postForm<{ criados: number; erros: string[] }>(`/clientes/${clienteId}/produtos/importar`, form);
  }
}
