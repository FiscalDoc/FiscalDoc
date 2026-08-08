import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ClienteDto, ConfigurarImapRequest, ConfigurarWebhookRequest, ConfigurarEmailNfeRequest, CriarContaClienteRequest, CriarContaClienteResponse, CreateClienteRequest, UpdateClienteRequest, UpdateClienteFiscalRequest } from '@veloxml/models';
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

  configurarEmailNfe(id: string, req: ConfigurarEmailNfeRequest): Observable<ClienteDto> {
    return this._api.put<ClienteDto>(`/clientes/${id}/email-nfe`, req);
  }

  criarConta(id: string, req: CriarContaClienteRequest): Observable<CriarContaClienteResponse> {
    return this._api.post<CriarContaClienteResponse>(`/clientes/${id}/criar-conta`, req);
  }

  updateFiscal(id: string, req: UpdateClienteFiscalRequest): Observable<ClienteDto> {
    return this._api.put<ClienteDto>(`/clientes/${id}/fiscal`, req);
  }

  uploadCertificado(id: string, certificado: File, senha: string, ambiente: string): Observable<ClienteDto> {
    const fd = new FormData();
    fd.append('certificado', certificado);
    fd.append('senha', senha);
    fd.append('ambiente', ambiente);
    return this._api.postForm<ClienteDto>(`/clientes/${id}/certificado`, fd);
  }
}
