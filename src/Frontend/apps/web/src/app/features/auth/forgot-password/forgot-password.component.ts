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

        @if (enviado()) {
          <p class="subtitle">Verifique seu e-mail</p>
          <p class="info-text">
            Se <strong>{{ email }}</strong> estiver cadastrado, você vai receber um e-mail com
            instruções para redefinir sua senha em alguns instantes.
          </p>
          <a class="back-link" routerLink="/auth/login">← Voltar para o login</a>
        } @else {
          <p class="subtitle">Esqueci minha senha</p>
          <p class="info-text">Informe seu e-mail de acesso e enviaremos um link para redefinir sua senha.</p>
          <form (ngSubmit)="onSubmit()">
            <div class="field">
              <label>E-mail</label>
              <input [(ngModel)]="email" name="email" type="email" placeholder="seu@email.com.br" autocomplete="email" required/>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="!email || loading()">
              {{ loading() ? 'Enviando...' : 'Enviar link de redefinição' }}
            </button>
            <a class="back-link" routerLink="/auth/login">← Voltar para o login</a>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); }
    .login-card { width: 360px; display: flex; flex-direction: column; gap: 1rem; }
    .brand { display: flex; align-items: center; gap: 0.625rem; }
    .brand-icon {
      width: 34px; height: 34px; border-radius: 9px; background: var(--accent); color: #0d0f14;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .brand h1 { font-size: 1.5rem; margin: 0; }
    .subtitle { color: var(--text); font-size: 15px; font-weight: 600; margin: -0.5rem 0 0; }
    .info-text { color: var(--text2); font-size: 13px; line-height: 1.6; margin: 0; }
    form { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.25rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 12px; color: var(--text2); font-weight: 500; }
    input {
      background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 10px 12px; color: var(--text); font-size: 14px; outline: none; transition: border-color 150ms;
    }
    input:focus { border-color: var(--accent); }
    .btn { width: 100%; justify-content: center; padding: 10px; margin-top: 0.25rem; }
    .back-link { align-self: center; color: var(--text2); font-size: 12.5px; text-decoration: none; margin-top: 0.5rem; }
    .back-link:hover { color: var(--accent); text-decoration: underline; }
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
