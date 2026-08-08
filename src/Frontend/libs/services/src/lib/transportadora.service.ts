import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TransportadoraDto, CreateTransportadoraRequest, UpdateTransportadoraRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class TransportadoraService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { termo?: string }): Observable<PagedResult<TransportadoraDto>> {
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
}
