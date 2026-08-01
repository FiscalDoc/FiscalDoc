import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ImportacaoXmlLogDto, ImportacaoXmlLogsResumoDto, LogDto, PagedResult } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly _api = inject(ApiService);

  getAll(params?: { categoria?: string; operacao?: string; page?: number; pageSize?: number }): Observable<PagedResult<LogDto>> {
    return this._api.get<PagedResult<LogDto>>('/logs', params as Record<string, unknown>);
  }

  getIntegracao(params?: {
    clienteId?: string; origem?: string; page?: number; pageSize?: number;
  }): Observable<PagedResult<ImportacaoXmlLogDto>> {
    return this._api.get<PagedResult<ImportacaoXmlLogDto>>('/logs/integracao', params as Record<string, unknown>);
  }

  getIntegracaoResumo(origem?: string): Observable<ImportacaoXmlLogsResumoDto> {
    return this._api.get<ImportacaoXmlLogsResumoDto>('/logs/integracao/resumo', origem ? { origem } : undefined);
  }
}
