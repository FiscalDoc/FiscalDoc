import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService, ContadorService, ClienteService, extractErrorMessage, extractFieldErrors } from '@veloxml/services';
import { UsuarioDto, ContadorDto, ClienteDto } from '@veloxml/models';

type Tab = 'geral' | 'acesso';

@Component({
  selector: 'app-usuario-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
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
          <div class="header-top">
            <h2 class="page-title">{{ isNew() ? 'Novo Usuário' : (form.get('nome')?.value || 'Usuário') }}</h2>
            @if (!isNew() && usuario()?.perfil !== 'Administrador') {
              <button class="btn-danger-outline" [disabled]="excluindo()" (click)="excluir()">
                {{ excluindo() ? 'Excluindo...' : 'Excluir' }}
              </button>
            }
          </div>
        </div>

        <nav class="tabs">
          <button class="tab-btn" [class.active]="tab() === 'geral'" (click)="tab.set('geral')">Dados Gerais</button>
          @if (!isNew()) {
            <button class="tab-btn" [class.active]="tab() === 'acesso'" (click)="tab.set('acesso')">Acesso</button>
          }
        </nav>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (tab() === 'geral') {
            <div class="card section">
              <h4 class="section-title">Dados Gerais</h4>
              <div class="form-grid">
                <div class="field">
                  <label class="label">Nome *</label>
                  <input class="input" type="text" formControlName="nome" placeholder="Nome completo"
                    [class.error]="(f['nome'].touched && f['nome'].errors?.['required']) || fieldErrors()['nome']" />
                  @if (f['nome'].touched && f['nome'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
                  @if (fieldErrors()['nome']) { <span class="field-error">{{ fieldErrors()['nome'] }}</span> }
                </div>
                @if (isNew()) {
                  <div class="field">
                    <label class="label">E-mail *</label>
                    <input class="input" type="email" formControlName="email" placeholder="email@exemplo.com" autocomplete="off"
                      [class.error]="(f['email'].touched && f['email'].invalid) || fieldErrors()['email']" />
                    @if (f['email'].touched && f['email'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
                    @if (f['email'].touched && f['email'].errors?.['email']) { <span class="field-error">E-mail inválido</span> }
                    @if (fieldErrors()['email']) { <span class="field-error">{{ fieldErrors()['email'] }}</span> }
                  </div>
                }
              </div>

              @if (isNew()) {
                <div class="form-grid">
                  <div class="field">
                    <label class="label">Senha *</label>
                    <input class="input" type="password" formControlName="senha" placeholder="Mínimo 8 caracteres" autocomplete="new-password"
                      [class.error]="(f['senha'].touched && f['senha'].invalid) || fieldErrors()['senha']" />
                    @if (f['senha'].touched && f['senha'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
                    @if (f['senha'].touched && f['senha'].errors?.['minlength']) { <span class="field-error">Mínimo 8 caracteres</span> }
                    @if (fieldErrors()['senha']) { <span class="field-error">{{ fieldErrors()['senha'] }}</span> }
                  </div>
                  <div class="field">
                    <label class="label">Perfil *</label>
                    <select class="input" formControlName="perfil" (change)="onPerfilFormChange()"
                      [class.error]="(f['perfil'].touched && f['perfil'].errors?.['required']) || fieldErrors()['perfil']">
                      <option value="">Selecione</option>
                      <option value="Administrador">Administrador</option>
                      <option value="UsuarioContador">Usuário Contador</option>
                      <option value="Cliente">Cliente</option>
                    </select>
                    @if (f['perfil'].touched && f['perfil'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
                    @if (fieldErrors()['perfil']) { <span class="field-error">{{ fieldErrors()['perfil'] }}</span> }
                    <span class="hint">Para criar um Contador, use a tela de Contadores.</span>
                  </div>
                </div>

                @if (perfilSelecionado() === 'UsuarioContador') {
                  <div class="field">
                    <label class="label">Contador *</label>
                    <select class="input" formControlName="contadorId"
                      [class.error]="(f['contadorId'].touched && f['contadorId'].errors?.['required']) || fieldErrors()['contadorid']">
                      <option value="">Selecione o contador</option>
                      @for (c of contadores(); track c.id) {
                        <option [value]="c.id">{{ c.nome }}</option>
                      }
                    </select>
                    @if (f['contadorId'].touched && f['contadorId'].errors?.['required']) {
                      <span class="field-error">Contador obrigatório para Usuário Contador</span>
                    }
                    @if (fieldErrors()['contadorid']) { <span class="field-error">{{ fieldErrors()['contadorid'] }}</span> }
                  </div>
                }

                @if (perfilSelecionado() === 'Cliente') {
                  <div class="field">
                    <label class="label">Cliente *</label>
                    <select class="input" formControlName="clienteId"
                      [class.error]="(f['clienteId'].touched && f['clienteId'].errors?.['required']) || fieldErrors()['clienteid']">
                      <option value="">Selecione o cliente</option>
                      @for (c of clientes(); track c.id) {
                        <option [value]="c.id">{{ c.razaoSocial }}</option>
                      }
                    </select>
                    @if (f['clienteId'].touched && f['clienteId'].errors?.['required']) {
                      <span class="field-error">Cliente obrigatório para perfil Cliente</span>
                    }
                    @if (fieldErrors()['clienteid']) { <span class="field-error">{{ fieldErrors()['clienteid'] }}</span> }
                  </div>
                }
              } @else {
                <div class="form-grid">
                  <div class="field">
                    <label class="label">Nova Senha</label>
                    <input class="input" type="password" formControlName="novaSenha" placeholder="Deixe em branco para não alterar" autocomplete="new-password" />
                  </div>
                  <div class="field" style="justify-content:flex-end;padding-bottom:2px;">
                    <label class="label">Status</label>
                    <label class="toggle-row">
                      <input type="checkbox" formControlName="ativo" style="width:16px;height:16px;accent-color:var(--accent);" />
                      Usuário ativo
                    </label>
                  </div>
                </div>
              }
            </div>
          }

          @if (tab() === 'acesso' && !isNew()) {
            <div class="card section">
              <h4 class="section-title">Acesso</h4>
              <div class="info-grid">
                <div>
                  <span class="info-label">Último acesso</span>
                  {{ usuario()?.ultimoAcessoEm ? (usuario()!.ultimoAcessoEm | date:'dd/MM/yyyy HH:mm') : 'Nunca acessou' }}
                </div>
                <div>
                  <span class="info-label">Autenticação em Dois Fatores</span>
                  <span class="badge" [class.badge-green]="usuario()?.twoFactorHabilitado" [class.badge-gray]="!usuario()?.twoFactorHabilitado">
                    {{ usuario()?.twoFactorHabilitado ? 'Ativo' : 'Não configurado' }}
                  </span>
                </div>
                <div>
                  <span class="info-label">Cadastrado em</span>
                  {{ usuario()?.createdAt | date:'dd/MM/yyyy' }}
                </div>
              </div>
            </div>
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
    .header-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .btn-danger-outline { background: none; border: 1px solid rgba(255,77,109,.4); color: var(--red); border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: pointer; }
    .btn-danger-outline:hover:not(:disabled) { background: rgba(255,77,109,.1); }
    .btn-danger-outline:disabled { opacity: .5; cursor: not-allowed; }

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 1.25rem; }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; margin-bottom: .875rem; }
    .form-grid:last-child { margin-bottom: 0; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; }
    .input:focus { border-color: var(--accent); }
    .input.error { border-color: var(--red); }
    select.input { cursor: pointer; }
    .field-error { font-size: 11px; color: var(--red); }
    .hint { font-size: 11px; color: var(--text2); }
    .toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); margin-top: 6px; }

    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 13.5px; color: var(--text); }
    .info-label { display: block; font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-gray  { background: var(--bg3); color: var(--text2); }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; margin-bottom: 1.25rem; }
    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
  `],
})
export class UsuarioDetailComponent implements OnInit {
  private readonly _svc    = inject(UsuarioService);
  private readonly _cntSvc = inject(ContadorService);
  private readonly _cliSvc = inject(ClienteService);
  private readonly _fb     = inject(FormBuilder);
  private readonly _route  = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  private usuarioId = '';

  readonly isNew    = signal(true);
  readonly loading  = signal(true);
  readonly submitting = signal(false);
  readonly excluindo = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly tab      = signal<Tab>('geral');
  readonly usuario  = signal<UsuarioDto | null>(null);
  readonly contadores = signal<ContadorDto[]>([]);
  readonly clientes   = signal<ClienteDto[]>([]);
  readonly perfilSelecionado = signal('');

  form = this._fb.group({
    nome:       ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    senha:      ['', [Validators.required, Validators.minLength(8)]],
    perfil:     ['', Validators.required],
    contadorId: [''],
    clienteId:  [''],
    novaSenha:  [''],
    ativo:      [true],
  });
  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.usuarioId = this._route.snapshot.paramMap.get('usuarioId') ?? '';
    this.isNew.set(!this.usuarioId || this.usuarioId === 'novo');

    this._cntSvc.getAll({ pageSize: 500 }).subscribe({ next: r => this.contadores.set(r.items) });
    this._cliSvc.getAll({ pageSize: 500 }).subscribe({ next: r => this.clientes.set(r.items) });

    if (this.isNew()) {
      this.loading.set(false);
      return;
    }

    ['email', 'senha', 'perfil', 'contadorId', 'clienteId'].forEach(c => this.form.get(c)?.disable());
    this.form.get('senha')?.clearValidators();
    this.form.get('senha')?.updateValueAndValidity();

    this._svc.getById(this.usuarioId).subscribe({
      next: u => {
        this.usuario.set(u);
        this.form.patchValue({ nome: u.nome, ativo: u.ativo, novaSenha: '' });
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.submitError.set('Usuário não encontrado.'); },
    });
  }

  onPerfilFormChange(): void {
    const p = this.form.get('perfil')?.value ?? '';
    this.perfilSelecionado.set(p);

    this.form.get('contadorId')?.clearValidators();
    this.form.get('clienteId')?.clearValidators();
    if (p === 'UsuarioContador') {
      this.form.get('contadorId')?.setValidators(Validators.required);
    } else if (p === 'Cliente') {
      this.form.get('clienteId')?.setValidators(Validators.required);
    }
    this.form.get('contadorId')?.updateValueAndValidity();
    this.form.get('clienteId')?.updateValueAndValidity();
  }

  goBack(): void { this._router.navigate(['/usuarios']); }

  excluir(): void {
    const nome = this.usuario()?.nome ?? 'este usuário';
    if (!confirm(`Excluir ${nome}? Esta ação não pode ser desfeita.`)) return;
    this.excluindo.set(true);
    this.submitError.set(null);
    this._svc.delete(this.usuarioId).subscribe({
      next: () => { this.excluindo.set(false); this.goBack(); },
      error: err => {
        this.excluindo.set(false);
        this.submitError.set(extractErrorMessage(err, 'Erro ao excluir usuário.'));
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
      this._svc.create({
        nome: v.nome!, email: v.email!, senha: v.senha!, perfil: v.perfil!,
        contadorId: v.contadorId || undefined, clienteId: v.clienteId || undefined,
      }).subscribe({
        next: () => { this.submitting.set(false); this.goBack(); },
        error: err => {
          this.submitting.set(false);
          this.submitError.set(extractErrorMessage(err, 'Erro ao criar usuário.'));
          this.fieldErrors.set(extractFieldErrors(err) ?? {});
        },
      });
    } else {
      this._svc.update(this.usuarioId, { nome: v.nome!, ativo: v.ativo ?? true, novaSenha: v.novaSenha || undefined }).subscribe({
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
