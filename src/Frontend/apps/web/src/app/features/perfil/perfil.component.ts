import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, extractErrorMessage } from '@veloxml/services';
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
            <button class="btn-upgrade" (click)="showUpgradeModal.set(true)">Fazer upgrade</button>
          </div>
        }
      }

      <div class="card section">
        <h4 class="section-title">Alterar Senha</h4>
        <p class="section-desc">Troque sua senha de acesso. Você precisa informar a senha atual para confirmar.</p>

        <div class="form-grid">
          <div class="field">
            <label class="label">Senha atual</label>
            <input class="input-text" type="password" [(ngModel)]="senhaAtual" autocomplete="current-password"/>
          </div>
          <div class="field">
            <label class="label">Nova senha</label>
            <input class="input-text" type="password" [(ngModel)]="novaSenha" placeholder="Mínimo 8 caracteres" autocomplete="new-password"/>
          </div>
          <div class="field">
            <label class="label">Confirmar nova senha</label>
            <input class="input-text" type="password" [(ngModel)]="confirmarSenha" autocomplete="new-password"/>
          </div>
        </div>

        @if (senhaSucesso()) { <div class="alert-ok">Senha alterada com sucesso!</div> }
        @if (erroSenha()) { <div class="alert-error">{{ erroSenha() }}</div> }

        <div class="form-actions">
          <span></span>
          <button class="btn-primary" [disabled]="alterandoSenha()" (click)="alterarSenha()">
            {{ alterandoSenha() ? 'Alterando...' : 'Alterar Senha' }}
          </button>
        </div>
      </div>

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

    <!-- ── Modal de upgrade de plano ── -->
    @if (showUpgradeModal()) {
      <div class="overlay" (click)="showUpgradeModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title font-heading">Fazer upgrade do plano</h3>
            <button class="modal-close" (click)="showUpgradeModal.set(false)">✕</button>
          </header>
          <div class="modal-body">
            <p class="upgrade-text">
              Fale com a gente pelo WhatsApp para escolher o melhor plano pago para o seu escritório e continuar usando o FiscalDoc sem interrupções.
            </p>
            <a class="btn-whatsapp" [href]="whatsappUpgradeUrl()" target="_blank" rel="noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.44.79 3.07 1.2 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.13-4.9-4.32-.14-.19-1.17-1.56-1.17-2.98s.74-2.11 1-2.4c.26-.29.57-.36.76-.36h.55c.18 0 .42-.03.65.5.24.53.81 1.85.88 1.99.07.14.12.3.02.48-.1.19-.15.3-.29.46-.15.17-.31.38-.45.51-.15.14-.3.3-.13.58.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.44.29.15.46.13.63-.07.17-.19.72-.83.91-1.12.19-.29.38-.24.63-.14.26.1 1.63.77 1.91.91.29.14.48.22.55.34.07.13.07.72-.17 1.4z"/></svg>
              Chamar no WhatsApp
            </a>
            <span class="upgrade-hint">Ou envie mensagem direto: {{ whatsappNumberFormatted }}</span>
          </div>
        </div>
      </div>
    }
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
    .btn-upgrade {
      align-self: center; flex-shrink: 0;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: .5rem 1rem; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-upgrade:hover { opacity: .88; }

    /* ── Modal de upgrade ── */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 420px; }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
    .upgrade-text { margin: 0; font-size: 13.5px; color: var(--text2); line-height: 1.6; }
    .btn-whatsapp {
      display: inline-flex; align-items: center; gap: 8px;
      background: #25D366; color: #06301a; border: none; border-radius: 8px;
      padding: .625rem 1.25rem; font-size: 14px; font-weight: 700; cursor: pointer;
      text-decoration: none; white-space: nowrap;
    }
    .btn-whatsapp:hover { opacity: .9; }
    .upgrade-hint { font-size: 12px; color: var(--text3); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0 0 .25rem; font-size: .95rem; font-weight: 600; color: var(--text); }
    .section-desc { margin: 0; font-size: 13px; color: var(--text2); line-height: 1.5; }

    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .875rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input-text { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .input-text:focus { border-color: var(--accent); }
    @media (max-width: 700px) { .form-grid { grid-template-columns: 1fr; } }

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
  readonly showUpgradeModal = signal(false);

  readonly alterandoSenha = signal(false);
  readonly senhaSucesso   = signal(false);
  readonly erroSenha      = signal<string | null>(null);
  senhaAtual = '';
  novaSenha = '';
  confirmarSenha = '';

  verifyCode = '';

  private readonly _whatsappNumber = '5511973982559';
  readonly whatsappNumberFormatted = '+55 11 97398-2559';

  whatsappUpgradeUrl(): string {
    const nome = this.auth.currentUser()?.nome ?? '';
    const msg = `Olá! Sou ${nome} e quero fazer upgrade do meu plano no FiscalDoc.`;
    return `https://wa.me/${this._whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  alterarSenha(): void {
    this.erroSenha.set(null);
    this.senhaSucesso.set(false);

    if (!this.senhaAtual || !this.novaSenha || !this.confirmarSenha) {
      this.erroSenha.set('Preencha todos os campos.');
      return;
    }
    if (this.novaSenha.length < 8) {
      this.erroSenha.set('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (this.novaSenha !== this.confirmarSenha) {
      this.erroSenha.set('A confirmação não confere com a nova senha.');
      return;
    }

    this.alterandoSenha.set(true);
    this.auth.changePassword(this.senhaAtual, this.novaSenha).subscribe({
      next: () => {
        this.alterandoSenha.set(false);
        this.senhaSucesso.set(true);
        this.senhaAtual = '';
        this.novaSenha = '';
        this.confirmarSenha = '';
        setTimeout(() => this.senhaSucesso.set(false), 4000);
      },
      error: err => {
        this.alterandoSenha.set(false);
        this.erroSenha.set(extractErrorMessage(err, 'Erro ao alterar senha.'));
      },
    });
  }

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
