import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RelatorioNfeEmitidasDto, RelatorioNfePorClienteItemDto } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly _api = inject(ApiService);

  getNfeEmitidas(clienteId: string, mes: number, ano: number): Observable<RelatorioNfeEmitidasDto> {
    return this._api.get<RelatorioNfeEmitidasDto>(`/clientes/${clienteId}/relatorios/nfe-emitidas`, { mes, ano });
  }

  getNfePorCliente(mes: number, ano: number): Observable<RelatorioNfePorClienteItemDto[]> {
    return this._api.get<RelatorioNfePorClienteItemDto[]>('/relatorios/nfe-por-cliente', { mes, ano });
  }
}
