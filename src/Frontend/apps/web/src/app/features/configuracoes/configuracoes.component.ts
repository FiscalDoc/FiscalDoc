import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, ConfiguracaoService, extractErrorMessage } from '@veloxml/services';
import { FocusNfeConfigDto } from '@veloxml/models';

type Tab = 'email' | 'social' | 'convite' | 'importacao' | 'storage' | 'focusNfe';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
<div class="page">

  <!-- ── Header ── -->
  <header class="page-header">
    <div>
      <h2 class="font-heading">Configurações</h2>
      <p class="page-sub">Configurações globais do sistema</p>
    </div>
  </header>

  <nav class="tabs">
    <button class="tab-btn" [class.active]="tab() === 'email'" (click)="tab.set('email')">E-mail (SMTP)</button>
    <button class="tab-btn" [class.active]="tab() === 'social'" (click)="tab.set('social')">Redes Sociais</button>
    <button class="tab-btn" [class.active]="tab() === 'convite'" (click)="tab.set('convite')">Convidar</button>
    <button class="tab-btn" [class.active]="tab() === 'importacao'" (click)="tab.set('importacao'); carregarIntervalo()">Importação de E-mails</button>
    <button class="tab-btn" [class.active]="tab() === 'storage'" (click)="tab.set('storage')">Armazenamento</button>
    <button class="tab-btn" [class.active]="tab() === 'focusNfe'" (click)="tab.set('focusNfe'); carregarFocusNfe()">Focus NFe</button>
  </nav>

  <!-- ══ E-MAIL (SMTP) ══ -->
  @if (tab() === 'email') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Configuração de E-mail (SMTP)</div>
          <div class="section-sub">Utilizado em todos os envios de e-mail do sistema, incluindo os e-mails de boas-vindas</div>
        </div>
      </div>

      @if (loadingSmtp()) {
        <div class="empty-state">Carregando configurações...</div>
      } @else {
        <form [formGroup]="smtpForm" (ngSubmit)="saveSmtp()" class="settings-form">

          <div class="form-row">
            <div class="field">
              <label class="label">Servidor SMTP *</label>
              <input class="input" type="text" formControlName="host" placeholder="smtp.exemplo.com.br" />
              @if (f['host'].touched && f['host'].errors?.['required']) {
                <span class="field-error">Obrigatório</span>
              }
            </div>
            <div class="field field-sm">
              <label class="label">Porta *</label>
              <input class="input" type="number" formControlName="port" placeholder="587" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="label">E-mail remetente *</label>
              <input class="input" type="email" formControlName="from" placeholder="noreply@suaempresa.com.br" autocomplete="off" />
              @if (f['from'].touched && f['from'].errors?.['email']) {
                <span class="field-error">E-mail inválido</span>
              }
            </div>
            <div class="field">
              <label class="label">Nome remetente *</label>
              <input class="input" type="text" formControlName="fromName" placeholder="FiscalDoc" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="label">Usuário SMTP</label>
              <input class="input" type="text" formControlName="username" placeholder="usuario@smtp" />
            </div>
            <div class="field">
              <label class="label">Senha SMTP</label>
              <input class="input" type="password" formControlName="password" placeholder="Deixe em branco para não alterar" autocomplete="new-password" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="label">Reply-To</label>
              <input class="input" type="email" formControlName="replyTo" placeholder="suporte@suaempresa.com.br" autocomplete="off" />
            </div>
            <div class="field field-center">
              <label class="label">Segurança</label>
              <label class="checkbox-label">
                <input type="checkbox" formControlName="enableSsl" />
                Usar SSL/TLS
              </label>
            </div>
          </div>

          @if (smtpSuccess()) { <div class="alert-success">{{ checkIcon() }} Configurações salvas com sucesso!</div> }
          @if (smtpError()) { <div class="alert-error">{{ smtpError() }}</div> }

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="savingSmtp()">
              {{ savingSmtp() ? 'Salvando...' : 'Salvar Configurações' }}
            </button>
          </div>

        </form>

        <div class="test-block">
          <div class="test-block-title">Testar esta configuração</div>
          <p class="test-block-sub">Envia um e-mail de teste usando os dados preenchidos acima (não precisa salvar antes) para confirmar que o SMTP está funcionando.</p>
          <div class="test-row">
            <input class="input" type="email" [(ngModel)]="testEmailDestino" [ngModelOptions]="{standalone: true}" placeholder="seu-email@exemplo.com.br"/>
            <button type="button" class="btn-ghost" [disabled]="testingSmtp()" (click)="testSmtp()">
              {{ testingSmtp() ? 'Enviando...' : 'Enviar Teste' }}
            </button>
          </div>
          @if (smtpTestSuccess()) { <div class="alert-success">{{ checkIcon() }} E-mail de teste enviado! Confira a caixa de entrada (e o spam).</div> }
          @if (smtpTestError()) { <div class="alert-error">{{ smtpTestError() }}</div> }
        </div>
      }
    </div>
  }

  <!-- ══ REDES SOCIAIS ══ -->
  @if (tab() === 'social') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342a4 4 0 000 5.316m0-5.316a4 4 0 010-5.316m0 5.316L15.316 17m-6.632-8.658L15.316 5m0 8.342a4 4 0 100 5.316 4 4 0 000-5.316zm0-8.342a4 4 0 100 5.316 4 4 0 000-5.316z"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Redes Sociais</div>
          <div class="section-sub">Exibidas no rodapé do site — só aparecem os links preenchidos aqui</div>
        </div>
      </div>

      @if (loadingSocial()) {
        <div class="empty-state">Carregando configurações...</div>
      } @else {
        <form [formGroup]="socialForm" (ngSubmit)="saveSocial()" class="settings-form">
          <div class="form-row">
            <div class="field">
              <label class="label">Instagram</label>
              <input class="input" type="url" formControlName="instagram" placeholder="https://instagram.com/fiscaldoc" />
            </div>
            <div class="field">
              <label class="label">Facebook</label>
              <input class="input" type="url" formControlName="facebook" placeholder="https://facebook.com/fiscaldoc" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label">LinkedIn</label>
              <input class="input" type="url" formControlName="linkedin" placeholder="https://linkedin.com/company/fiscaldoc" />
            </div>
            <div class="field">
              <label class="label">TikTok</label>
              <input class="input" type="url" formControlName="tiktok" placeholder="https://tiktok.com/@fiscaldoc" />
            </div>
          </div>

          @if (socialSuccess()) { <div class="alert-success">{{ checkIcon() }} Redes sociais salvas com sucesso!</div> }
          @if (socialError()) { <div class="alert-error">{{ socialError() }}</div> }

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="savingSocial()">
              {{ savingSocial() ? 'Salvando...' : 'Salvar Redes Sociais' }}
            </button>
          </div>
        </form>
      }
    </div>
  }

  <!-- ══ CONVIDAR ══ -->
  @if (tab() === 'convite') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Convidar para a Plataforma</div>
          <div class="section-sub">Envia um e-mail com o link do teste grátis de 30 dias</div>
        </div>
      </div>

      <form [formGroup]="conviteForm" (ngSubmit)="sendConvite()" class="settings-form">
        <div class="form-row">
          <div class="field">
            <label class="label">Nome do convidado *</label>
            <input class="input" type="text" formControlName="nome" placeholder="João Silva" />
            @if (cf['nome'].touched && cf['nome'].errors?.['required']) {
              <span class="field-error">Obrigatório</span>
            }
          </div>
          <div class="field">
            <label class="label">E-mail *</label>
            <input class="input" type="email" formControlName="email" placeholder="joao@escritorio.com.br" autocomplete="off" />
            @if (cf['email'].touched && cf['email'].errors) {
              <span class="field-error">E-mail inválido</span>
            }
          </div>
        </div>

        @if (conviteSuccess()) { <div class="alert-success">{{ checkIcon() }} Convite enviado com sucesso!</div> }
        @if (conviteError()) { <div class="alert-error">{{ conviteError() }}</div> }

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="sendingConvite()">
            {{ sendingConvite() ? 'Enviando...' : 'Enviar Convite' }}
          </button>
        </div>
      </form>
    </div>
  }

  <!-- ══ IMPORTAÇÃO DE E-MAILS ══ -->
  @if (tab() === 'importacao') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Importação de E-mails (XML)</div>
          <div class="section-sub">Quando habilitado, o sistema lê a caixa de entrada configurada a cada intervalo abaixo e importa anexos XML automaticamente.</div>
        </div>
      </div>

      <div class="settings-form">
        <div class="intervalo-row">
          <div class="field field-sm">
            <label class="label">Intervalo de execução (minutos)</label>
            <input class="input" type="number" min="1" max="1440" [(ngModel)]="intervaloMinutos"/>
          </div>
          <button type="button" class="btn-ghost" [disabled]="salvandoIntervalo()" (click)="salvarIntervalo()">
            {{ salvandoIntervalo() ? 'Salvando...' : 'Salvar Intervalo' }}
          </button>
        </div>
        @if (intervaloSucesso()) { <div class="alert-success">{{ checkIcon() }} Intervalo atualizado para {{ intervaloMinutos }} minuto(s) — já aplicado, sem precisar reiniciar.</div> }
        @if (intervaloErro()) { <div class="alert-error">{{ intervaloErro() }}</div> }

        @if (forcarSucesso()) { <div class="alert-success">{{ checkIcon() }} Importação disparada! Veja o resultado em Logs &gt; E-mail &amp; API em alguns segundos.</div> }
        @if (forcarErro()) { <div class="alert-error">{{ forcarErro() }}</div> }

        <div class="form-actions">
          <a routerLink="/logs" [queryParams]="{ tab: 'integracao' }" class="btn-ghost">Ver histórico em Logs</a>
          <button type="button" class="btn-primary" [disabled]="forcando()" (click)="forcarImportacao()">
            {{ forcando() ? 'Disparando...' : 'Forçar Importação Agora' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══ ARMAZENAMENTO ══ -->
  @if (tab() === 'storage') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 1.1 3.58 2 8 2s8-.9 8-2V7M4 7c0 1.1 3.58 2 8 2s8-.9 8-2M4 7c0-1.1 3.58-2 8-2s8 .9 8 2m0 5c0 1.1-3.58 2-8 2s-8-.9-8-2"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Migração de arquivos para o S3</div>
          <div class="section-sub">Copia os XMLs e imagens que ainda estão no MinIO para o bucket S3 configurado — não apaga o original</div>
        </div>
      </div>

      <div class="settings-form">
        <p class="section-sub">
          Executa uma vez em segundo plano (não bloqueia a tela). Acompanhe o progresso pelos
          logs do servidor (prefixo <code>[MigrarArquivosParaS3]</code>). Pode rodar de novo
          com segurança — arquivos já migrados são pulados.
        </p>
        @if (migracaoSucesso()) { <div class="alert-success">{{ checkIcon() }} Migração disparada em segundo plano.</div> }
        @if (migracaoErro()) { <div class="alert-error">{{ migracaoErro() }}</div> }
        <div class="form-actions">
          <span></span>
          <button type="button" class="btn-primary" [disabled]="migrando()" (click)="migrarParaS3()">
            {{ migrando() ? 'Disparando...' : 'Migrar arquivos para o S3' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══ FOCUS NFE ══ -->
  @if (tab() === 'focusNfe') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Emissão de NF-e (Focus NFe)</div>
          <div class="section-sub">Conta única da plataforma — cada cliente é registrado como uma "empresa" dentro dela, usando o próprio certificado digital</div>
        </div>
      </div>

      @if (loadingFocusNfe()) {
        <div class="empty-state">Carregando configurações...</div>
      } @else {
        <form [formGroup]="focusNfeForm" (ngSubmit)="saveFocusNfe()" class="settings-form">
          <div class="form-row">
            <div class="field">
              <label class="label">
                Token de Homologação
                @if (focusNfeConfig()?.tokenHomologacaoConfigurado) { <span class="tag-ok">configurado</span> }
              </label>
              <input class="input" type="password" formControlName="tokenHomologacao" placeholder="Deixe em branco para não alterar" autocomplete="new-password"/>
            </div>
            <div class="field">
              <label class="label">
                Token de Produção
                @if (focusNfeConfig()?.tokenProducaoConfigurado) { <span class="tag-ok">configurado</span> }
              </label>
              <input class="input" type="password" formControlName="tokenProducao" placeholder="Deixe em branco para não alterar" autocomplete="new-password"/>
            </div>
          </div>

          <div class="field">
            <label class="label">Segredo do Webhook</label>
            <input class="input" type="text" formControlName="webhookSecret" placeholder="Ex.: um texto aleatório só seu"/>
            <p class="section-sub" style="margin:2px 0 0">
              Embutido na URL que a Focus chama quando o status de uma nota muda — diferente
              dos tokens, esse valor é seu (não vem da Focus), por isso continua visível aqui.
              @if (!focusNfeForm.value.webhookSecret) {
                <button type="button" class="btn-ghost" style="padding:2px 8px;font-size:11px;margin-left:6px" (click)="gerarWebhookSecret()">Gerar aleatório</button>
              }
            </p>
          </div>

          @if (webhookUrl()) {
            <div class="field">
              <label class="label">URL do Webhook (cole no painel da Focus NFe)</label>
              <input class="input" type="text" [value]="webhookUrl()" readonly (click)="copiarWebhookUrl()"/>
              @if (webhookUrlCopiado()) { <span class="section-sub">Copiado!</span> }
            </div>
          }

          @if (focusNfeSuccess()) { <div class="alert-success">{{ checkIcon() }} Configurações salvas com sucesso!</div> }
          @if (focusNfeError()) { <div class="alert-error">{{ focusNfeError() }}</div> }

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="savingFocusNfe()">
              {{ savingFocusNfe() ? 'Salvando...' : 'Salvar Configurações' }}
            </button>
          </div>
        </form>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }
    .page-sub { color: var(--text2); font-size: 13px; margin-top: 2px; }

    .intervalo-row { display: flex; align-items: flex-end; gap: .75rem; }
    .test-block { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: .625rem; }
    .test-block-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .test-block-sub { font-size: 12px; color: var(--text2); margin: -4px 0 0; }
    .test-row { display: flex; gap: .625rem; }
    .test-row .input { flex: 1; }

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }

    .section-header {
      display: flex; align-items: center; gap: 12px;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
      background: var(--bg3);
    }
    .section-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: var(--accent-dim); color: var(--accent);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .section-title { font-size: 13.5px; font-weight: 600; color: var(--text); }
    .section-sub   { font-size: 12px; color: var(--text2); margin-top: 2px; }

    .settings-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field-sm { max-width: 160px; }
    .field-center { justify-content: flex-end; padding-bottom: 2px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit;
    }
    .input:focus { border-color: var(--accent); }
    .field-error { font-size: 11px; color: var(--red); }
    .tag-ok { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 999px; font-size: 10px; font-weight: 600; text-transform: none; letter-spacing: 0; background: rgba(0,229,160,.12); color: var(--accent); }

    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); margin-top: 6px; }
    .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent); }

    .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }

    .alert-error {
      background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3);
      color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px;
    }
    .alert-success {
      display: flex; align-items: center; gap: 8px;
      background: rgba(0,229,160,.1); border: 1px solid rgba(0,229,160,.25);
      color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px;
    }
    .empty-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }

    @media (max-width: 700px) {
      .form-row { grid-template-columns: 1fr; }
      .field-sm { max-width: 100%; }
    }
  `]
})
export class ConfiguracoesComponent implements OnInit {
  private readonly _svc  = inject(ConfiguracaoService);
  private readonly _fb   = inject(FormBuilder);
  private readonly _auth = inject(AuthService);

  readonly tab = signal<Tab>('email');
  checkIcon(): string { return '✓'; }

  // SMTP
  loadingSmtp = signal(false);
  savingSmtp  = signal(false);
  smtpSuccess = signal(false);
  smtpError   = signal<string | null>(null);

  testEmailDestino = '';
  testingSmtp      = signal(false);
  smtpTestSuccess  = signal(false);
  smtpTestError    = signal<string | null>(null);

  smtpForm = this._fb.group({
    host:      ['', Validators.required],
    port:      [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
    from:      ['', [Validators.required, Validators.email]],
    fromName:  ['FiscalDoc', Validators.required],
    username:  [''],
    password:  [''],
    enableSsl: [false],
    replyTo:   [''],
  });
  get f() { return this.smtpForm.controls; }

  // Redes Sociais
  loadingSocial = signal(false);
  savingSocial  = signal(false);
  socialSuccess = signal(false);
  socialError   = signal<string | null>(null);

  socialForm = this._fb.group({
    instagram: [''],
    facebook:  [''],
    linkedin:  [''],
    tiktok:    [''],
  });

  // Convidar
  sendingConvite  = signal(false);
  conviteSuccess  = signal(false);
  conviteError    = signal<string | null>(null);

  conviteForm = this._fb.group({
    nome:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });
  get cf() { return this.conviteForm.controls; }

  // Importação de e-mails
  forcando          = signal(false);
  forcarSucesso     = signal(false);
  forcarErro        = signal<string | null>(null);
  intervaloMinutos  = 5;
  salvandoIntervalo = signal(false);
  intervaloSucesso  = signal(false);
  intervaloErro     = signal<string | null>(null);

  // Armazenamento (migração pro S3)
  migrando          = signal(false);
  migracaoSucesso   = signal(false);
  migracaoErro      = signal<string | null>(null);

  // Focus NFe
  loadingFocusNfe  = signal(false);
  savingFocusNfe   = signal(false);
  focusNfeSuccess  = signal(false);
  focusNfeError    = signal<string | null>(null);
  focusNfeConfig   = signal<FocusNfeConfigDto | null>(null);
  webhookUrlCopiado = signal(false);
  private _focusNfeCarregado = false;

  focusNfeForm = this._fb.group({
    tokenHomologacao: [''],
    tokenProducao: [''],
    webhookSecret: [''],
  });

  // Método simples (não signal) — o Reactive Forms não expõe o valor como signal, então isso
  // só precisa ser reavaliado a cada change detection, que já acontece a cada tecla digitada.
  webhookUrl(): string {
    const secret = this.focusNfeForm.value.webhookSecret;
    return secret ? `${location.origin}/api/v1/webhooks/focus-nfe/${secret}` : '';
  }

  ngOnInit(): void {
    this.testEmailDestino = this._auth.currentUser()?.email ?? '';

    this.loadingSmtp.set(true);
    this._svc.getSmtp().subscribe({
      next: dto => {
        this.smtpForm.patchValue({
          host: dto.host, port: dto.port, from: dto.from, fromName: dto.fromName,
          username: dto.username ?? '', enableSsl: dto.enableSsl, replyTo: dto.replyTo ?? '',
        });
        this.loadingSmtp.set(false);
      },
      error: () => this.loadingSmtp.set(false),
    });

    this.loadingSocial.set(true);
    this._svc.getSocial().subscribe({
      next: dto => {
        this.socialForm.patchValue({
          instagram: dto.instagram ?? '', facebook: dto.facebook ?? '',
          linkedin: dto.linkedin ?? '', tiktok: dto.tiktok ?? '',
        });
        this.loadingSocial.set(false);
      },
      error: () => this.loadingSocial.set(false),
    });
  }

  testSmtp(): void {
    if (!this.testEmailDestino) {
      this.smtpTestError.set('Informe um e-mail de destino para o teste.');
      return;
    }
    this.testingSmtp.set(true);
    this.smtpTestSuccess.set(false);
    this.smtpTestError.set(null);
    const v = this.smtpForm.getRawValue();
    this._svc.testSmtp({
      host: v.host || '', port: v.port ?? 587, from: v.from || '', fromName: v.fromName || 'FiscalDoc',
      username: v.username || undefined,
      password: v.password || undefined,
      enableSsl: v.enableSsl ?? false,
      emailDestino: this.testEmailDestino,
    }).subscribe({
      next: () => {
        this.testingSmtp.set(false);
        this.smtpTestSuccess.set(true);
        setTimeout(() => this.smtpTestSuccess.set(false), 6000);
      },
      error: err => {
        this.testingSmtp.set(false);
        this.smtpTestError.set(extractErrorMessage(err, 'Erro ao enviar e-mail de teste.'));
      },
    });
  }

  saveSmtp(): void {
    if (this.smtpForm.invalid) { this.smtpForm.markAllAsTouched(); return; }
    this.savingSmtp.set(true);
    this.smtpSuccess.set(false);
    this.smtpError.set(null);
    const v = this.smtpForm.getRawValue();
    this._svc.saveSmtp({
      host: v.host!, port: v.port!, from: v.from!, fromName: v.fromName!,
      username: v.username || undefined,
      password: v.password || undefined,
      enableSsl: v.enableSsl ?? false,
      replyTo: v.replyTo || undefined,
    }).subscribe({
      next: () => {
        this.savingSmtp.set(false);
        this.smtpSuccess.set(true);
        setTimeout(() => this.smtpSuccess.set(false), 4000);
      },
      error: err => {
        this.savingSmtp.set(false);
        this.smtpError.set(extractErrorMessage(err, 'Erro ao salvar configurações.'));
      },
    });
  }

  saveSocial(): void {
    this.savingSocial.set(true);
    this.socialSuccess.set(false);
    this.socialError.set(null);
    const v = this.socialForm.getRawValue();
    this._svc.saveSocial({
      instagram: v.instagram || undefined,
      facebook: v.facebook || undefined,
      linkedin: v.linkedin || undefined,
      tiktok: v.tiktok || undefined,
    }).subscribe({
      next: () => {
        this.savingSocial.set(false);
        this.socialSuccess.set(true);
        setTimeout(() => this.socialSuccess.set(false), 4000);
      },
      error: err => {
        this.savingSocial.set(false);
        this.socialError.set(extractErrorMessage(err, 'Erro ao salvar redes sociais.'));
      },
    });
  }

  sendConvite(): void {
    if (this.conviteForm.invalid) { this.conviteForm.markAllAsTouched(); return; }
    this.sendingConvite.set(true);
    this.conviteSuccess.set(false);
    this.conviteError.set(null);
    const v = this.conviteForm.getRawValue();
    this._svc.sendConvite({ nome: v.nome!, email: v.email! }).subscribe({
      next: () => {
        this.sendingConvite.set(false);
        this.conviteSuccess.set(true);
        this.conviteForm.reset();
        setTimeout(() => this.conviteSuccess.set(false), 4000);
      },
      error: err => {
        this.sendingConvite.set(false);
        this.conviteError.set(extractErrorMessage(err, 'Erro ao enviar convite.'));
      },
    });
  }

  carregarIntervalo(): void {
    this._svc.getIntervaloImportacao().subscribe(r => this.intervaloMinutos = r.intervaloMinutos);
  }

  salvarIntervalo(): void {
    if (!this.intervaloMinutos || this.intervaloMinutos < 1) {
      this.intervaloErro.set('Informe um intervalo válido (mínimo 1 minuto).');
      return;
    }
    this.salvandoIntervalo.set(true);
    this.intervaloSucesso.set(false);
    this.intervaloErro.set(null);
    this._svc.saveIntervaloImportacao(this.intervaloMinutos).subscribe({
      next: r => {
        this.intervaloMinutos = r.intervaloMinutos;
        this.salvandoIntervalo.set(false);
        this.intervaloSucesso.set(true);
        setTimeout(() => this.intervaloSucesso.set(false), 6000);
      },
      error: err => {
        this.salvandoIntervalo.set(false);
        this.intervaloErro.set(extractErrorMessage(err, 'Erro ao salvar intervalo.'));
      },
    });
  }

  forcarImportacao(): void {
    if (this.forcando()) return;
    this.forcando.set(true);
    this.forcarSucesso.set(false);
    this.forcarErro.set(null);
    this._svc.forcarImportacaoXml().subscribe({
      next: () => {
        this.forcando.set(false);
        this.forcarSucesso.set(true);
        setTimeout(() => this.forcarSucesso.set(false), 8000);
      },
      error: err => {
        this.forcando.set(false);
        this.forcarErro.set(extractErrorMessage(err, 'Erro ao forçar a importação.'));
      },
    });
  }

  migrarParaS3(): void {
    if (this.migrando()) return;
    this.migrando.set(true);
    this.migracaoSucesso.set(false);
    this.migracaoErro.set(null);
    this._svc.migrarArquivosParaS3().subscribe({
      next: () => {
        this.migrando.set(false);
        this.migracaoSucesso.set(true);
        setTimeout(() => this.migracaoSucesso.set(false), 8000);
      },
      error: err => {
        this.migrando.set(false);
        this.migracaoErro.set(extractErrorMessage(err, 'Erro ao disparar a migração.'));
      },
    });
  }

  carregarFocusNfe(): void {
    if (this._focusNfeCarregado) return;
    this._focusNfeCarregado = true;
    this.loadingFocusNfe.set(true);
    this._svc.getFocusNfe().subscribe({
      next: c => {
        this.focusNfeConfig.set(c);
        this.focusNfeForm.patchValue({ webhookSecret: c.webhookSecret ?? '' });
        this.loadingFocusNfe.set(false);
      },
      error: () => this.loadingFocusNfe.set(false),
    });
  }

  gerarWebhookSecret(): void {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    this.focusNfeForm.patchValue({ webhookSecret: secret });
  }

  copiarWebhookUrl(): void {
    const url = this.webhookUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    this.webhookUrlCopiado.set(true);
    setTimeout(() => this.webhookUrlCopiado.set(false), 2000);
  }

  saveFocusNfe(): void {
    if (this.savingFocusNfe()) return;
    this.savingFocusNfe.set(true);
    this.focusNfeSuccess.set(false);
    this.focusNfeError.set(null);
    const v = this.focusNfeForm.getRawValue();

    this._svc.saveFocusNfe({
      tokenHomologacao: v.tokenHomologacao || undefined,
      tokenProducao: v.tokenProducao || undefined,
      webhookSecret: v.webhookSecret || undefined,
    }).subscribe({
      next: c => {
        this.focusNfeConfig.set(c);
        this.focusNfeForm.patchValue({ tokenHomologacao: '', tokenProducao: '' });
        this.savingFocusNfe.set(false);
        this.focusNfeSuccess.set(true);
        setTimeout(() => this.focusNfeSuccess.set(false), 4000);
      },
      error: err => {
        this.savingFocusNfe.set(false);
        this.focusNfeError.set(extractErrorMessage(err, 'Erro ao salvar configurações.'));
      },
    });
  }
}
