import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateUsuarioRequest, UpdateUsuarioRequest, UsuarioDto
} from '../../../models/src/index';
import { PagedResult } from '../../../models/src/index';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly _api = inject(ApiService);

  getAll(params?: { termo?: string; perfil?: string; page?: number; pageSize?: number }): Observable<PagedResult<UsuarioDto>> {
    return this._api.get<PagedResult<UsuarioDto>>('/usuarios', params as Record<string, unknown>);
  }

  getById(id: string): Observable<UsuarioDto> {
    return this._api.get<UsuarioDto>(`/usuarios/${id}`);
  }

  create(req: CreateUsuarioRequest): Observable<UsuarioDto> {
    return this._api.post<UsuarioDto>('/usuarios', req);
  }

  update(id: string, req: UpdateUsuarioRequest): Observable<UsuarioDto> {
    return this._api.put<UsuarioDto>(`/usuarios/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this._api.delete<void>(`/usuarios/${id}`);
  }
}
