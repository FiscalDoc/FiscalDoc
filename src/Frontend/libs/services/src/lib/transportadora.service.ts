import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TransportadoraDto, CreateTransportadoraRequest, UpdateTransportadoraRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery, VizinhosDto } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class TransportadoraService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { termo?: string; ativo?: boolean }): Observable<PagedResult<TransportadoraDto>> {
    return this._api.get<PagedResult<TransportadoraDto>>(`/clientes/${clienteId}/transportadoras`, q as Record<string, unknown>);
  }

  getById(clienteId: string, id: string): Observable<TransportadoraDto> {
    return this._api.get<TransportadoraDto>(`/clientes/${clienteId}/transportadoras/${id}`);
  }

  create(clienteId: string, req: CreateTransportadoraRequest): Observable<TransportadoraDto> {
    return this._api.post<TransportadoraDto>(`/clientes/${clienteId}/transportadoras`, req);
  }

  update(clienteId: string, id: string, req: UpdateTransportadoraRequest): Observable<TransportadoraDto> {
    return this._api.put<TransportadoraDto>(`/clientes/${clienteId}/transportadoras/${id}`, req);
  }

  delete(clienteId: string, id: string): Observable<void> {
    return this._api.delete<void>(`/clientes/${clienteId}/transportadoras/${id}`);
  }

  getVizinhos(clienteId: string, id: string): Observable<VizinhosDto> {
    return this._api.get<VizinhosDto>(`/clientes/${clienteId}/transportadoras/${id}/vizinhos`);
  }

  duplicar(clienteId: string, id: string): Observable<TransportadoraDto> {
    return this._api.post<TransportadoraDto>(`/clientes/${clienteId}/transportadoras/${id}/duplicar`, {});
  }

  bulkAtivar(clienteId: string, ids: string[], ativo: boolean): Observable<void> {
    return this._api.patch<void>(`/clientes/${clienteId}/transportadoras/ativo-lote`, { ids, ativo });
  }

  exportarXlsx(clienteId: string, termo?: string, ativo?: boolean): Observable<Blob> {
    return this._api.getBlob(`/clientes/${clienteId}/transportadoras/exportar`, { termo, ativo });
  }

  importarXlsx(clienteId: string, arquivo: File): Observable<{ criados: number; erros: string[] }> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this._api.postForm<{ criados: number; erros: string[] }>(`/clientes/${clienteId}/transportadoras/importar`, form);
  }
}
