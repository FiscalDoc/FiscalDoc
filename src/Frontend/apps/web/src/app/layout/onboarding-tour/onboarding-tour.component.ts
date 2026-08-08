import { Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@veloxml/services';

type Placement = 'right' | 'bottom' | 'left' | 'top';

interface TourPasso {
  titulo: string;
  texto: string;
  // Sem seletor = passo "central" (boas-vindas/conclusão). Com seletor, o tour navega (se
  // preciso), acha o elemento de verdade na tela e aponta a seta pra ele.
  selector?: string;
  // Selector de um botão a clicar ANTES de procurar `selector` (ex.: expandir um grupo do menu
  // que está fechado) — só clicado se `selector` ainda não estiver visível.
  preClick?: string;
  route?: (clienteId: string) => string;
  placement?: Placement;
}

// Fica marcado como concluído assim que o usuário fecha o tour de qualquer forma (Pular,
// Concluir, X) — diferente do modal de Novidades, aqui queremos "já fiz isso uma vez", não
// "toda vez que logar".
export const TOUR_KEY = 'vx_tour_concluido';

const PASSOS: TourPasso[] = [
  {
    titulo: 'Bem-vindo(a) ao FiscalDoc!',
    texto: 'Vamos te mostrar rapidinho onde ficam os 3 passos principais: cadastro, emissão de nota e relatórios. A seta vai apontando o caminho.',
  },
  {
    titulo: 'Emissão de notas',
    texto: 'Aqui fica "Pedidos / NF-e" — é onde você cria pedidos e emite suas notas fiscais.',
    selector: '[data-tour="nav-pedidos"]',
    preClick: '[data-tour="grupo-emissao"]',
    placement: 'right',
  },
  {
    titulo: 'Criando uma nota fiscal',
    texto: 'Clique em "+ Novo Pedido" pra começar. Preencha o destinatário e os itens e depois clique em "Emitir NF-e" — o FiscalDoc cuida do envio pra Focus NFe/SEFAZ.',
    selector: '[data-tour="novo-pedido"]',
    route: (id) => `/clientes/${id}/pedidos`,
    placement: 'bottom',
  },
  {
    titulo: 'Cadastros',
    texto: 'Produtos (com NCM/CFOP), destinatários (seus clientes) e transportadoras ficam aqui. Cadastre-os antes de emitir, senão a nota não passa na SEFAZ.',
    selector: '[data-tour="grupo-cadastros"]',
    placement: 'right',
  },
  {
    titulo: 'Relatórios',
    texto: 'Acompanhe faturamento, notas emitidas, canceladas e volume por período aqui.',
    selector: '[data-tour="nav-relatorios"]',
    placement: 'right',
  },
  {
    titulo: 'Pronto!',
    texto: 'Você já sabe o essencial pra começar. Pode rever esse tour quando quiser pelo ícone de bússola no rodapé do menu.',
  },
];

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  template: `
    @if (visivel()) {
      <div class="tour-blocker" (click)="fechar()"></div>

      @if (alvoRect(); as r) {
        <div class="tour-highlight"
          [style.top.px]="r.top - 6" [style.left.px]="r.left - 6"
          [style.width.px]="r.width + 12" [style.height.px]="r.height + 12"></div>
      }

      <div #tooltip class="tour-tooltip" [class.tour-tooltip-central]="!alvoRect()"
        [style.top.px]="alvoRect() ? tooltipPos().top : null" [style.left.px]="alvoRect() ? tooltipPos().left : null">
        <div class="tour-tooltip-header">
          <span class="tour-passo-label">Passo {{ indice() + 1 }} de {{ passos.length }}</span>
          <button class="tour-close" (click)="fechar()">✕</button>
        </div>
        <p class="tour-titulo">{{ passo().titulo }}</p>
        <p class="tour-texto">{{ passo().texto }}</p>
        <div class="tour-footer">
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
        </div>
      </div>
    }
  `,
  styles: [`
    .tour-blocker { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 1000; }
    .tour-highlight {
      position: fixed; z-index: 1001; border-radius: 10px;
      box-shadow: 0 0 0 4000px rgba(0,0,0,.55), 0 0 0 3px var(--accent);
      pointer-events: none;
      transition: top 200ms ease, left 200ms ease, width 200ms ease, height 200ms ease;
    }
    .tour-tooltip {
      position: fixed; z-index: 1002; width: 300px; max-width: calc(100vw - 24px);
      background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius, 10px);
      padding: 1rem 1.1rem; box-shadow: 0 8px 24px rgba(0,0,0,.4);
    }
    .tour-tooltip-central {
      top: 50% !important; left: 50% !important; transform: translate(-50%, -50%);
      width: 340px;
    }
    .tour-tooltip-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .35rem; }
    .tour-passo-label { font-size: 10.5px; font-weight: 700; letter-spacing: .03em; color: var(--accent); text-transform: uppercase; }
    .tour-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 13px; padding: 2px; }
    .tour-close:hover { color: var(--text); }
    .tour-titulo { margin: 0 0 4px; font-size: 14.5px; font-weight: 700; color: var(--text); }
    .tour-texto { margin: 0 0 .9rem; font-size: 12.5px; color: var(--text2); line-height: 1.55; }
    .tour-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .tour-dots { display: flex; gap: 5px; }
    .tour-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); }
    .tour-dot-active { background: var(--accent); }
    .tour-actions { display: flex; gap: .5rem; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .4rem .85rem; font-size: 12.5px; cursor: pointer; }
    .btn-primary { background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .4rem .95rem; font-size: 12.5px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { opacity: .9; }
  `],
})
export class OnboardingTourComponent implements OnInit {
  private readonly _auth = inject(AuthService);
  private readonly _router = inject(Router);

