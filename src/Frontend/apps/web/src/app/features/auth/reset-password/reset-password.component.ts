import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, extractErrorMessage } from '@veloxml/services';

@Component({
  selector: 'app-reset-password',
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

        @if (validando()) {
          <p class="info-text">Verificando link...</p>
        } @else if (!tokenValido()) {
          <p class="subtitle">Link inválido ou expirado</p>
          <p class="info-text">Esse link de redefinição de senha não é mais válido. Solicite um novo.</p>
          <a class="back-link" routerLink="/auth/esqueci-senha">Solicitar novo link</a>
        } @else if (concluido()) {
          <p class="subtitle">Senha definida!</p>
          <p class="info-text">Sua senha foi atualizada. Já pode entrar com ela.</p>
          <a class="btn btn-primary" routerLink="/auth/login" style="text-align:center;text-decoration:none">Ir para o login</a>
        } @else {
          <p class="subtitle">Definir nova senha</p>
          <form (ngSubmit)="onSubmit()">
            <div class="field">
              <label>Nova senha</label>
              <input [(ngModel)]="novaSenha" name="novaSenha" type="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password" required/>
            </div>
            <div class="field">
              <label>Confirmar nova senha</label>
              <input [(ngModel)]="confirmarSenha" name="confirmarSenha" type="password" placeholder="Repita a senha" autocomplete="new-password" required/>
            </div>
            @if (errorMsg()) { <p class="error-msg">{{ errorMsg() }}</p> }
            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? 'Salvando...' : 'Definir senha' }}
            </button>
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
    .error-msg {
      font-size: 13px; color: var(--red); background: rgba(255,77,109,0.1);
      border: 1px solid rgba(255,77,109,0.2); border-radius: var(--radius-sm); padding: 8px 12px; margin: 0;
    }
    .back-link { align-self: center; color: var(--text2); font-size: 12.5px; text-decoration: none; margin-top: 0.5rem; }
    .back-link:hover { color: var(--accent); text-decoration: underline; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private readonly _auth  = inject(AuthService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  private token = '';
  novaSenha = '';
  confirmarSenha = '';

  validando  = signal(true);
  tokenValido = signal(false);
  loading    = signal(false);
  concluido  = signal(false);
  errorMsg   = signal<string | null>(null);

  ngOnInit(): void {
    this.token = this._route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.validando.set(false);
      this.tokenValido.set(false);
      return;
    }

    this._auth.validateResetToken(this.token).subscribe({
      next: (r) => { this.validando.set(false); this.tokenValido.set(r.valido); },
      error: () => { this.validando.set(false); this.tokenValido.set(false); },
    });
  }

  onSubmit(): void {
    if (this.loading()) return;
    if (this.novaSenha.length < 8) {
      this.errorMsg.set('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (this.novaSenha !== this.confirmarSenha) {
      this.errorMsg.set('As senhas não coincidem.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);
    this._auth.resetPassword(this.token, this.novaSenha).subscribe({
      next: () => { this.loading.set(false); this.concluido.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(extractErrorMessage(err, 'Não foi possível redefinir a senha.'));
      },
    });
  }
}
