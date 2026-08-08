import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PedidoDto, CreatePedidoRequest, UpdatePedidoRequest, PedidoVizinhosDto, ProdutoDto, PedidoHistoricoDto, NfeEmissaoDto, PedidosResumoDto, CartaCorrecaoDto } from '@veloxml/models';
import { PagedResult, PaginationQuery } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly _api = inject(ApiService);

  getAll(clienteId: string, q?: PaginationQuery & { status?: string; termo?: string; de?: string; ate?: string }): Observable<PagedResult<PedidoDto>> {
    return this._api.get<PagedResult<PedidoDto>>(`/clientes/${clienteId}/pedidos`, q as Record<string, unknown>);
  }

  getById(clienteId: string, id: string): Observable<PedidoDto> {
    return this._api.get<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}`);
  }

  create(req: CreatePedidoRequest): Observable<PedidoDto> {
    return this._api.post<PedidoDto>(`/clientes/${req.clienteId}/pedidos`, req);
  }

  update(clienteId: string, id: string, req: UpdatePedidoRequest): Observable<PedidoDto> {
    return this._api.put<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}`, req);
  }

  cancelar(clienteId: string, id: string): Observable<void> {
    return this._api.post<void>(`/clientes/${clienteId}/pedidos/${id}/cancelar`, {});
  }

  emitir(clienteId: string, id: string): Observable<PedidoDto> {
    return this._api.post<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}/emitir`, {});
  }

  duplicar(clienteId: string, id: string): Observable<PedidoDto> {
    return this._api.post<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}/duplicar`, {});
  }

  delete(clienteId: string, id: string): Observable<void> {
    return this._api.delete<void>(`/clientes/${clienteId}/pedidos/${id}`);
  }

  vincularDocumento(clienteId: string, id: string, documentoId: string): Observable<PedidoDto> {
    return this._api.post<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}/vincular-documento`, { documentoId });
  }

  desvincularDocumento(clienteId: string, id: string): Observable<PedidoDto> {
    return this._api.post<PedidoDto>(`/clientes/${clienteId}/pedidos/${id}/desvincular-documento`, {});
  }

  getVizinhos(clienteId: string, id: string): Observable<PedidoVizinhosDto> {
    return this._api.get<PedidoVizinhosDto>(`/clientes/${clienteId}/pedidos/${id}/vizinhos`);
  }

  getProdutosFrequentes(clienteId: string, destinatarioId: string): Observable<ProdutoDto[]> {
    return this._api.get<ProdutoDto[]>(`/clientes/${clienteId}/pedidos/produtos-frequentes`, { destinatarioId });
  }

  getHistorico(clienteId: string, id: string): Observable<PedidoHistoricoDto[]> {
    return this._api.get<PedidoHistoricoDto[]>(`/clientes/${clienteId}/pedidos/${id}/historico`);
  }

  getResumo(clienteId: string): Observable<PedidosResumoDto> {
    return this._api.get<PedidosResumoDto>(`/clientes/${clienteId}/pedidos/resumo`);
  }

  emitirNfeFocus(clienteId: string, id: string): Observable<NfeEmissaoDto> {
    return this._api.post<NfeEmissaoDto>(`/clientes/${clienteId}/pedidos/${id}/emitir-nfe`, {});
  }

  getNfeEmissao(clienteId: string, id: string): Observable<NfeEmissaoDto | null> {
    return this._api.get<NfeEmissaoDto | null>(`/clientes/${clienteId}/pedidos/${id}/nfe-emissao`);
  }

  cancelarNfeFocus(clienteId: string, id: string, justificativa: string): Observable<NfeEmissaoDto> {
    return this._api.post<NfeEmissaoDto>(`/clientes/${clienteId}/pedidos/${id}/cancelar-nfe`, { justificativa });
  }

  corrigirNfeFocus(clienteId: string, id: string, correcao: string): Observable<CartaCorrecaoDto> {
    return this._api.post<CartaCorrecaoDto>(`/clientes/${clienteId}/pedidos/${id}/carta-correcao`, { correcao });
  }
}
