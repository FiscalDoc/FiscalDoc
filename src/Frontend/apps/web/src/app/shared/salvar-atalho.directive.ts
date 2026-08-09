import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

// Ctrl+S (Cmd+S no Mac) pra salvar sem precisar ir até o botão — em qualquer tela que tenha essa
// diretiva no elemento raiz. preventDefault() é sempre chamado nessa combinação, mesmo que o
// componente decida não salvar nesse momento (ex.: já salvando, formulário só-leitura), porque
// senão o navegador abre a caixa nativa de "Salvar página como".
@Directive({
  selector: '[appSalvarAtalho]',
  standalone: true,
})
export class SalvarAtalhoDirective {
  @Output() appSalvarAtalho = new EventEmitter<void>();

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.appSalvarAtalho.emit();
    }
  }
}
