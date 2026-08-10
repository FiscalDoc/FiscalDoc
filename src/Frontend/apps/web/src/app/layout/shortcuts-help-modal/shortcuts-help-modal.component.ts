import { Component, HostListener, signal } from '@angular/core';

interface Atalho {
  teclas: string[];
  descricao: string;
}

const ATALHOS: Atalho[] = [
  { teclas: ['Ctrl', 'K'], descricao: 'Busca geral — clientes, pedidos, produtos, destinatários e mais' },
  { teclas: ['Ctrl', 'S'], descricao: 'Salvar o cadastro ou pedido aberto na tela' },
  { teclas: ['Ctrl', 'Alt', 'N'], descricao: 'Criar um novo registro na tela de lista atual' },
  { teclas: ['Ctrl', '/'], descricao: 'Abrir esta lista de atalhos' },
];

// Modal global de atalhos — abre com Ctrl+/ de qualquer tela (exceto dentro de um campo de
// texto, pra não atrapalhar quem só quer digitar uma barra) ou pelo ícone "?" no rodapé do menu.
@Component({
  selector: 'app-shortcuts-help-modal',
  standalone: true,
  template: `
    @if (visivel()) {
      <div class="overlay" (click)="fechar()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title font-heading">Atalhos de teclado</h3>
            <button class="modal-close" (click)="fechar()">✕</button>
          </header>
          <div class="modal-body">
            @for (a of atalhos; track a.descricao) {
              <div class="atalho-item">
                <div class="atalho-teclas">
                  @for (t of a.teclas; track t) {
                    <kbd class="kbd">{{ t }}</kbd>
                  }
                </div>
                <span class="atalho-desc">{{ a.descricao }}</span>
              </div>
            }
          </div>
          <footer class="modal-footer">
            <button class="btn-primary" (click)="fechar()">Entendi</button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 440px; max-height: 85vh; display: flex; flex-direction: column; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .modal-title { margin: 0; font-size: 1.05rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.25rem 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
    .atalho-item { display: flex; align-items: center; gap: 12px; }
    .atalho-teclas { display: flex; align-items: center; gap: 4px; flex-shrink: 0; min-width: 120px; }
    .kbd { font-size: 11px; font-family: inherit; color: var(--text); border: 1px solid var(--border); border-radius: 4px; padding: 2px 7px; background: var(--bg3); }
    .atalho-desc { font-size: 13px; color: var(--text2); line-height: 1.4; }
    .modal-footer { padding: 1rem 1.5rem 1.25rem; display: flex; justify-content: flex-end; border-top: 1px solid var(--border); }
    .btn-primary { background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .55rem 1.25rem; font-size: 13.5px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { opacity: .9; }
  `],
})
export class ShortcutsHelpModalComponent {
  readonly atalhos = ATALHOS;
  readonly visivel = signal(false);

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const alvo = e.target as HTMLElement;
    const digitando = alvo?.tagName === 'INPUT' || alvo?.tagName === 'TEXTAREA' || alvo?.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key === '/' && !digitando) {
      e.preventDefault();
      this.visivel.set(true);
    } else if (e.key === 'Escape' && this.visivel()) {
      this.visivel.set(false);
    }
  }

  abrir(): void { this.visivel.set(true); }
  fechar(): void { this.visivel.set(false); }
}
