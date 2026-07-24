import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardStatsDto } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly _api = inject(ApiService);

  getStats(ultimosDias = 30): Observable<DashboardStatsDto> {
    return this._api.get<DashboardStatsDto>('/dashboard', { ultimosDias });
  }
}
