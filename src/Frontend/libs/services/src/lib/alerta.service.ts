import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AlertaDto } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly _api = inject(ApiService);

  getAll(q?: PaginationQuery & { clienteId?: string; status?: string }): Observable<PagedResult<AlertaDto>> {
    return this._api.get<PagedResult<AlertaDto>>('/alertas', q as Record<string, unknown>);
  }

  marcarLido(id: string): Observable<void> {
    return this._api.patch<void>(`/alertas/${id}/lido`, {});
  }
}
