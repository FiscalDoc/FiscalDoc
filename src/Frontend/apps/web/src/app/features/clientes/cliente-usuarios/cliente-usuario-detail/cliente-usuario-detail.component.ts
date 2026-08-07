import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, ClienteUsuarioService, extractErrorMessage, extractFieldErrors } from '@veloxml/services';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-cliente-usuario-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (loading()) {
      <div class="loading-state">Carregando...</div>
    } @else {
      <div class="page">
        <div class="page-header">
          <button class="back-btn" (click)="goBack()">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Usuários
          </button>
          <h2 class="page-title">{{ isNew() ? 'Novo Usuário' : (form.get('nome')?.value || 'Usuário') }}</h2>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card section">
          <h4 class="section-title">Dados do Usuário</h4>

          @if (!isNew()) {
            <div class="usuario-header">
              <label class="avatar-upload" title="Clique para trocar a foto">
                <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onAvatarChange($event)" style="display:none"/>
                @if (temAvatar()) {
                  <img class="profile-avatar" [src]="avatarSrc()" alt="avatar"/>
                } @else {
                  <div class="profile-avatar" [style.background]="avatarBg(form.get('nome')?.value || '?')">
                    {{ initials(form.get('nome')?.value || '?') }}
                  </div>
                }
                <div class="avatar-overlay">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                @if (uploadingAvatar()) { <div class="avatar-loading">...</div> }
              </label>
              <div>
                <p class="avatar-hint">Clique na foto pra trocar. JPG, PNG ou WebP.</p>
                @if (avatarError()) { <span class="field-error">{{ avatarError() }}</span> }
              </div>
            </div>
          }

          <div class="form-grid">
            <div class="field">
              <label class="label">Nome *</label>
              <input class="input" type="text" formControlName="nome" placeholder="Nome completo"
                [class.error]="(f['nome'].touched && f['nome'].errors?.['required']) || fieldErrors()['nome']" />
              @if (f['nome'].touched && f['nome'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
              @if (fieldErrors()['nome']) { <span class="field-error">{{ fieldErrors()['nome'] }}</span> }
            </div>
            <div class="field">
              <label class="label">E-mail {{ isNew() ? '*' : '' }}</label>
              <input class="input" type="email" formControlName="email" placeholder="email@empresa.com" autocomplete="off"
                [class.error]="(f['email'].touched && f['email'].invalid) || fieldErrors()['email']" />
              @if (isNew() && f['email'].touched && f['email'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
              @if (isNew() && f['email'].touched && f['email'].errors?.['email']) { <span class="field-error">E-mail inválido</span> }
              @if (fieldErrors()['email']) { <span class="field-error">{{ fieldErrors()['email'] }}</span> }
              @if (!isNew()) { <span class="hint">O e-mail é o identificador de acesso e não pode ser alterado.</span> }
            </div>
          </div>

          @if (isNew()) {
            <p class="hint">Um e-mail será enviado para o usuário definir a própria senha de acesso.</p>
          } @else {
            <div class="form-grid">
              <div class="field" style="justify-content:flex-end;padding-bottom:2px;">
                <label class="label">Status</label>
                <label class="toggle-row">
                  <input type="checkbox" formControlName="ativo" style="width:16px;height:16px;accent-color:var(--accent);" />
                  Usuário ativo
                </label>
              </div>
              <div class="field" style="justify-content:flex-end;padding-bottom:2px;">
                <label class="label">Senha</label>
                <button type="button" class="btn-ghost btn-reset-senha" [disabled]="resetandoSenha()" (click)="resetarSenha()">
                  {{ resetandoSenha() ? 'Enviando...' : 'Resetar senha' }}
                </button>
              </div>
            </div>
            @if (resetSenhaMsg()) {
              <p class="hint" [class.hint-error]="resetSenhaErro()">{{ resetSenhaMsg() }}</p>
            }
          }

          @if (submitError()) { <div class="alert-error">{{ submitError() }}</div> }

          <div class="form-actions">
            <button type="button" class="btn-ghost" (click)="goBack()">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="submitting()">
              {{ submitting() ? 'Salvando...' : (isNew() ? 'Criar Usuário' : 'Salvar') }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .loading-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; align-self: flex-start; }
    .back-btn:hover { color: var(--accent); }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; }
    .input:focus { border-color: var(--accent); }
    .input.error { border-color: var(--red); }
    .input:disabled { opacity: .6; cursor: not-allowed; }
    .field-error { font-size: 11px; color: var(--red); }
    .hint { font-size: 11px; color: var(--text2); }
    .hint-error { color: var(--red); }
    .toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); margin-top: 6px; }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
    .btn-reset-senha { margin-top: 6px; align-self: flex-start; }

    /* Avatar upload — mesmo padrão da tela de Contador */
    .usuario-header { display: flex; align-items: center; gap: 1rem; }
    .avatar-upload { position: relative; cursor: pointer; display: block; flex-shrink: 0; }
    .profile-avatar {
      width: 56px; height: 56px; border-radius: 14px; color: #0d0f14; font-size: 20px; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    img.profile-avatar { object-fit: cover; border-radius: 14px; width: 56px; height: 56px; }
    .avatar-overlay {
      position: absolute; inset: 0; border-radius: 14px; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center; color: #fff;
      opacity: 0; transition: opacity 150ms;
    }
    .avatar-upload:hover .avatar-overlay { opacity: 1; }
    .avatar-loading {
      position: absolute; inset: 0; border-radius: 14px; background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px;
    }
    .avatar-hint { font-size: 11px; color: var(--text2); margin: 0; }

    /* ── Tablet (iPad) e mobile ── */
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .col-2 { grid-column: span 1; }
      .form-actions { flex-direction: column-reverse; align-items: stretch; }
    }
  `],
})
export class ClienteUsuarioDetailComponent implements OnInit {
  private readonly _svc    = inject(ClienteUsuarioService);
  private readonly _auth   = inject(AuthService);
  private readonly _fb     = inject(FormBuilder);
  private readonly _route  = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  private clienteId  = '';
  private usuarioId  = '';

  readonly isNew    = signal(true);
  readonly loading  = signal(true);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly temAvatar = signal(false);
  readonly uploadingAvatar = signal(false);
  readonly avatarError = signal<string | null>(null);
  readonly avatarBust = signal(Date.now());

  readonly resetandoSenha = signal(false);
  readonly resetSenhaMsg  = signal<string | null>(null);
  readonly resetSenhaErro = signal(false);

  form = this._fb.group({
    nome:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    ativo: [true],
  });
  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.usuarioId = this._route.snapshot.paramMap.get('usuarioId') ?? '';
    this.isNew.set(!this.usuarioId || this.usuarioId === 'novo');

    if (this.isNew()) {
      this.loading.set(false);
      return;
    }

    this.form.get('email')?.disable();

    this._svc.getById(this.clienteId, this.usuarioId).subscribe({
      next: u => {
        this.form.patchValue({ nome: u.nome, email: u.email, ativo: u.ativo });
        this.temAvatar.set(!!u.avatarUrl);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.submitError.set('Usuário não encontrado.'); },
    });
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId, 'usuarios']); }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarError.set(null);
    this.uploadingAvatar.set(true);
    this._svc.uploadAvatar(this.clienteId, this.usuarioId, file).subscribe({
      next: () => {
        this.uploadingAvatar.set(false);
        this.temAvatar.set(true);
        this.avatarBust.set(Date.now());
        // Se o usuário editado é o da sessão atual, sincroniza a foto na sidebar sem precisar de reload.
        this._auth.refreshMe();
      },
      error: err => {
        this.uploadingAvatar.set(false);
        this.avatarError.set(extractErrorMessage(err, 'Erro ao enviar a foto.'));
      },
    });
  }

  avatarSrc(): string {
    return `${environment.apiUrl}/usuarios/${this.usuarioId}/avatar?t=${this.avatarBust()}`;
  }

  initials(nome: string): string {
    const parts = nome.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0]?.[0] ?? '?').toUpperCase();
  }

  avatarBg(nome: string): string {
    const colors = ['#00e5a0','#0066ff','#a855f7','#f59e0b','#ef4444','#06b6d4','#84cc16','#ec4899'];
    let hash = 0;
    for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  resetarSenha(): void {
    this.resetSenhaMsg.set(null);
    this.resetandoSenha.set(true);
    this._svc.resetarSenha(this.clienteId, this.usuarioId).subscribe({
      next: () => {
        this.resetandoSenha.set(false);
        this.resetSenhaErro.set(false);
        this.resetSenhaMsg.set('E-mail de redefinição de senha enviado com sucesso.');
      },
      error: err => {
        this.resetandoSenha.set(false);
        this.resetSenhaErro.set(true);
        this.resetSenhaMsg.set(extractErrorMessage(err, 'Erro ao enviar o e-mail de redefinição.'));
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.submitError.set(null);
    this.fieldErrors.set({});
    const v = this.form.getRawValue();

    if (this.isNew()) {
      this._svc.create(this.clienteId, { nome: v.nome!, email: v.email! }).subscribe({
        next: () => { this.submitting.set(false); this.goBack(); },
        error: err => {
          this.submitting.set(false);
          this.submitError.set(extractErrorMessage(err, 'Erro ao criar usuário.'));
          this.fieldErrors.set(extractFieldErrors(err) ?? {});
        },
      });
    } else {
      this._svc.update(this.clienteId, this.usuarioId, { nome: v.nome!, ativo: v.ativo ?? true }).subscribe({
        next: () => { this.submitting.set(false); this.goBack(); },
        error: err => {
          this.submitting.set(false);
          this.submitError.set(extractErrorMessage(err, 'Erro ao atualizar.'));
          this.fieldErrors.set(extractFieldErrors(err) ?? {});
        },
      });
    }
  }
}
