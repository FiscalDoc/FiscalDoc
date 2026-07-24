import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SaveSmtpConfigRequest, SmtpConfigDto } from '../../../models/src/index';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private readonly _api = inject(ApiService);

  getSmtp(): Observable<SmtpConfigDto> {
    return this._api.get<SmtpConfigDto>('/configuracoes/smtp');
  }

  saveSmtp(req: SaveSmtpConfigRequest): Observable<SmtpConfigDto> {
    return this._api.put<SmtpConfigDto>('/configuracoes/smtp', req);
  }
}
