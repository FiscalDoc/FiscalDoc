import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DocumentoDto, UploadDocumentoRequest } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly _api = inject(ApiService);

  getAll(q?: PaginationQuery & { clienteId?: string; tipo?: string; status?: string; origem?: string; de?: string; ate?: string; termo?: string }): Observable<PagedResult<DocumentoDto>> {
    return this._api.get<PagedResult<DocumentoDto>>('/documentos', q as Record<string, unknown>);
  }

  getById(id: string): Observable<DocumentoDto> {
    return this._api.get<DocumentoDto>(`/documentos/${id}`);
  }

  downloadArquivo(id: string): Observable<Blob> {
    return this._api.getBlob(`/documentos/${id}/arquivo`);
  }

  getLinkDownload(id: string): Observable<{ url: string }> {
    return this._api.get<{ url: string }>(`/documentos/${id}/link-download`);
  }

  downloadLote(clienteId: string, mes: number, ano: number): Observable<Blob> {
    return this._api.getBlob('/documentos/lote', { clienteId, mes, ano });
  }

  deleteLote(ids: string[]): Observable<{ excluidos: number }> {
    return this._api.post<{ excluidos: number }>('/documentos/excluir-lote', { ids });
  }

  upload(req: UploadDocumentoRequest): Observable<DocumentoDto> {
    const form = new FormData();
    if (req.clienteId) form.append('clienteId', req.clienteId);
    form.append('tipo', req.tipo);
    form.append('file', req.arquivo, req.arquivo.name);
    return this._api.postForm<DocumentoDto>('/documentos/upload', form);
  }

  delete(id: string): Observable<void> {
    return this._api.delete<void>(`/documentos/${id}`);
  }
}
