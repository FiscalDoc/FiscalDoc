import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ClienteDto, ConfigurarImapRequest, ConfigurarWebhookRequest, CriarContaClienteRequest, CriarContaClienteResponse, CreateClienteRequest, UpdateClienteRequest, UpdateClienteFiscalRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly _api = inject(ApiService);

  getAll(q?: PaginationQuery & { contadorId?: string }): Observable<PagedResult<ClienteDto>> {
    return this._api.get<PagedResult<ClienteDto>>('/clientes', q as Record<string, unknown>);
  }

  getById(id: string): Observable<ClienteDto> {
    return this._api.get<ClienteDto>(`/clientes/${id}`);
  }

  create(req: CreateClienteRequest): Observable<ClienteDto> {
    return this._api.post<ClienteDto>('/clientes', req);
  }

  update(id: string, req: UpdateClienteRequest): Observable<ClienteDto> {
    return this._api.put<ClienteDto>(`/clientes/${id}`, { ...req, id });
  }

  delete(id: string): Observable<void> {
    return this._api.delete<void>(`/clientes/${id}`);
  }

  regenerarAppKey(id: string): Observable<{ appKey: string }> {
    return this._api.post<{ appKey: string }>(`/clientes/${id}/regenerar-appkey`, {});
  }

  configurarImap(id: string, req: ConfigurarImapRequest): Observable<ClienteDto> {
    return this._api.put<ClienteDto>(`/clientes/${id}/imap`, req);
  }

  configurarWebhook(id: string, req: ConfigurarWebhookRequest): Observable<ClienteDto> {
    return this._api.put<ClienteDto>(`/clientes/${id}/webhook`, req);
  }

  criarConta(id: string, req: CriarContaClienteRequest): Observable<CriarContaClienteResponse> {
    return this._api.post<CriarContaClienteResponse>(`/clientes/${id}/criar-conta`, req);
  }

  updateFiscal(id: string, req: UpdateClienteFiscalRequest): Observable<ClienteDto> {
    return this._api.put<ClienteDto>(`/clientes/${id}/fiscal`, req);
  }
}
