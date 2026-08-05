import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

// Serviço global (providedIn: 'root') — qualquer componente injeta e chama success/error/info,
// o ToastContainerComponent (montado uma única vez no Shell) é quem realmente renderiza.
// Sem isso, cada tela precisaria da própria UI de mensagem, e é exatamente esse o problema que
// motivou o pedido: erro/sucesso ficando escondido lá embaixo na tela, exigindo rolar pra ver.
@Injectable({ providedIn: 'root' })
export class ToastService {
  private _nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(mensagem: string, duracaoMs = 3500): void {
    this._show('sucesso', mensagem, duracaoMs);
  }

  error(mensagem: string, duracaoMs = 6000): void {
    this._show('erro', mensagem, duracaoMs);
  }

  info(mensagem: string, duracaoMs = 4000): void {
    this._show('info', mensagem, duracaoMs);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private _show(tipo: ToastTipo, mensagem: string, duracaoMs: number): void {
    const id = this._nextId++;
    this.toasts.update(list => [...list, { id, tipo, mensagem }]);
    setTimeout(() => this.dismiss(id), duracaoMs);
  }
}
