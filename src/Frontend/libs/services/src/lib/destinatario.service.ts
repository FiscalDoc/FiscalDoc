import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DestinatarioDto, CreateDestinatarioRequest, UpdateDestinatarioRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class DestinatarioService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { termo?: string }): Observable<PagedResult<DestinatarioDto>> {
    return this._api.get<PagedResult<DestinatarioDto>>(`/clientes/${clienteId}/destinatarios`, q as Record<string, unknown>);
  }

  getById(clienteId: string, id: string): Observable<DestinatarioDto> {
    return this._api.get<DestinatarioDto>(`/clientes/${clienteId}/destinatarios/${id}`);
  }

  create(clienteId: string, req: CreateDestinatarioRequest): Observable<DestinatarioDto> {
    return this._api.post<DestinatarioDto>(`/clientes/${clienteId}/destinatarios`, req);
  }

  update(clienteId: string, id: string, req: UpdateDestinatarioRequest): Observable<DestinatarioDto> {
    return this._api.put<DestinatarioDto>(`/clientes/${clienteId}/destinatarios/${id}`, req);
  }

  delete(clienteId: string, id: string): Observable<void> {
    return this._api.delete<void>(`/clientes/${clienteId}/destinatarios/${id}`);
  }
}
