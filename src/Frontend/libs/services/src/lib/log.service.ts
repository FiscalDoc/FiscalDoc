import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { LogDto } from '@veloxml/models';
import { PagedResult } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly _api = inject(ApiService);

  getAll(params?: { categoria?: string; operacao?: string; page?: number; pageSize?: number }): Observable<PagedResult<LogDto>> {
    return this._api.get<PagedResult<LogDto>>('/logs', params as Record<string, unknown>);
  }
}
