import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@veloxml/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  // Só injetar já ativa o construtor do ThemeService (aplica o tema salvo) — não precisa
  // chamar nada explicitamente, é o mesmo padrão de "serviço singleton ativado no boot".
  private readonly _theme = inject(ThemeService);
}
