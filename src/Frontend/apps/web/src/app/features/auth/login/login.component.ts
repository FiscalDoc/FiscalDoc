import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@veloxml/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card card">
        <div class="brand">
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
          </div>
          <h1 class="font-heading">FiscalDoc</h1>
        </div>
        <p class="subtitle">Hub Fiscal para Contadores</p>

        @if (twoFactorToken()) {
          <!-- 2FA Step -->
          <div class="two-fa-info">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>Insira o código de 6 dígitos do seu aplicativo autenticador.</span>
          </div>
          <div class="field">
            <label>Código TOTP</label>
            <input [(ngModel)]="totpCode" type="text" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code"/>
          </div>
          @if (errorMsg()) { <p class="error-msg">{{ errorMsg() }}</p> }
          <button type="button" class="btn btn-primary" [disabled]="!totpCode || loading()" (click)="onSubmit2fa()">
            {{ loading() ? 'Verificando...' : 'Verificar código' }}
          </button>
          <button type="button" class="btn-back" (click)="twoFactorToken.set(null)">← Voltar para o login</button>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field">
              <label>E-mail</label>
              <input formControlName="email" type="email" placeholder="seu@email.com.br" autocomplete="email" />
            </div>
            <div class="field">
              <label>Senha</label>
              <input formControlName="password" type="password" placeholder="••••••••" autocomplete="current-password" />
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

            @if (errorMsg()) {
              <p class="error-msg">{{ errorMsg() }}</p>
            }

            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Entrando...' : 'Entrar' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg);
    }
    .login-card {
      width: 360px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: var(--accent);
      color: #0d0f14;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .brand h1 {
      font-size: 1.5rem;
      margin: 0;
    }
    .subtitle {
      color: var(--text2);
      font-size: 13px;
      margin-top: -0.5rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    label {
      font-size: 12px;
      color: var(--text2);
      font-weight: 500;
    }
    input {
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      color: var(--text);
      font-size: 14px;
      outline: none;
      transition: border-color 150ms;
    }
    input:focus { border-color: var(--accent); }
    .btn {
      width: 100%;
      justify-content: center;
      padding: 10px;
      margin-top: 0.25rem;
    }
    .error-msg {
      font-size: 13px;
      color: var(--red);
      background: rgba(255,77,109,0.1);
      border: 1px solid rgba(255,77,109,0.2);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      margin: 0;
    }
    .blocked-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(255,77,109,0.08); border: 1px solid rgba(255,77,109,0.3);
      border-radius: var(--radius-sm); padding: 12px; color: var(--red); font-size: 13px;
    }
    .blocked-banner svg { flex-shrink: 0; margin-top: 1px; }
    .blocked-banner strong { display: block; }
    .blocked-motivo { color: var(--text); font-size: 12px; margin-top: 4px; font-style: italic; }
    .blocked-sub { color: var(--text2); font-size: 11.5px; margin-top: 4px; }
    .two-fa-info {
      display: flex; align-items: center; gap: 10px;
      background: rgba(0,229,160,0.07); border: 1px solid rgba(0,229,160,0.2);
      border-radius: var(--radius-sm); padding: 10px 12px;
      color: var(--accent); font-size: 13px;
    }
    .two-fa-info svg { flex-shrink: 0; }
    .btn-back {
      background: none; border: none; color: var(--text2); font-size: 12px;
      cursor: pointer; padding: 0; text-align: left;
    }
    .btn-back:hover { color: var(--text); }
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
        const perfil = this._auth.currentUser()?.perfil;
        const dest = perfil === 'Cliente' ? '/documentos' : '/dashboard';
        this._router.navigate([dest]);
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
        const perfil = this._auth.currentUser()?.perfil;
        const dest = perfil === 'Cliente' ? '/documentos' : '/dashboard';
        this._router.navigate([dest]);
      },
      error: () => {
        this.errorMsg.set('Código inválido ou expirado.');
        this.loading.set(false);
      },
    });
  }
}
