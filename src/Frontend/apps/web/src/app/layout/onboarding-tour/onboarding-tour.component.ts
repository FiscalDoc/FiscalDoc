import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@veloxml/services';

interface TourPasso {
  titulo: string;
  texto: string;
  ctaLabel?: string;
  ctaRoute?: (clienteId: string) => string;
}

// Fica marcado como concluído assim que o usuário fecha o tour de qualquer forma (Pular,
// Concluir, X ou clicando num link de "ir pra lá") — diferente do modal de Novidades, aqui
// queremos "já fiz isso uma vez", não "toda vez que logar".
export const TOUR_KEY = 'vx_tour_concluido';

const PASSOS: TourPasso[] = [
  {
    titulo: 'Bem-vindo(a) ao FiscalDoc!',
    texto: 'Esse tour rápido mostra os 3 passos principais pra você começar a emitir suas notas fiscais: cadastro, emissão e relatórios.',
  },
  {
    titulo: '1. Cadastros',
    texto: 'Antes de emitir a primeira nota, cadastre seus produtos (com NCM e CFOP), os destinatários (seus clientes) e, se usar frete por conta própria, a transportadora.',
    ctaLabel: 'Ir para Cadastros',
    ctaRoute: (id) => `/clientes/${id}/cadastros`,
  },
  {
    titulo: '2. Como emitir uma nota fiscal',
    texto: 'Crie um novo Pedido em "Emissão › Pedidos / NF-e", preencha destinatário e itens, e clique em "Emitir NF-e". O FiscalDoc cuida do envio pra Focus NFe/SEFAZ e avisa se algo precisar de ajuste.',
    ctaLabel: 'Ir para Pedidos / NF-e',
    ctaRoute: (id) => `/clientes/${id}/pedidos`,
  },
  {
    titulo: '3. Como visualizar relatórios',
    texto: 'Acompanhe faturamento, notas emitidas, canceladas e volume por período na tela de Relatórios.',
    ctaLabel: 'Ir para Relatórios',
    ctaRoute: (id) => `/clientes/${id}/relatorios`,
  },
];

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (visivel()) {
      <div class="overlay" (click)="fechar()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title font-heading">{{ passo().titulo }}</h3>
            <button class="modal-close" (click)="fechar()">✕</button>
          </header>
          <div class="modal-body">
            <p class="tour-texto">{{ passo().texto }}</p>
            @if (passo().ctaLabel && clienteId()) {
              <a class="btn-cta" [routerLink]="passo().ctaRoute!(clienteId()!)" (click)="fechar()">{{ passo().ctaLabel }}</a>
            }
          </div>
          <footer class="modal-footer">
            <div class="tour-dots">
              @for (p of passos; track $index) {
                <span class="tour-dot" [class.tour-dot-active]="$index === indice()"></span>
              }
            </div>
            <div class="tour-actions">
              @if (indice() > 0) {
                <button class="btn-ghost" (click)="anterior()">Anterior</button>
              } @else {
                <button class="btn-ghost" (click)="fechar()">Pular</button>
              }
              @if (indice() < passos.length - 1) {
                <button class="btn-primary" (click)="proximo()">Próximo</button>
              } @else {
                <button class="btn-primary" (click)="fechar()">Concluir</button>
              }
            </div>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 460px; display: flex; flex-direction: column; }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .modal-title { margin: 0; font-size: 1.05rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .tour-texto { margin: 0; font-size: 13.5px; color: var(--text2); line-height: 1.6; }
    .btn-cta {
      align-self: flex-start; background: var(--accent-dim, oklch(0.62 0.17 254 / 0.12)); color: var(--accent);
      border: 1px solid oklch(0.62 0.17 254 / 0.3); border-radius: 8px; padding: .5rem 1rem;
      font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer;
    }
    .btn-cta:hover { opacity: .85; }
    .modal-footer { padding: 1rem 1.5rem 1.25rem; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); gap: 1rem; }
    .tour-dots { display: flex; gap: 5px; }
    .tour-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); }
    .tour-dot-active { background: var(--accent); }
    .tour-actions { display: flex; gap: .5rem; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: pointer; }
    .btn-primary { background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.1rem; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { opacity: .9; }
  `],
})
export class OnboardingTourComponent implements OnInit {
  private readonly _auth = inject(AuthService);

  readonly passos = PASSOS;
  readonly visivel = signal(false);
  readonly indice = signal(0);
  readonly passo = computed(() => this.passos[this.indice()]);
  readonly clienteId = computed(() => this._auth.currentUser()?.clienteId);

  ngOnInit(): void {
    if (this._auth.currentUser()?.perfil === 'Cliente' && !localStorage.getItem(TOUR_KEY)) {
      this.visivel.set(true);
    }
  }

  abrir(): void {
    this.indice.set(0);
    this.visivel.set(true);
  }

  proximo(): void {
    if (this.indice() < this.passos.length - 1) this.indice.update(i => i + 1);
  }

  anterior(): void {
    if (this.indice() > 0) this.indice.update(i => i - 1);
  }

  fechar(): void {
    localStorage.setItem(TOUR_KEY, '1');
    this.visivel.set(false);
  }
}
