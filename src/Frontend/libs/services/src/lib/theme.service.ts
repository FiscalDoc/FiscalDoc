import { Injectable, signal } from '@angular/core';

export type Tema = 'dark' | 'light';

const STORAGE_KEY = 'vx_theme';

// Aplica/persiste o tema do app logado (ShellComponent pra frente) — landing e login ficam de
// fora de propósito, são páginas de marca com paleta própria, sempre escura. O <head> do
// index.html já tem um script inline que lê essa mesma chave do localStorage ANTES do Angular
// carregar, pra não piscar tema errado no primeiro paint; esse serviço só assume o controle
// depois disso, pra alternar em tempo real.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this._lerSalvo());

  constructor() {
    this._aplicar(this.tema());
  }

  alternar(): void {
    this.definir(this.tema() === 'dark' ? 'light' : 'dark');
  }

  definir(tema: Tema): void {
    this.tema.set(tema);
    localStorage.setItem(STORAGE_KEY, tema);
    this._aplicar(tema);
  }

  private _lerSalvo(): Tema {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  }

  private _aplicar(tema: Tema): void {
    if (tema === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  }
}
