import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfiguracaoService, extractErrorMessage } from '@veloxml/services';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="page">

  <!-- ── Header ── -->
  <header class="page-header">
    <div>
      <h2 class="font-heading">Configurações</h2>
      <p class="page-sub">Configurações globais do sistema</p>
    </div>
  </header>

  <!-- ── SMTP ── -->
  <div class="card">
    <div class="section-header">
      <div class="section-icon">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <div>
        <div class="section-title">Configuração de E-mail (SMTP)</div>
        <div class="section-sub">Utilizado em todos os envios de e-mail do sistema</div>
      </div>
    </div>

    @if (loading()) {
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
            <input class="input" type="email" formControlName="from" placeholder="noreply@suaempresa.com.br" />
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
            <input class="input" type="password" formControlName="password" placeholder="Deixe em branco para não alterar" />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label class="label">Reply-To</label>
            <input class="input" type="email" formControlName="replyTo" placeholder="suporte@suaempresa.com.br" />
          </div>
          <div class="field field-center">
            <label class="label">Segurança</label>
            <label class="checkbox-label">
              <input type="checkbox" formControlName="enableSsl" />
              Usar SSL/TLS
            </label>
          </div>
        </div>

        @if (success()) {
          <div class="alert-success">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Configurações salvas com sucesso!
          </div>
        }
        @if (submitError()) {
          <div class="alert-error">{{ submitError() }}</div>
        }

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="saving()">
            {{ saving() ? 'Salvando...' : 'Salvar Configurações' }}
          </button>
        </div>

      </form>
    }
  </div>
</div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }
    .page-sub { color: var(--text2); font-size: 13px; margin-top: 2px; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

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

    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .field-sm { max-width: 100%; }
    }
  `]
})
export class ConfiguracoesComponent implements OnInit {
  private readonly _svc = inject(ConfiguracaoService);
  private readonly _fb  = inject(FormBuilder);

  loading     = signal(false);
  saving      = signal(false);
  success     = signal(false);
  submitError = signal<string | null>(null);

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

  ngOnInit(): void {
    this.loading.set(true);
    this._svc.getSmtp().subscribe({
      next: dto => {
        this.smtpForm.patchValue({
          host: dto.host, port: dto.port, from: dto.from, fromName: dto.fromName,
          username: dto.username ?? '', enableSsl: dto.enableSsl, replyTo: dto.replyTo ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveSmtp(): void {
    if (this.smtpForm.invalid) { this.smtpForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.success.set(false);
    this.submitError.set(null);
    const v = this.smtpForm.getRawValue();
    this._svc.saveSmtp({
      host: v.host!, port: v.port!, from: v.from!, fromName: v.fromName!,
      username: v.username || undefined,
      password: v.password || undefined,
      enableSsl: v.enableSsl ?? false,
      replyTo: v.replyTo || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        setTimeout(() => this.success.set(false), 4000);
      },
      error: err => {
        this.saving.set(false);
        this.submitError.set(extractErrorMessage(err, 'Erro ao salvar configurações.'));
      },
    });
  }
}
