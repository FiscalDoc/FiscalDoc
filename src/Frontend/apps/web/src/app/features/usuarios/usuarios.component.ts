import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { UsuarioService, ContadorService } from '@veloxml/services';
import { UsuarioDto, ContadorDto } from '@veloxml/models';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe],
  template: `
<div class="page">

  <!-- ── Header ── -->
  <header class="page-header">
    <div>
      <h2 class="font-heading">Usuários</h2>
      <p class="page-sub">{{ total() }} usuário(s) cadastrado(s)</p>
    </div>
    <button class="btn-primary" (click)="openCreate()">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      Novo Usuário
    </button>
  </header>

  <!-- ── Toolbar ── -->
  <div class="toolbar">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
      </svg>
      <input class="search-input" type="text" placeholder="Buscar por nome ou e-mail..."
        [value]="termo()" (input)="onSearch($event)" />
    </div>
    <select class="search-input" style="max-width:200px;cursor:pointer;"
      [value]="filtroPerfil()" (change)="onPerfilChange($event)">
      <option value="">Todos os perfis</option>
      <option value="Administrador">Administrador</option>
      <option value="Contador">Contador</option>
      <option value="UsuarioContador">Usuário Contador</option>
      <option value="Cliente">Cliente</option>
    </select>
  </div>

  <!-- ── Tabela ── -->
  <div class="card">
    @if (loading()) {
      <div class="empty-state">Carregando...</div>
    } @else if (usuarios().length === 0) {
      <div class="empty-state">Nenhum usuário encontrado.</div>
    } @else {
      <table class="table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Perfil</th>
            <th>Contador</th>
            <th>Status</th>
            <th>2FA</th>
            <th>Cadastro</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (u of usuarios(); track u.id) {
            <tr>
              <td>
                <div class="cell-name">
                  <div class="avatar">{{ initial(u.nome) }}</div>
                  <div>
                    <div class="cell-title">{{ u.nome }}</div>
                    <div class="cell-sub">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="perfilClass(u.perfil)">{{ u.perfil }}</span>
              </td>
              <td>
                <span class="cell-muted">{{ u.nomeContador ?? '—' }}</span>
              </td>
              <td>
                <span class="badge" [class.badge-green]="u.ativo" [class.badge-red]="!u.ativo">
                  {{ u.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                @if (u.twoFactorHabilitado) {
                  <span class="badge badge-green">Ativo</span>
                } @else {
                  <span class="cell-muted">—</span>
                }
              </td>
              <td class="cell-muted">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
              <td>
                <button class="icon-btn" title="Editar" (click)="openEdit(u)">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" [disabled]="page() === 1" (click)="changePage(page()-1)">‹ Anterior</button>
          <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="page() === totalPages()" (click)="changePage(page()+1)">Próximo ›</button>
        </div>
      }
    }
  </div>
</div>

<!-- ── Modal ── -->
@if (showModal()) {
  <div class="overlay" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()">

      <header class="modal-header">
        <h3 class="modal-title font-heading">{{ mode() === 'create' ? 'Novo Usuário' : 'Editar Usuário' }}</h3>
        <button class="modal-close" (click)="closeModal()">✕</button>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">

        <div class="form-row">
          <div class="field">
            <label class="label">Nome *</label>
            <input class="input" type="text" formControlName="nome" placeholder="Nome completo" />
            @if (f['nome'].touched && f['nome'].errors?.['required']) {
              <span class="field-error">Obrigatório</span>
            }
          </div>
          @if (mode() === 'create') {
            <div class="field">
              <label class="label">E-mail *</label>
              <input class="input" type="email" formControlName="email" placeholder="email@exemplo.com" />
              @if (f['email'].touched && f['email'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
              @if (f['email'].touched && f['email'].errors?.['email']) { <span class="field-error">E-mail inválido</span> }
            </div>
          }
        </div>

        @if (mode() === 'create') {
          <div class="form-row">
            <div class="field">
              <label class="label">Senha *</label>
              <input class="input" type="password" formControlName="senha" placeholder="Mínimo 6 caracteres" />
              @if (f['senha'].touched && f['senha'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
              @if (f['senha'].touched && f['senha'].errors?.['minlength']) { <span class="field-error">Mínimo 6 caracteres</span> }
            </div>
            <div class="field">
              <label class="label">Perfil *</label>
              <select class="input" formControlName="perfil" (change)="onPerfilFormChange()">
                <option value="">Selecione</option>
                <option value="Administrador">Administrador</option>
                <option value="Contador">Contador</option>
                <option value="UsuarioContador">Usuário Contador</option>
                <option value="Cliente">Cliente</option>
              </select>
              @if (f['perfil'].touched && f['perfil'].errors?.['required']) { <span class="field-error">Obrigatório</span> }
            </div>
          </div>

          @if (perfilSelecionado() === 'Cliente') {
            <div class="field">
              <label class="label">Contador *</label>
              <select class="input" formControlName="contadorId">
                <option value="">Selecione o contador</option>
                @for (c of contadores(); track c.id) {
                  <option [value]="c.id">{{ c.nome }}</option>
                }
              </select>
              @if (f['contadorId'].touched && f['contadorId'].errors?.['required']) {
                <span class="field-error">Contador obrigatório para perfil Cliente</span>
              }
            </div>
          }
        }

        @if (mode() === 'edit') {
          <div class="form-row">
            <div class="field">
              <label class="label">Nova Senha</label>
              <input class="input" type="password" formControlName="novaSenha" placeholder="Deixe em branco para não alterar" />
            </div>
            <div class="field" style="justify-content:flex-end;padding-bottom:2px;">
              <label class="label">Status</label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text);margin-top:6px;">
                <input type="checkbox" formControlName="ativo" style="width:16px;height:16px;accent-color:var(--accent);" />
                Usuário ativo
              </label>
            </div>
          </div>
        }

        @if (submitError()) {
          <div class="alert-error">{{ submitError() }}</div>
        }

        <div class="modal-footer">
          <button type="button" class="btn-ghost" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="submitting()">
            {{ submitting() ? 'Salvando...' : (mode() === 'create' ? 'Criar Usuário' : 'Salvar') }}
          </button>
        </div>

      </form>
    </div>
  </div>
}
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
    .btn-ghost {
      background: transparent; color: var(--text2); border: 1px solid var(--border);
      border-radius: 8px; padding: 0.5rem 1rem; font-size: 13.5px; cursor: pointer;
    }
    .btn-ghost:hover { background: var(--bg3); color: var(--text); }

    .toolbar { display: flex; gap: .75rem; }
    .search-wrap { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text2); pointer-events: none; }
    .search-input {
      width: 100%; box-sizing: border-box; background: var(--bg2); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); padding: .45rem .75rem .45rem 2rem; font-size: 13px; outline: none;
    }
    .search-input:focus { border-color: var(--accent); }
    select.search-input { padding-left: .75rem; }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th {
      padding: .625rem 1rem; text-align: left; font-size: 10.5px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .05em; color: var(--text2);
      border-bottom: 1px solid var(--border); background: var(--bg3);
    }
    .table td { padding: .75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover td { background: rgba(255,255,255,.02); }

    .cell-name { display: flex; align-items: center; gap: .625rem; }
    .cell-title { font-weight: 500; }
    .cell-sub { font-size: 11.5px; color: var(--text2); margin-top: 1px; }
    .cell-muted { color: var(--text2); font-size: 13px; }

    .avatar {
      width: 32px; height: 32px; border-radius: 50%; background: var(--accent-dim); color: var(--accent);
      font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green  { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-red    { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-blue   { background: rgba(0,102,255,.12);  color: #4d94ff; }
    .badge-yellow { background: rgba(255,209,102,.15); color: var(--yellow); }
    .badge-gray   { background: var(--bg3); color: var(--text2); }

    .icon-btn {
      background: none; border: 1px solid var(--border); color: var(--text2);
      border-radius: 6px; padding: 5px; cursor: pointer; display: flex; align-items: center;
      transition: color 120ms, background 120ms, border-color 120ms;
    }
    .icon-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-dim); }

    .empty-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: .875rem 1rem; border-top: 1px solid var(--border); }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 12px; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { font-size: 13px; color: var(--text2); }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; padding-top: .5rem; border-top: 1px solid var(--border); margin-top: .5rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit;
    }
    .input:focus { border-color: var(--accent); }
    select.input { cursor: pointer; }
    .field-error { font-size: 11px; color: var(--red); }
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
  `]
})
export class UsuariosComponent implements OnInit {
  private readonly _svc    = inject(UsuarioService);
  private readonly _cntSvc = inject(ContadorService);
  private readonly _fb     = inject(FormBuilder);

