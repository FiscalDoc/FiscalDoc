import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@veloxml/services';
import { Setup2faResponse } from '@veloxml/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <h2 class="font-heading">Perfil & Segurança</h2>
      </header>

      <!-- ── Card de acesso/trial (visível para Contadores) ── -->
      @if (auth.currentUser()?.perfil === 'Contador') {
        @if (auth.currentUser()?.acessoExpiracao; as exp) {
          <div class="card acesso-card"
            [class.acesso-critico]="auth.acessoCritico()"
            [class.acesso-expirado]="auth.acessoExpirado()">
            <div class="acesso-icon">
              @if (auth.acessoExpirado()) {
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              } @else {
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              }
            </div>
            <div class="acesso-info">
              @if (auth.acessoExpirado()) {
                <span class="acesso-titulo acesso-titulo-red">Acesso expirado</span>
                <span class="acesso-sub">Seu acesso expirou em <strong>{{ exp | date:'dd/MM/yyyy' }}</strong>. Entre em contato com o administrador para renovar.</span>
              } @else if (auth.acessoCritico()) {
                <span class="acesso-titulo acesso-titulo-yellow">Acesso expira em breve</span>
                <span class="acesso-sub">
                  Faltam <strong>{{ auth.diasRestantesAcesso() }} dia(s)</strong> — vence em <strong>{{ exp | date:'dd/MM/yyyy' }}</strong>.
                  Entre em contato com o administrador para renovar.
                </span>
              } @else {
                <span class="acesso-titulo">Acesso ativo</span>
                <span class="acesso-sub">Seu acesso é válido até <strong>{{ exp | date:'dd/MM/yyyy' }}</strong> ({{ auth.diasRestantesAcesso() }} dias restantes).</span>
              }
            </div>
          </div>
        }

        @if (auth.isOnTrial()) {
          <div class="card acesso-card" [class.acesso-critico]="auth.trialCritico()" [class.acesso-expirado]="auth.trialExpirado()">
            <div class="acesso-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div class="acesso-info">
              @if (auth.trialExpirado()) {
                <span class="acesso-titulo acesso-titulo-red">Período de teste expirado</span>
                <span class="acesso-sub">Faça upgrade para um plano pago para continuar usando o FiscalDoc.</span>
              } @else {
                <span class="acesso-titulo" [class.acesso-titulo-yellow]="auth.trialCritico()">
                  Teste gratuito
                  @if (auth.trialCritico()) { — expira em breve }
                </span>
                <span class="acesso-sub">
                  Faltam <strong>{{ auth.diasRestantesTrial() }} dia(s)</strong> no seu período de avaliação.
                  Vence em <strong>{{ auth.currentUser()?.planoExpiracao | date:'dd/MM/yyyy' }}</strong>.
                </span>
              }
            </div>
          </div>
        }
      }

      <div class="card section">
        <h4 class="section-title">Autenticação em Dois Fatores (2FA)</h4>
        <p class="section-desc">Proteja sua conta com um código TOTP gerado por um aplicativo como Google Authenticator ou Authy.</p>

        @if (!setupData() && !ativado()) {
          @if (erroSetup()) { <div class="alert-error">{{ erroSetup() }}</div> }
          <div class="form-actions">
            <span></span>
            <button class="btn-primary" [disabled]="carregandoSetup()" (click)="iniciarSetup()">
              {{ carregandoSetup() ? 'Gerando...' : 'Ativar 2FA' }}
            </button>
          </div>
        }

        @if (setupData(); as sd) {
          <div class="setup-box">
            <div class="setup-step">
              <span class="step-num">1</span>
              <p>Abra seu aplicativo autenticador e escaneie o QR code ou insira a chave manualmente.</p>
            </div>
            <div class="secret-box">
              <span class="secret-label">Chave secreta:</span>
              <code class="secret-value">{{ sd.secret }}</code>
              <button class="copy-btn" (click)="copiarSecret(sd.secret)" [class.copied]="secretCopied()">
                {{ secretCopied() ? 'Copiado!' : 'Copiar' }}
              </button>
            </div>
            <div class="qr-link-box">
              <a [href]="sd.otpAuthUri" class="qr-link">Abrir no autenticador</a>
              <span class="qr-hint">ou use o link acima no autenticador</span>
            </div>

            <div class="setup-step">
              <span class="step-num">2</span>
              <p>Insira o código gerado pelo aplicativo para confirmar a ativação.</p>
            </div>
            <div class="verify-row">
              <input class="input" [(ngModel)]="verifyCode" type="text" inputmode="numeric" maxlength="6" placeholder="000000"/>
              <button class="btn-primary" [disabled]="!verifyCode || verificando()" (click)="verificarSetup()">
                {{ verificando() ? 'Verificando...' : 'Confirmar ativação' }}
              </button>
            </div>
            @if (erroVerify()) { <div class="alert-error">{{ erroVerify() }}</div> }
          </div>
        }

        @if (ativado()) {
          <div class="alert-ok">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            2FA ativado com sucesso! Sua conta está protegida.
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }

    /* ── Card de acesso ── */
    .acesso-card {
      display: flex; align-items: flex-start; gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-color: rgba(0,229,160,0.25);
      background: rgba(0,229,160,0.05);
    }
    .acesso-card.acesso-critico {
      border-color: rgba(255,209,102,0.35);
      background: rgba(255,209,102,0.07);
    }
    .acesso-card.acesso-expirado {
      border-color: rgba(255,77,109,0.3);
      background: rgba(255,77,109,0.07);
    }
    .acesso-icon {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      background: rgba(0,229,160,0.12); color: var(--accent);
      display: flex; align-items: center; justify-content: center;
    }
    .acesso-critico .acesso-icon { background: rgba(255,209,102,0.12); color: var(--yellow); }
    .acesso-expirado .acesso-icon { background: rgba(255,77,109,0.12); color: var(--red); }
    .acesso-info { display: flex; flex-direction: column; gap: 4px; }
    .acesso-titulo { font-size: 14px; font-weight: 600; color: var(--accent); }
    .acesso-titulo-yellow { color: var(--yellow); }
    .acesso-titulo-red { color: var(--red); }
    .acesso-sub { font-size: 13px; color: var(--text2); line-height: 1.5; }
    .acesso-sub strong { color: var(--text); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0 0 .25rem; font-size: .95rem; font-weight: 600; color: var(--text); }
    .section-desc { margin: 0; font-size: 13px; color: var(--text2); line-height: 1.5; }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { display: flex; align-items: center; gap: 8px; background: rgba(0,229,160,.1); border: 1px solid rgba(0,229,160,.3); color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .form-actions { display: flex; align-items: center; justify-content: space-between; padding-top: .75rem; border-top: 1px solid var(--border); }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer;
    }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

    .setup-box { display: flex; flex-direction: column; gap: 1rem; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; }
    .setup-step { display: flex; align-items: flex-start; gap: .75rem; }
    .step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #0d0f14; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .setup-step p { margin: 0; font-size: 13px; color: var(--text2); }

    .secret-box { display: flex; align-items: center; gap: 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
    .secret-label { font-size: 11px; color: var(--text2); white-space: nowrap; }
    .secret-value { font-family: monospace; font-size: 13px; color: var(--accent); flex: 1; word-break: break-all; letter-spacing: 2px; }
    .copy-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; white-space: nowrap; }
    .copy-btn.copied { color: var(--accent); border-color: var(--accent); }

    .qr-link-box { display: flex; align-items: center; gap: 10px; font-size: 12px; }
    .qr-link { color: var(--accent); text-decoration: underline; font-size: 13px; }
    .qr-hint { color: var(--text2); }

    .verify-row { display: flex; gap: 8px; align-items: center; }
    .input {
      background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: .5rem .75rem; font-size: 1.125rem; outline: none; font-family: monospace;
      width: 120px; text-align: center; letter-spacing: 6px;
    }
    .input:focus { border-color: var(--accent); }
  `],
})
export class PerfilComponent {
  readonly auth = inject(AuthService);

  readonly setupData       = signal<Setup2faResponse | null>(null);
  readonly carregandoSetup = signal(false);
  readonly erroSetup       = signal<string | null>(null);
  readonly verificando     = signal(false);
  readonly erroVerify      = signal<string | null>(null);
  readonly ativado         = signal(false);
  readonly secretCopied    = signal(false);

  verifyCode = '';

  iniciarSetup(): void {
    this.carregandoSetup.set(true);
    this.erroSetup.set(null);
    this.auth.setup2fa().subscribe({
      next: data => { this.setupData.set(data); this.carregandoSetup.set(false); },
      error: () => { this.erroSetup.set('Erro ao iniciar setup do 2FA.'); this.carregandoSetup.set(false); },
    });
  }

  verificarSetup(): void {
    if (!this.verifyCode || this.verificando()) return;
    this.verificando.set(true);
    this.erroVerify.set(null);
    this.auth.verifySetup2fa(this.verifyCode).subscribe({
      next: () => {
        this.verificando.set(false);
        this.setupData.set(null);
        this.ativado.set(true);
      },
      error: () => {
        this.verificando.set(false);
        this.erroVerify.set('Código inválido ou expirado. Tente novamente.');
      },
    });
  }

  copiarSecret(secret: string): void {
    navigator.clipboard.writeText(secret).then(() => {
      this.secretCopied.set(true);
      setTimeout(() => this.secretCopied.set(false), 2000);
    });
  }
}
