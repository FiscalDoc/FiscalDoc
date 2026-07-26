import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService, ContadorService, AuthService, extractErrorMessage } from '@veloxml/services';
import { ClienteDto, CreateClienteRequest, ContadorDto } from '@veloxml/models';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <h2 class="font-heading">Clientes</h2>
        <div class="header-actions">
          @if (isAdmin) {
            <select class="input filter-select" [(ngModel)]="filtroContadorId" (ngModelChange)="onFiltroContadorChange()">
              <option [ngValue]="undefined">Todos os contadores</option>
              @for (c of contadores(); track c.id) {
                <option [ngValue]="c.id">{{ c.nome }}</option>
              }
            </select>
          }
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input class="search-input" [(ngModel)]="searchTerm" placeholder="Buscar..." (ngModelChange)="onSearch()" />
          </div>
          <button class="btn-primary" (click)="openCreate()">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Novo Cliente
          </button>
        </div>
      </header>

      @if (loading()) {
        <div class="empty-state">Carregando...</div>
      } @else {
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Razão Social</th>
                <th>CNPJ</th>
                <th>Cidade/UF</th>
                <th>Contador</th>
                <th>Docs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clientes(); track c.id) {
                <tr class="row-link" (click)="goTo(c.id)">
                  <td>
                    <div class="cell-main">{{ c.razaoSocial }}</div>
                    @if (c.nomeFantasia) { <div class="cell-sub">{{ c.nomeFantasia }}</div> }
                  </td>
                  <td class="mono">{{ formatCnpj(c.cnpj) }}</td>
                  <td>{{ c.cidade ? c.cidade + (c.estado ? '/' + c.estado : '') : '—' }}</td>
                  <td>{{ c.nomeContador ?? '—' }}</td>
                  <td>{{ c.totalDocumentos }}</td>
                  <td><span class="badge" [class.badge-green]="c.ativo" [class.badge-red]="!c.ativo">{{ c.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                </tr>
              }
              @if (!clientes().length) {
                <tr><td colspan="6" class="empty-state" style="padding:2.5rem">Nenhum cliente encontrado.</td></tr>
              }
            </tbody>
          </table>

          @if (totalPages() > 1) {
            <div class="pagination">
              <button class="page-btn" [disabled]="page() <= 1" (click)="prevPage()">‹ Anterior</button>
              <span class="page-info">Pág. {{ page() }} / {{ totalPages() }}</span>
              <button class="page-btn" [disabled]="page() >= totalPages()" (click)="nextPage()">Próxima ›</button>
            </div>
          }
        </div>
      }

      <!-- ── Modal ── -->
      @if (showModal()) {
        <div class="overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h3 class="modal-title font-heading">Novo Cliente</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </header>

            <form [formGroup]="form" (ngSubmit)="onSave()" class="modal-body">
              <div class="form-grid">
                @if (isAdmin) {
                  <div class="field col-2">
                    <label class="label">Contador Responsável *</label>
                    <select class="input" formControlName="contadorId">
                      <option value="" disabled>Selecione o contador...</option>
                      @for (c of contadores(); track c.id) {
                        <option [value]="c.id">{{ c.nome }}</option>
                      }
                    </select>
                    @if (form.controls['contadorId'].touched && form.controls['contadorId'].errors?.['required']) {
                      <span class="field-error">Selecione o contador responsável.</span>
                    }
                  </div>
                }
                <div class="field col-2">
                  <label class="label">Razão Social *</label>
                  <input class="input" formControlName="razaoSocial" placeholder="Nome completo da empresa"/>
                  @if (form.controls['razaoSocial'].touched && form.controls['razaoSocial'].errors?.['required']) {
                    <span class="field-error">Obrigatório</span>
                  }
                </div>
                <div class="field col-2">
                  <label class="label">Nome Fantasia</label>
                  <input class="input" formControlName="nomeFantasia" placeholder="Opcional"/>
                </div>
                <div class="field col-2">
                  <label class="label">CNPJ * (somente dígitos)</label>
                  <input class="input" formControlName="cnpj" placeholder="00000000000000" maxlength="14"/>
                  @if (form.controls['cnpj'].touched && form.controls['cnpj'].errors) {
                    <span class="field-error">CNPJ inválido</span>
                  }
                </div>
                <div class="field">
                  <label class="label">E-mail</label>
                  <input class="input" formControlName="email" type="email" placeholder="email@empresa.com"/>
                </div>
                <div class="field">
                  <label class="label">Telefone</label>
                  <input class="input" formControlName="telefone" placeholder="(11) 99999-9999"/>
                </div>
                <div class="field">
                  <label class="label">Cidade</label>
                  <input class="input" formControlName="cidade" placeholder="São Paulo"/>
                </div>
                <div class="field">
                  <label class="label">UF</label>
                  <input class="input" formControlName="estado" placeholder="SP" maxlength="2"/>
                </div>
              </div>

              @if (saveError()) {
                <div class="alert-error">{{ saveError() }}</div>
              }

              <div class="modal-footer">
                <button type="button" class="btn-ghost" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: .75rem; }

    .search-wrap { position: relative; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text2); pointer-events: none; }
    .search-input {
      background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
      padding: .45rem .75rem .45rem 2rem; color: var(--text); font-size: 13px; outline: none; width: 220px;
    }
    .search-input:focus { border-color: var(--accent); }

    .filter-select {
      background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: .45rem .75rem; font-size: 13px; outline: none; cursor: pointer;
    }
    .filter-select:focus { border-color: var(--accent); }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost {
      background: transparent; color: var(--text2); border: 1px solid var(--border);
      border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer;
    }
    .btn-ghost:hover { background: var(--bg3); color: var(--text); }

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

    .cell-main { font-weight: 500; }
    .cell-sub { font-size: 11px; color: var(--text2); margin-top: 2px; }
    .mono { font-family: monospace; font-size: 12px; }
    .empty-state { text-align: center; color: var(--text2); font-size: 14px; padding: 3rem; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-red { background: rgba(255,77,109,.12); color: var(--red); }

    .row-link { cursor: pointer; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: .875rem 1rem; border-top: 1px solid var(--border); }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 12px; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { font-size: 13px; color: var(--text2); }

    /* Modal */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 580px; max-height: 92vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; padding-top: .75rem; border-top: 1px solid var(--border); }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
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

  `],
})
export class ClientesListComponent implements OnInit {
  private readonly _svc         = inject(ClienteService);
  private readonly _contadorSvc = inject(ContadorService);
  private readonly _fb          = inject(FormBuilder);
  private readonly _router      = inject(Router);
  readonly auth = inject(AuthService);

  readonly clientes     = signal<ClienteDto[]>([]);
  readonly loading      = signal(true);
  readonly page         = signal(1);
  readonly pageSize     = 20;
  readonly total        = signal(0);
  readonly totalPages   = signal(1);
  searchTerm = '';

  readonly contadores       = signal<ContadorDto[]>([]);
  filtroContadorId: string | undefined = undefined;

  readonly showModal  = signal(false);
  readonly saving     = signal(false);
  readonly saveError  = signal<string | null>(null);

  get isAdmin(): boolean { return this.auth.currentUser()?.perfil === 'Administrador'; }

  form = this._fb.nonNullable.group({
    contadorId: [''],
    razaoSocial: ['', Validators.required],
    nomeFantasia: [''],
    cnpj: [''],
    email: ['', Validators.email],
    telefone: [''],
    endereco: [''],
    cidade: [''],
    estado: [''],
    ativo: [true],
  });

  ngOnInit(): void {
    this.load();
    if (this.isAdmin) {
      this._contadorSvc.getAll({ page: 1, pageSize: 200 }).subscribe({
        next: r => this.contadores.set(r.items),
        error: () => {},
      });
    }
  }

  load(): void {
    this.loading.set(true);
    this._svc.getAll({ page: this.page(), pageSize: this.pageSize, termo: this.searchTerm || undefined, contadorId: this.filtroContadorId }).subscribe({
      next: r => {
        this.clientes.set(r.items);
        this.total.set(r.totalCount);
        this.totalPages.set(Math.max(1, Math.ceil(r.totalCount / this.pageSize)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onFiltroContadorChange(): void { this.page.set(1); this.load(); }
  prevPage(): void { this.page.update(p => p - 1); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  goTo(id: string): void { this._router.navigate(['/clientes', id]); }

  openCreate(): void {
    this.saveError.set(null);
    this.form.reset();
    this.form.controls.cnpj.setValidators([Validators.required, Validators.minLength(14)]);
    this.form.controls.cnpj.updateValueAndValidity();
    if (this.isAdmin) {
      this.form.controls.contadorId.setValidators([Validators.required]);
    } else {
      this.form.controls.contadorId.clearValidators();
    }
    this.form.controls.contadorId.updateValueAndValidity();
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSave(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const v = this.form.getRawValue();

    this._svc.create({
      contadorId: v.contadorId || undefined,
      razaoSocial: v.razaoSocial,
      nomeFantasia: v.nomeFantasia || undefined,
      cnpj: v.cnpj,
      email: v.email || undefined,
      telefone: v.telefone || undefined,
      cidade: v.cidade || undefined,
      estado: v.estado || undefined,
    } as CreateClienteRequest).subscribe({
      next: (c) => { this.saving.set(false); this.closeModal(); this._router.navigate(['/clientes', c.id]); },
      error: (err) => { this.saving.set(false); this.saveError.set(extractErrorMessage(err, 'Erro ao salvar. Verifique os dados.')); },
    });
  }

  formatCnpj(cnpj: string): string {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}
