import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@veloxml/services';

@Component({
  selector: 'app-forgot-password',
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
          @if (enviado()) {
            <h1 class="title">Verifique seu e-mail</h1>
            <p class="subtitle">
              Se <strong>{{ email }}</strong> estiver cadastrado, você vai receber um e-mail com
              instruções para redefinir sua senha em alguns instantes.
            </p>
            <a routerLink="/auth/login" class="btn-back" style="margin-top: 1.5rem;">← Voltar para o login</a>
          } @else {
            <h1 class="title">Esqueci minha senha</h1>
            <p class="subtitle">Informe seu e-mail de acesso e enviaremos um link para redefinir sua senha.</p>

            <form (ngSubmit)="onSubmit()">
              <div class="field">
                <label for="email">E-mail</label>
                <div class="input-icon-wrap">
                  <svg class="input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="m3 7 9 6 9-6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <input id="email" [(ngModel)]="email" name="email" type="email" placeholder="voce@empresa.com.br" autocomplete="email" required/>
                </div>
              </div>

              <button type="submit" class="btn-primary" [disabled]="!email || loading()">
                {{ loading() ? 'Enviando...' : 'Enviar link de redefinição' }}
              </button>
              <a routerLink="/auth/login" class="btn-back">← Voltar para o login</a>
            </form>
          }
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
    .subtitle strong { color: var(--lg-fg); }

    form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 2.25rem; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    label { font-size: 13.5px; font-weight: 500; color: var(--lg-fg); }

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

    .btn-primary {
      width: 100%; border: none; border-radius: 12px; cursor: pointer;
      background: var(--lg-brand); color: white;
      padding: 13px; font-size: 14px; font-weight: 600; font-family: inherit;
      box-shadow: var(--lg-shadow-soft);
      transition: transform 200ms, filter 200ms, opacity 200ms;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

    .btn-back { align-self: center; color: var(--lg-muted); font-size: 12.5px; text-decoration: none; }
    .btn-back:hover { color: var(--lg-fg); }

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
export class ForgotPasswordComponent {
  private readonly _auth = inject(AuthService);

  email = '';
  loading = signal(false);
  enviado = signal(false);

  onSubmit(): void {
    if (!this.email || this.loading()) return;
    this.loading.set(true);
    this._auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.enviado.set(true); },
      // Mesma mensagem genérica mesmo se der erro — não revela se o e-mail existe ou não.
      error: () => { this.loading.set(false); this.enviado.set(true); },
    });
  }
}
