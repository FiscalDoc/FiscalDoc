import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ImportacaoXmlStatusDto,
  SaveSmtpConfigRequest,
  SendConviteRequest,
  SmtpConfigDto,
  SocialConfigDto,
} from '../../../models/src/index';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private readonly _api = inject(ApiService);

  getSmtp(): Observable<SmtpConfigDto> {
    return this._api.get<SmtpConfigDto>('/configuracoes/smtp');
  }

  saveSmtp(req: SaveSmtpConfigRequest): Observable<SmtpConfigDto> {
    return this._api.put<SmtpConfigDto>('/configuracoes/smtp', req);
  }

  getSocial(): Observable<SocialConfigDto> {
    return this._api.get<SocialConfigDto>('/configuracoes/social');
  }

  saveSocial(req: SocialConfigDto): Observable<SocialConfigDto> {
    return this._api.put<SocialConfigDto>('/configuracoes/social', req);
  }

  getSocialPublic(): Observable<SocialConfigDto> {
    return this._api.get<SocialConfigDto>('/configuracoes/social/public');
  }

  sendConvite(req: SendConviteRequest): Observable<void> {
    return this._api.post<void>('/configuracoes/convite', req);
  }

  getImportacaoXmlStatus(): Observable<ImportacaoXmlStatusDto | null> {
    return this._api.get<ImportacaoXmlStatusDto | null>('/configuracoes/importacao-xml/status');
  }
}
