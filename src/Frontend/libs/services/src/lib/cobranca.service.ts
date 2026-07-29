import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CobrancaDto, CobrancasResumoDto, CriarCobrancaManualRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class CobrancaService {
  private readonly _api = inject(ApiService);

  getAll(q?: PaginationQuery & { tipo?: string; status?: string; mes?: number; ano?: number }): Observable<PagedResult<CobrancaDto>> {
    return this._api.get<PagedResult<CobrancaDto>>('/cobrancas', q as Record<string, unknown>);
  }

  getResumo(): Observable<CobrancasResumoDto> {
    return this._api.get<CobrancasResumoDto>('/cobrancas/resumo');
  }

  criarManual(req: CriarCobrancaManualRequest): Observable<CobrancaDto> {
    return this._api.post<CobrancaDto>('/cobrancas', req);
  }

  marcarPaga(id: string, observacao?: string): Observable<CobrancaDto> {
    return this._api.post<CobrancaDto>(`/cobrancas/${id}/pagar`, { observacao });
  }

  reabrir(id: string): Observable<CobrancaDto> {
    return this._api.post<CobrancaDto>(`/cobrancas/${id}/reabrir`, {});
  }
}
