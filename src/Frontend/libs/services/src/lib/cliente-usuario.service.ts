import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult, UsuarioDto } from '@veloxml/models';

export interface CreateClienteUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface UpdateClienteUsuarioRequest {
  nome: string;
  ativo: boolean;
  novaSenha?: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteUsuarioService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, params?: { termo?: string; page?: number; pageSize?: number }): Observable<PagedResult<UsuarioDto>> {
    return this._api.get<PagedResult<UsuarioDto>>(`/clientes/${clienteId}/usuarios`, params as Record<string, unknown>);
  }

  getById(clienteId: string, id: string): Observable<UsuarioDto> {
    return this._api.get<UsuarioDto>(`/clientes/${clienteId}/usuarios/${id}`);
  }

  create(clienteId: string, req: CreateClienteUsuarioRequest): Observable<UsuarioDto> {
    return this._api.post<UsuarioDto>(`/clientes/${clienteId}/usuarios`, req);
  }

  update(clienteId: string, id: string, req: UpdateClienteUsuarioRequest): Observable<UsuarioDto> {
    return this._api.put<UsuarioDto>(`/clientes/${clienteId}/usuarios/${id}`, req);
  }

  delete(clienteId: string, id: string): Observable<void> {
    return this._api.delete<void>(`/clientes/${clienteId}/usuarios/${id}`);
  }
}
