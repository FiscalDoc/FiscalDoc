import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogState {
  mensagem: string;
  titulo?: string;
  confirmLabel: string;
  cancelLabel: string;
  destrutivo: boolean;
}

export interface ConfirmDialogOptions {
  titulo?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Estilo do botão de confirmar (vermelho) — true por padrão porque a esmagadora maioria dos
  // usos hoje são "Excluir X?"/"Cancelar Y?"; passe false pra confirmações neutras.
  destrutivo?: boolean;
}

// Substitui o confirm() nativo do navegador (inconsistente com o visual do resto do app, sem
// como estilizar) por um modal próprio. Mesmo padrão do ToastService: serviço global que só
// guarda estado num signal, o ConfirmDialogComponent (montado uma vez no Shell) é quem
// renderiza de fato. ask() devolve uma Promise<boolean> pra poder trocar
// `if (!confirm(...)) return;` por `if (!await this._confirm.ask(...)) return;` sem reescrever
// o resto do fluxo de cada chamador.
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmDialogState | null>(null);
  private _resolve: ((ok: boolean) => void) | null = null;

  ask(mensagem: string, options?: ConfirmDialogOptions): Promise<boolean> {
    return new Promise(resolve => {
      this._resolve = resolve;
      this.state.set({
        mensagem,
        titulo: options?.titulo,
        confirmLabel: options?.confirmLabel ?? 'Confirmar',
        cancelLabel: options?.cancelLabel ?? 'Cancelar',
        destrutivo: options?.destrutivo ?? true,
      });
    });
  }

  resolver(ok: boolean): void {
    this._resolve?.(ok);
    this._resolve = null;
    this.state.set(null);
  }
}
