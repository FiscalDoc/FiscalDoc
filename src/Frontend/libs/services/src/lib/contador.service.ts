import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AdminDashboardDto, AtualizarPlanoRequest, CobrancaDto,
  ContadorDto, CreateContadorRequest, CreateContadorResponse, GerarCobrancaRequest,
  UpdateContadorRequest
} from '../../../models/src/index';
import { PagedResult, PaginationQuery } from '../../../models/src/index';

@Injectable({ providedIn: 'root' })
export class ContadorService {
  private readonly _api = inject(ApiService);

  getAll(q?: PaginationQuery): Observable<PagedResult<ContadorDto>> {
    return this._api.get<PagedResult<ContadorDto>>('/contadores', q as Record<string, unknown>);
  }

  getById(id: string): Observable<ContadorDto> {
    return this._api.get<ContadorDto>(`/contadores/${id}`);
  }

  create(req: CreateContadorRequest): Observable<CreateContadorResponse> {
    return this._api.post<CreateContadorResponse>('/contadores', req);
  }

  update(id: string, req: UpdateContadorRequest): Observable<ContadorDto> {
    return this._api.put<ContadorDto>(`/contadores/${id}`, req);
  }

  uploadFoto(id: string, file: File): Observable<{ fotoUrl: string }> {
    const fd = new FormData();
    fd.append('foto', file);
    return this._api.postForm<{ fotoUrl: string }>(`/contadores/${id}/foto`, fd);
  }

  bloquear(id: string, motivo?: string): Observable<void> {
    return this._api.post<void>(`/contadores/${id}/bloquear`, { motivo });
  }

  liberar(id: string): Observable<void> {
    return this._api.post<void>(`/contadores/${id}/liberar`, {});
  }

  atualizarPlano(id: string, req: AtualizarPlanoRequest): Observable<void> {
    return this._api.put<void>(`/contadores/${id}/plano`, req);
  }

  gerarCobranca(id: string, req: GerarCobrancaRequest): Observable<CobrancaDto> {
    return this._api.post<CobrancaDto>(`/contadores/${id}/cobrancas`, req);
  }

  getHistoricoCobrancas(id: string): Observable<CobrancaDto[]> {
    return this._api.get<CobrancaDto[]>(`/contadores/${id}/cobrancas`);
  }

  marcarCobrancaPaga(cobrancaId: string, observacao?: string): Observable<CobrancaDto> {
    return this._api.post<CobrancaDto>(`/contadores/cobrancas/${cobrancaId}/pagar`, { observacao });
  }

  reabrirCobranca(cobrancaId: string): Observable<CobrancaDto> {
    return this._api.post<CobrancaDto>(`/contadores/cobrancas/${cobrancaId}/reabrir`, {});
  }

  getAdminDashboard(): Observable<AdminDashboardDto> {
    return this._api.get<AdminDashboardDto>('/dashboard/admin');
  }

  resetSenha(id: string): Observable<void> {
    return this._api.post<void>(`/contadores/${id}/reset-senha`, {});
  }

  setDataLimiteAcesso(id: string, dataLimite: string | null): Observable<void> {
    return this._api.put<void>(`/contadores/${id}/data-limite-acesso`, { dataLimite });
  }

  resendBoasVindas(id: string): Observable<void> {
    return this._api.post<void>(`/contadores/${id}/reenviar-boas-vindas`, {});
  }

  delete(id: string): Observable<void> {
    return this._api.delete<void>(`/contadores/${id}`);
  }
}
