import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PedidoDto, CreatePedidoRequest, UpdatePedidoRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { status?: string }): Observable<PagedResult<PedidoDto>> {
    return this._api.get<PagedResult<PedidoDto>>(`/clientes/${clienteId}/pedidos`, q as Record<string, unknown>);
  }

  getById(clienteId: string, id: string): Observable<PedidoDto> {
    return this._api.get<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}`);
  }

  create(req: CreatePedidoRequest): Observable<PedidoDto> {
    return this._api.post<PedidoDto>(`/clientes/${req.clienteId}/pedidos`, req);
  }

  update(clienteId: string, id: string, req: UpdatePedidoRequest): Observable<PedidoDto> {
    return this._api.put<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}`, req);
  }

  cancelar(clienteId: string, id: string): Observable<void> {
    return this._api.post<void>(`/clientes/${clienteId}/pedidos/${id}/cancelar`, {});
  }

  emitir(clienteId: string, id: string): Observable<PedidoDto> {
    return this._api.post<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}/emitir`, {});
  }
}
