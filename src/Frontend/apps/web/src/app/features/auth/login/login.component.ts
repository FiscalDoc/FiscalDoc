import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@veloxml/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
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
          @if (twoFactorToken()) {
            <h1 class="title">Verificação em duas etapas</h1>
            <p class="subtitle">Insira o código de 6 dígitos do seu aplicativo autenticador.</p>

            <div class="field" style="margin-top: 2rem;">
              <label for="totp">Código TOTP</label>
              <input id="totp" [(ngModel)]="totpCode" type="text" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code"/>
            </div>

            @if (errorMsg()) { <p class="error-msg">{{ errorMsg() }}</p> }

            <button type="button" class="btn-primary" [disabled]="!totpCode || loading()" (click)="onSubmit2fa()">
              {{ loading() ? 'Verificando...' : 'Verificar código' }}
            </button>
            <button type="button" class="btn-back" (click)="twoFactorToken.set(null)">← Voltar para o login</button>
          } @else {
            <h1 class="title">Acesse sua conta</h1>
            <p class="subtitle">Entre para emitir notas, acompanhar cancelamentos e baixar seus relatórios fiscais.</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="field">
                <label for="email">E-mail</label>
                <div class="input-icon-wrap">
                  <svg class="input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16v16H4z" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="m3 7 9 6 9-6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <input id="email" formControlName="email" type="email" placeholder="voce@empresa.com.br" autocomplete="email"/>
                </div>
              </div>

              <div class="field">
                <div class="label-row">
                  <label for="password">Senha</label>
                  <a routerLink="/auth/esqueci-senha" class="link-sm">Esqueci minha senha</a>
                </div>
                <div class="input-icon-wrap">
                  <svg class="input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="10" width="16" height="10" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 10V7a4 4 0 118 0v3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <input id="password" formControlName="password" type="password" placeholder="••••••••" autocomplete="current-password"/>
                </div>
              </div>

              @if (blockedMsg()) {
                <div class="blocked-banner">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  <div>
                    <strong>Acesso bloqueado</strong>
                    @if (blockedMsg()) { <div class="blocked-motivo">{{ blockedMsg() }}</div> }
                    <div class="blocked-sub">Entre em contato com o administrador do sistema.</div>
                  </div>
                </div>
              }

              @if (errorMsg()) { <p class="error-msg">{{ errorMsg() }}</p> }

              <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>

            <p class="secure-note">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Conexão criptografada e certificado digital protegido.
            </p>
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
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
      letter-spacing: -0.011em;
    }

    .login-page {
      display: grid;
      height: 100%;
      background: var(--lg-bg);
      color: var(--lg-fg);
    }
    @media (min-width: 1024px) {
      .login-page { grid-template-columns: 1fr 1fr; }
    }

    .login-form-side {
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow-y: auto;
      padding: 3.5rem 1.5rem;
    }
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

    form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 2.25rem; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    .label-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    label { font-size: 13.5px; font-weight: 500; color: var(--lg-fg); }
    .link-sm { font-size: 12px; font-weight: 500; color: var(--lg-brand); text-decoration: none; }
    .link-sm:hover { text-decoration: underline; }

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
    #totp { padding-left: 14px; letter-spacing: .3em; text-align: center; font-size: 18px; font-weight: 600; }
    input:focus { border-color: var(--lg-brand); box-shadow: 0 0 0 4px oklch(0.48 0.16 255 / 0.15); }
    input::placeholder { color: oklch(0.53 0.03 256 / 0.7); }
    /* O Chrome ignora "background" em campo autopreenchido e pinta de branco por conta própria —
       o único jeito de sobrescrever é com esse box-shadow inset gigante + atrasar a transição
       que ele aplica na cor de fundo. */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-text-fill-color: var(--lg-fg);
      -webkit-box-shadow: 0 0 0 1000px var(--lg-bg) inset;
      box-shadow: 0 0 0 1000px var(--lg-bg) inset;
      caret-color: var(--lg-fg);
      transition: background-color 5000s ease-in-out 0s;
    }

    .btn-primary {
      width: 100%; border: none; border-radius: 12px; cursor: pointer;
      background: var(--lg-brand); color: white;
      padding: 13px; font-size: 14px; font-weight: 600; font-family: inherit;
      box-shadow: var(--lg-shadow-soft);
      transition: transform 200ms, filter 200ms, opacity 200ms;
      margin-top: 4px;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

    .btn-back { background: none; border: none; color: var(--lg-muted); font-size: 12.5px; cursor: pointer; padding: 0; text-align: left; margin-top: 1rem; font-family: inherit; }
    .btn-back:hover { color: var(--lg-fg); }

    .error-msg {
      font-size: 13px; color: var(--lg-red); margin: 0;
      background: oklch(0.577 0.245 27.325 / 0.08); border: 1px solid oklch(0.577 0.245 27.325 / 0.25);
      border-radius: 10px; padding: 9px 12px;
    }
    .blocked-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: oklch(0.577 0.245 27.325 / 0.06); border: 1px solid oklch(0.577 0.245 27.325 / 0.25);
      border-radius: 10px; padding: 12px; color: var(--lg-red); font-size: 13px;
    }
    .blocked-banner svg { flex-shrink: 0; margin-top: 1px; }
    .blocked-banner strong { display: block; }
    .blocked-motivo { color: var(--lg-fg); font-size: 12px; margin-top: 4px; font-style: italic; }
    .blocked-sub { color: var(--lg-muted); font-size: 11.5px; margin-top: 4px; }

    .signup-hint { margin: 2rem 0 0; font-size: 13.5px; color: var(--lg-muted); }
    .link-strong { color: var(--lg-brand); font-weight: 600; text-decoration: none; }
    .link-strong:hover { text-decoration: underline; }
    .secure-note { display: flex; align-items: center; gap: 8px; margin: 1.5rem 0 0; font-size: 12px; color: var(--lg-muted); }
    .secure-note svg { color: var(--lg-cta); flex-shrink: 0; }

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
export class LoginComponent implements OnInit {
  private readonly _auth  = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _route  = inject(ActivatedRoute);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading       = signal(false);
  errorMsg      = signal<string | null>(null);
  blockedMsg    = signal<string | null>(null);
  twoFactorToken = signal<string | null>(null);
  totpCode      = '';

  ngOnInit(): void {
    this._route.queryParams.subscribe(params => {
      if (params['blocked'] === '1') {
        const motivo = params['motivo'];
        this.blockedMsg.set(motivo || 'Acesso bloqueado pelo administrador.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.form.getRawValue();
    this._auth.login({ email, password }).subscribe({
      next: (res) => {
        if (res.requiresTwoFactor && res.twoFactorToken) {
          this.twoFactorToken.set(res.twoFactorToken);
          this.loading.set(false);
          return;
        }
        this._router.navigate([this._destinoAposLogin()]);
      },
      error: () => {
        this.errorMsg.set('E-mail ou senha incorretos.');
        this.loading.set(false);
      },
    });
  }

  onSubmit2fa(): void {
    const token = this.twoFactorToken();
    if (!token || !this.totpCode || this.loading()) return;
    this.loading.set(true);
    this.errorMsg.set(null);

    this._auth.verify2fa(token, this.totpCode).subscribe({
      next: () => {
        this._router.navigate([this._destinoAposLogin()]);
      },
      error: () => {
        this.errorMsg.set('Código inválido ou expirado.');
        this.loading.set(false);
      },
    });
  }

  private _destinoAposLogin(): string {
    const perfil = this._auth.currentUser()?.perfil;
    if (perfil === 'Administrador') return '/auth/selecionar-contexto';
    return '/dashboard';
  }
}