  usuarios      = signal<UsuarioDto[]>([]);
  contadores    = signal<ContadorDto[]>([]);
  loading       = signal(true);
  submitting    = signal(false);
  showModal     = signal(false);
  mode          = signal<ModalMode>('create');
  submitError   = signal<string | null>(null);
  termo         = signal('');
  filtroPerfil  = signal('');
  total         = signal(0);
  page          = signal(1);
  totalPages    = signal(1);
  editId        = signal<string | null>(null);
  perfilSelecionado = signal('');

  form = this._fb.group({
    nome:       ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    senha:      ['', [Validators.required, Validators.minLength(6)]],
    perfil:     ['', Validators.required],
    contadorId: [''],
    novaSenha:  [''],
    ativo:      [true],
  });
  get f() { return this.form.controls; }

  private _timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
    this._cntSvc.getAll({ pageSize: 500 }).subscribe({ next: r => this.contadores.set(r.items) });
  }

  load(): void {
    this.loading.set(true);
    this._svc.getAll({ termo: this.termo() || undefined, perfil: this.filtroPerfil() || undefined, page: this.page(), pageSize: 50 })
      .subscribe({
        next: r => { this.usuarios.set(r.items); this.total.set(r.totalCount); this.totalPages.set(r.totalPages); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  onSearch(e: Event): void {
    this.termo.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.load(), 350);
  }

  onPerfilChange(e: Event): void {
    this.filtroPerfil.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  changePage(p: number): void { this.page.set(p); this.load(); }

  openCreate(): void {
    this.mode.set('create');
    this.editId.set(null);
    this.submitError.set(null);
    this.perfilSelecionado.set('');
    this.form.reset({ ativo: true });
    this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('perfil')?.setValidators(Validators.required);
    this.form.get('email')?.setValidators([Validators.required, Validators.email]);
    ['senha', 'perfil', 'email', 'contadorId'].forEach(c => { this.form.get(c)?.enable(); this.form.get(c)?.updateValueAndValidity(); });
    this.showModal.set(true);
  }

  openEdit(u: UsuarioDto): void {
    this.mode.set('edit');
    this.editId.set(u.id);
    this.submitError.set(null);
    this.form.patchValue({ nome: u.nome, ativo: u.ativo, novaSenha: '' });
    ['email', 'senha', 'perfil', 'contadorId'].forEach(c => { this.form.get(c)?.disable(); });
    this.form.get('senha')?.clearValidators(); this.form.get('senha')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  onPerfilFormChange(): void {
    const p = this.form.get('perfil')?.value ?? '';
    this.perfilSelecionado.set(p);
    if (p === 'Cliente') {
      this.form.get('contadorId')?.setValidators(Validators.required);
    } else {
      this.form.get('contadorId')?.clearValidators();
    }
    this.form.get('contadorId')?.updateValueAndValidity();
  }

  closeModal(): void { this.showModal.set(false); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.submitError.set(null);
    const v = this.form.getRawValue();

    if (this.mode() === 'create') {
      this._svc.create({ nome: v.nome!, email: v.email!, senha: v.senha!, perfil: v.perfil!, contadorId: v.contadorId || undefined }).subscribe({
        next: () => { this.submitting.set(false); this.closeModal(); this.load(); },
        error: err => { this.submitting.set(false); this.submitError.set(err?.error?.detail ?? 'Erro ao criar usuário.'); },
      });
    } else {
      this._svc.update(this.editId()!, { nome: v.nome!, ativo: v.ativo ?? true, novaSenha: v.novaSenha || undefined }).subscribe({
        next: () => { this.submitting.set(false); this.closeModal(); this.load(); },
        error: err => { this.submitting.set(false); this.submitError.set(err?.error?.detail ?? 'Erro ao atualizar.'); },
      });
    }
  }

  initial(nome: string): string { return nome?.charAt(0)?.toUpperCase() ?? '?'; }

  perfilClass(p: string): string {
    const map: Record<string, string> = {
      Administrador: 'badge-red',
      Contador: 'badge-green',
      UsuarioContador: 'badge-blue',
      Cliente: 'badge-yellow',
    };
    return map[p] ?? 'badge-gray';
  }
}
