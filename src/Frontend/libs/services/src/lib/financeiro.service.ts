import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ContaReceberDto,
  ContaReceberResumoDto,
  CreateContaReceberRequest,
  UpdateContaReceberRequest,
  DarBaixaContaReceberRequest,
  PagedResult,
  PaginationQuery,
} from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { status?: string; de?: string; ate?: string }): Observable<PagedResult<ContaReceberDto>> {
    return this._api.get<PagedResult<ContaReceberDto>>(`/clientes/${clienteId}/contas-receber`, q as Record<string, unknown>);
  }

  getResumo(clienteId: string): Observable<ContaReceberResumoDto> {
    return this._api.get<ContaReceberResumoDto>(`/clientes/${clienteId}/contas-receber/resumo`);
  }

  getById(clienteId: string, id: string): Observable<ContaReceberDto> {
    return this._api.get<ContaReceberDto>(`/clientes/${clienteId}/contas-receber/${id}`);
  }

  create(clienteId: string, req: CreateContaReceberRequest): Observable<ContaReceberDto> {
    return this._api.post<ContaReceberDto>(`/clientes/${clienteId}/contas-receber`, req);
  }

  update(clienteId: string, id: string, req: UpdateContaReceberRequest): Observable<ContaReceberDto> {
    return this._api.put<ContaReceberDto>(`/clientes/${clienteId}/contas-receber/${id}`, req);
  }

  delete(clienteId: string, id: string): Observable<void> {
    return this._api.delete<void>(`/clientes/${clienteId}/contas-receber/${id}`);
  }

  darBaixa(clienteId: string, id: string, req: DarBaixaContaReceberRequest): Observable<ContaReceberDto> {
    return this._api.post<ContaReceberDto>(`/clientes/${clienteId}/contas-receber/${id}/baixa`, req);
  }

  cancelar(clienteId: string, id: string): Observable<void> {
    return this._api.post<void>(`/clientes/${clienteId}/contas-receber/${id}/cancelar`, {});
  }
}
