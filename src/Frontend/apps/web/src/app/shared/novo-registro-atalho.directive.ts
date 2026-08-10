import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

// Ctrl+Alt+N (Cmd+Option+N no Mac) pra abrir "novo registro" sem precisar clicar no botão —
// Ctrl+N e Ctrl+Shift+N são reservados pelo navegador (nova janela/aba anônima) e não dá pra
// sobrescrever via JavaScript, por isso a combinação com Alt.
@Directive({
  selector: '[appNovoAtalho]',
  standalone: true,
})
export class NovoRegistroAtalhoDirective {
  @Output() appNovoAtalho = new EventEmitter<void>();

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      this.appNovoAtalho.emit();
    }
  }
}
