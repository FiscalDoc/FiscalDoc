import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult, UsuarioDto } from '@veloxml/models';

export interface CreateClienteUsuarioRequest {
  nome: string;
  email: string;
}

export interface UpdateClienteUsuarioRequest {
  nome: string;
  ativo: boolean;
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

  resetarSenha(clienteId: string, id: string): Observable<void> {
    return this._api.post<void>(`/clientes/${clienteId}/usuarios/${id}/resetar-senha`, {});
  }

  uploadAvatar(clienteId: string, id: string, arquivo: File): Observable<{ avatarUrl: string }> {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return this._api.postForm<{ avatarUrl: string }>(`/clientes/${clienteId}/usuarios/${id}/avatar`, fd);
  }
}
