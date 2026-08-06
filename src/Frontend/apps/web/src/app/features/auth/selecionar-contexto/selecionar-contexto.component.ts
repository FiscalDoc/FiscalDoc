import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, ClienteService, ContadorService, extractErrorMessage } from '@veloxml/services';
import { ClienteDto, ContadorDto } from '@veloxml/models';

@Component({
  selector: 'app-selecionar-contexto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="login-page">
      <section class="login-form-side">
        <a routerLink="/" class="brand-link">
          <span class="brand-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M6 3.5h8.5L19 8v12.5H6z" stroke-linejoin="round"/>
              <path d="M14 3.5V8h5" stroke-linejoin="round"/>
              <path d="M9 13h6M9 16.5h4" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="brand-name">Fiscal<span class="brand-name-light">Doc</span></span>
        </a>

        <div class="form-wrap">
          <h1 class="title">Como você quer entrar?</h1>
          <p class="subtitle">Escolha o contexto de acesso pra esta sessão.</p>

          <button type="button" class="btn-primary" style="margin-top: 2.25rem;" (click)="continuarComoAdmin()">
            Continuar como Administrador
          </button>

          <div class="divider"><span>ou atuar como</span></div>

          <div class="field">
            <label class="label">Perfil</label>
            <div class="perfil-toggle">
              <button type="button" class="perfil-btn" [class.active]="perfil === 'Contador'" (click)="onPerfilChange('Contador')">Contador</button>
              <button type="button" class="perfil-btn" [class.active]="perfil === 'Cliente'" (click)="onPerfilChange('Cliente')">Cliente</button>
            </div>
          </div>

          @if (perfil === 'Contador') {
            <div class="field combo-field">
              <label class="label">Empresa (Contador)</label>
              <div class="input-icon-wrap">
                <svg class="input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="m20 20-3.5-3.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input
                  [(ngModel)]="contadorBusca"
                  (ngModelChange)="onContadorBuscaChange($event)"
                  (focus)="contadorDropdownOpen.set(true)"
                  (blur)="onContadorBlur()"
                  placeholder="Buscar por nome, empresa ou CRC..."
                />
              </div>
              @if (contadorDropdownOpen()) {
                <div class="combo-dropdown">
                  @if (loadingContadores()) {
                    <div class="combo-item combo-item-hint">Buscando...</div>
                  } @else if (contadorResults().length === 0) {
                    <div class="combo-item combo-item-hint">{{ contadorBusca.trim() ? 'Nenhum contador encontrado' : 'Digite para buscar...' }}</div>
                  } @else {
                    @for (c of contadorResults(); track c.id) {
                      <div class="combo-item" (mousedown)="selecionarContador(c)">{{ contadorLabel(c) }}</div>
                    }
                  }
                </div>
              }
            </div>
          }

          @if (perfil === 'Cliente') {
            <div class="field combo-field">
              <label class="label">Cliente</label>
              <div class="input-icon-wrap">
                <svg class="input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="m20 20-3.5-3.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input
                  [(ngModel)]="clienteBusca"
                  (ngModelChange)="onClienteBuscaChange($event)"
                  (focus)="clienteDropdownOpen.set(true)"
                  (blur)="onClienteBlur()"
                  placeholder="Buscar por razão social ou CNPJ..."
                />
              </div>
              @if (clienteDropdownOpen()) {
                <div class="combo-dropdown">
                  @if (loadingClientes()) {
                    <div class="combo-item combo-item-hint">Buscando...</div>
                  } @else if (clienteResults().length === 0) {
                    <div class="combo-item combo-item-hint">{{ clienteBusca.trim() ? 'Nenhum cliente encontrado' : 'Digite para buscar...' }}</div>
                  } @else {
                    @for (c of clienteResults(); track c.id) {
                      <div class="combo-item" (mousedown)="selecionarCliente(c)">{{ clienteLabel(c) }}</div>
                    }
                  }
                </div>
              }
            </div>
          }

          @if (erro()) { <p class="error-msg">{{ erro() }}</p> }

          <button type="button" class="btn-primary" style="margin-top: .5rem;" [disabled]="!podeEntrar() || entrando()" (click)="entrar()">
            {{ entrando() ? 'Entrando...' : 'Entrar como ' + perfil }}
          </button>
        </div>
      </section>

      <section class="login-image-side">
        <div class="login-image-overlay"></div>
        <div class="login-quote">
          <p class="quote-text">"Reduzimos o tempo de emissão de notas em 70% e paramos de depender do contador para tarefas simples."</p>
          <p class="quote-author">Marina Duarte — Diretora Financeira, Grupo Ventura</p>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      --lg-bg: oklch(0.16 0.03 262);
      --lg-fg: oklch(0.97 0.008 250);
      --lg-muted: oklch(0.74 0.025 256);
      --lg-border: oklch(1 0 0 / 12%);
      --lg-input: oklch(1 0 0 / 16%);
      --lg-brand: oklch(0.62 0.17 254);
      --lg-brand-deep: oklch(0.97 0.01 250);
      --lg-brand-soft: oklch(0.29 0.06 256);
      --lg-cta: oklch(0.78 0.17 158);
      --lg-red: oklch(0.62 0.2 25);
      --lg-shadow-soft: 0 1px 2px oklch(0 0 0 / 0.4), 0 8px 24px oklch(0 0 0 / 0.35);
      display: block;
      font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
      letter-spacing: -0.011em;
    }

    .login-page { display: grid; min-height: 100vh; background: var(--lg-bg); color: var(--lg-fg); }
    @media (min-width: 1024px) { .login-page { grid-template-columns: 1fr 1fr; } }

    .login-form-side { display: flex; flex-direction: column; justify-content: center; padding: 3.5rem 1.5rem; }
    @media (min-width: 640px) { .login-form-side { padding: 3.5rem 2.5rem; } }
    @media (min-width: 1024px) { .login-form-side { padding: 3.5rem 4rem; } }

    .brand-link { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 3rem; width: fit-content; }
    .brand-icon {
      display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--lg-brand-deep), var(--lg-brand));
      color: white;
      box-shadow: var(--lg-shadow-soft);
    }
    .brand-name { font-size: 1.15rem; font-weight: 700; letter-spacing: -0.02em; color: var(--lg-brand-deep); }
    .brand-name-light { font-weight: 500; opacity: .7; }

    .form-wrap { width: 100%; max-width: 26rem; }
    .title { font-size: 1.9rem; font-weight: 700; letter-spacing: -0.02em; color: var(--lg-fg); margin: 0; }
    .subtitle { margin: .5rem 0 0; font-size: 13.5px; color: var(--lg-muted); line-height: 1.5; }

    .btn-primary {
      width: 100%; border: none; border-radius: 12px; cursor: pointer;
      background: var(--lg-brand); color: white;
      padding: 13px; font-size: 14px; font-weight: 600; font-family: inherit;
      box-shadow: var(--lg-shadow-soft);
      transition: transform 200ms, filter 200ms, opacity 200ms;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

    .divider { display: flex; align-items: center; gap: .75rem; color: var(--lg-muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: .06em; margin: 1.5rem 0; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--lg-border); }

    .field { display: flex; flex-direction: column; gap: 8px; margin-top: 1.25rem; }
    .label { font-size: 13.5px; font-weight: 500; color: var(--lg-fg); }

    .input-icon-wrap { position: relative; }
    .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--lg-muted); pointer-events: none; }
    input {
      width: 100%; box-sizing: border-box;
      border: 1px solid var(--lg-input); border-radius: 12px;
      background: var(--lg-bg); color: var(--lg-fg);
      padding: 12px 14px 12px 40px; font-size: 14px; outline: none;
      transition: border-color 150ms, box-shadow 150ms;
      font-family: inherit;
    }
    input:focus { border-color: var(--lg-brand); box-shadow: 0 0 0 4px oklch(0.62 0.17 254 / 0.2); }
    input::placeholder { color: oklch(0.74 0.025 256 / 0.6); }

    .perfil-toggle { display: flex; gap: .5rem; }
    .perfil-btn {
      flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--lg-border);
      background: transparent; color: var(--lg-muted); font-size: 13.5px; font-weight: 500; cursor: pointer;
      font-family: inherit; transition: border-color 150ms, color 150ms, background 150ms;
    }
    .perfil-btn.active { border-color: var(--lg-brand); color: var(--lg-brand); background: oklch(0.62 0.17 254 / 0.12); }

    .error-msg {
      font-size: 13px; color: var(--lg-red); margin: 1.25rem 0 0;
      background: oklch(0.62 0.2 25 / 0.1); border: 1px solid oklch(0.62 0.2 25 / 0.3);
      border-radius: 10px; padding: 9px 12px;
    }

    .combo-field { position: relative; }
    .combo-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20; max-height: 220px; overflow-y: auto;
      background: var(--lg-bg); border: 1px solid var(--lg-border); border-radius: 12px;
      box-shadow: var(--lg-shadow-soft);
    }
    .combo-item { padding: 10px 14px; font-size: 13.5px; color: var(--lg-fg); cursor: pointer; }
    .combo-item:hover { background: var(--lg-brand-soft); }
    .combo-item-hint { color: var(--lg-muted); cursor: default; }
    .combo-item-hint:hover { background: transparent; }

    .login-image-side {
      position: relative;
      display: none;
      overflow: hidden;
      background: url('/assets/landing/emissao-de-nota-fiscal.jpg') center / cover no-repeat, var(--lg-brand-deep);
      padding: 4rem;
      flex-direction: column;
      justify-content: flex-end;
    }
    @media (min-width: 1024px) { .login-image-side { display: flex; } }
    .login-image-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.55); }
    .login-quote { position: relative; z-index: 1; }
    .quote-text { max-width: 24rem; font-size: 1.4rem; font-weight: 600; line-height: 1.4; color: white; margin: 0; }
    .quote-author { margin: 1.5rem 0 0; font-size: 13.5px; color: rgba(255,255,255,.75); }
  `],
})
export class SelecionarContextoComponent {
  private readonly _auth    = inject(AuthService);
  private readonly _cntSvc  = inject(ContadorService);
  private readonly _cliSvc  = inject(ClienteService);
  private readonly _router  = inject(Router);

  perfil: 'Contador' | 'Cliente' = 'Contador';
  entrando = signal(false);
  erro     = signal<string | null>(null);

  contadorBusca = '';
  contadorSelecionado = signal<ContadorDto | null>(null);
  contadorResults = signal<ContadorDto[]>([]);
  contadorDropdownOpen = signal(false);
  loadingContadores = signal(false);
  private _contadorSearchTimer: ReturnType<typeof setTimeout> | null = null;

  clienteBusca = '';
  clienteSelecionado = signal<ClienteDto | null>(null);
  clienteResults = signal<ClienteDto[]>([]);
  clienteDropdownOpen = signal(false);
  loadingClientes = signal(false);
  private _clienteSearchTimer: ReturnType<typeof setTimeout> | null = null;

  contadorLabel(c: ContadorDto): string {
    // Contador não tem CNPJ no cadastro (só CRC — o registro profissional) — usa o CRC no
    // lugar, no mesmo formato "número - nome".
    return c.crc ? `${c.crc} - ${c.nome}` : c.nome;
  }

  clienteLabel(c: ClienteDto): string {
    return `${c.cnpj} - ${c.razaoSocial}`;
  }

  onPerfilChange(perfil: 'Contador' | 'Cliente'): void {
    this.perfil = perfil;
    this.erro.set(null);
  }

  onContadorBuscaChange(valor: string): void {
    this.contadorSelecionado.set(null);
    this.contadorDropdownOpen.set(true);
    if (this._contadorSearchTimer) clearTimeout(this._contadorSearchTimer);
    if (!valor.trim()) { this.contadorResults.set([]); return; }
    this.loadingContadores.set(true);
    this._contadorSearchTimer = setTimeout(() => {
      this._cntSvc.getAll({ termo: valor, pageSize: 15 }).subscribe({
        next: r => { this.contadorResults.set(r.items); this.loadingContadores.set(false); },
        error: () => this.loadingContadores.set(false),
      });
    }, 300);
  }

  selecionarContador(c: ContadorDto): void {
    this.contadorSelecionado.set(c);
    this.contadorBusca = this.contadorLabel(c);
    this.contadorDropdownOpen.set(false);
  }

  onContadorBlur(): void {
    setTimeout(() => this.contadorDropdownOpen.set(false), 150);
  }

  onClienteBuscaChange(valor: string): void {
    this.clienteSelecionado.set(null);
    this.clienteDropdownOpen.set(true);
    if (this._clienteSearchTimer) clearTimeout(this._clienteSearchTimer);
    if (!valor.trim()) { this.clienteResults.set([]); return; }
    this.loadingClientes.set(true);
    this._clienteSearchTimer = setTimeout(() => {
      // Busca global (sem contadorId) — o Admin escolhe o cliente direto, sem precisar
      // selecionar o contador antes.
      this._cliSvc.getAll({ termo: valor, pageSize: 15 }).subscribe({
        next: r => { this.clienteResults.set(r.items); this.loadingClientes.set(false); },
        error: () => this.loadingClientes.set(false),
      });
    }, 300);
  }

  selecionarCliente(c: ClienteDto): void {
    this.clienteSelecionado.set(c);
    this.clienteBusca = this.clienteLabel(c);
    this.clienteDropdownOpen.set(false);
  }

  onClienteBlur(): void {
    setTimeout(() => this.clienteDropdownOpen.set(false), 150);
  }

  podeEntrar(): boolean {
    if (this.perfil === 'Contador') return !!this.contadorSelecionado();
    return !!this.clienteSelecionado();
  }

  continuarComoAdmin(): void {
    this._router.navigate(['/dashboard']);
  }

  entrar(): void {
    if (!this.podeEntrar() || this.entrando()) return;
    this.entrando.set(true);
    this.erro.set(null);
    this._auth.switchContext({
      contadorId: this.perfil === 'Contador' ? this.contadorSelecionado()!.id : undefined,
      perfil: this.perfil,
      clienteId: this.perfil === 'Cliente' ? this.clienteSelecionado()!.id : undefined,
    }).subscribe({
      next: () => {
        this.entrando.set(false);
        this._router.navigate([this.perfil === 'Cliente' ? '/documentos' : '/dashboard']);
      },
      error: err => {
        this.entrando.set(false);
        this.erro.set(extractErrorMessage(err, 'Não foi possível entrar nesse contexto.'));
      },
    });
  }
}