  @ViewChild('tooltip') private _tooltipEl?: ElementRef<HTMLElement>;

  readonly passos = PASSOS;
  readonly visivel = signal(false);
  readonly indice = signal(0);
  readonly passo = () => this.passos[this.indice()];
  readonly alvoRect = signal<DOMRect | null>(null);
  readonly tooltipPos = signal({ top: 0, left: 0 });

  private _passoToken = 0;

  ngOnInit(): void {
    if (this._auth.currentUser()?.perfil === 'Cliente' && !localStorage.getItem(TOUR_KEY)) {
      this.abrir();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.visivel()) this._ativarPasso(this.indice());
  }

  abrir(): void {
    this.indice.set(0);
    this.visivel.set(true);
    this._ativarPasso(0);
  }

  proximo(): void {
    if (this.indice() < this.passos.length - 1) {
      this.indice.update(i => i + 1);
      this._ativarPasso(this.indice());
    }
  }

  anterior(): void {
    if (this.indice() > 0) {
      this.indice.update(i => i - 1);
      this._ativarPasso(this.indice());
    }
  }

  fechar(): void {
    localStorage.setItem(TOUR_KEY, '1');
    this.visivel.set(false);
    this.alvoRect.set(null);
  }

  private async _ativarPasso(i: number): Promise<void> {
    const token = ++this._passoToken;
    const passo = this.passos[i];
    this.alvoRect.set(null);

    const clienteId = this._auth.currentUser()?.clienteId;
    if (passo.route && clienteId) {
      const destino = passo.route(clienteId);
      if (!this._router.url.startsWith(destino)) {
        await this._router.navigateByUrl(destino);
        await this._espera(150);
      }
    }

    if (!passo.selector) return;

    let el = document.querySelector<HTMLElement>(passo.selector);
    if (!el && passo.preClick) {
      document.querySelector<HTMLElement>(passo.preClick)?.click();
      await this._espera(150);
      el = document.querySelector<HTMLElement>(passo.selector);
    }
    if (!el) el = await this._esperarElemento(passo.selector, 3000);
    if (token !== this._passoToken || !el) return;

    el.scrollIntoView({ block: 'nearest' });
    await this._espera(80);
    if (token !== this._passoToken) return;

    const rect = el.getBoundingClientRect();
    this.alvoRect.set(rect);
    this._posicionarTooltip(rect, passo.placement ?? 'right');
  }

  private _posicionarTooltip(rect: DOMRect, placement: Placement): void {
    const margem = 14;
    // Chute inicial (largura estimada da tooltip antes de medir de verdade no próximo frame).
    const larguraEstimada = 300;
    let top = rect.top;
    let left = rect.right + margem;

    if (placement === 'bottom') { top = rect.bottom + margem; left = rect.left; }
    else if (placement === 'top') { top = rect.top - margem; left = rect.left; }
    else if (placement === 'left') { top = rect.top; left = rect.left - larguraEstimada - margem; }

    this.tooltipPos.set({ top: Math.max(8, top), left: Math.max(8, left) });

    requestAnimationFrame(() => {
      const tt = this._tooltipEl?.nativeElement;
      if (!tt) return;
      const w = tt.offsetWidth;
      const h = tt.offsetHeight;
      let t = this.tooltipPos().top;
      let l = this.tooltipPos().left;
      if (placement === 'top') t = rect.top - h - margem;
      t = Math.min(Math.max(8, t), window.innerHeight - h - 8);
      l = Math.min(Math.max(8, l), window.innerWidth - w - 8);
      this.tooltipPos.set({ top: t, left: l });
    });
  }

  private _espera(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private _esperarElemento(selector: string, timeoutMs: number): Promise<HTMLElement | null> {
    return new Promise(resolve => {
      const inicio = Date.now();
      const tick = () => {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) { resolve(el); return; }
        if (Date.now() - inicio > timeoutMs) { resolve(null); return; }
        setTimeout(tick, 100);
      };
      tick();
    });
  }
}
