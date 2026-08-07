import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ChatMensagemInput, ChatResponseDto } from '../../../models/src/index';

@Injectable({ providedIn: 'root' })
export class AssistenteService {
  private readonly _api = inject(ApiService);

  chat(mensagens: ChatMensagemInput[], clienteId?: string, pedidoId?: string): Observable<ChatResponseDto> {
    return this._api.post<ChatResponseDto>('/assistente/chat', { mensagens, clienteId, pedidoId });
  }
}
