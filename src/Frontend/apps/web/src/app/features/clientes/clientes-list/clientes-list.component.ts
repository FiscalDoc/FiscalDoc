import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService, ContadorService, AuthService, CepService, CnpjService, extractErrorMessage } from '@veloxml/services';
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
          <div class="table-scroll">
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
          </div>

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
                    <label class="label">Contador Responsável</label>
                    <select class="input" formControlName="contadorId">
                      <option value="">Nenhum (cliente direto do Administrador)</option>
                      @for (c of contadores(); track c.id) {
                        <option [value]="c.id">{{ c.nome }}</option>
                      }
                    </select>
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
                  <div class="combo-row">
                    <input class="input" formControlName="cnpj" placeholder="00000000000000" maxlength="14"/>
                    <button type="button" class="btn-inline" [disabled]="buscandoCnpj()" (click)="buscarCnpj()">
                      {{ buscandoCnpj() ? 'Buscando...' : 'Buscar dados' }}
                    </button>
                  </div>
                  @if (form.controls['cnpj'].touched && form.controls['cnpj'].errors) {
                    <span class="field-error">CNPJ inválido</span>
                  }
                  @if (erroCnpj()) { <span class="field-error">{{ erroCnpj() }}</span> }
                </div>
                <div class="field">
                  <label class="label">E-mail</label>
                  <input class="input" formControlName="email" type="email" placeholder="email@empresa.com" autocomplete="off"/>
                </div>
                <div class="field">
                  <label class="label">Telefone</label>
                  <input class="input" formControlName="telefone" placeholder="(11) 99999-9999"/>
                </div>
                <div class="field">
                  <label class="label">CEP</label>
                  <input class="input" formControlName="cep" (ngModelChange)="onCepChange($event)" placeholder="00000-000" maxlength="9"/>
                  @if (buscandoCep()) { <span class="field-hint">Buscando endereço...</span> }
                </div>
                <div class="field col-2">
                  <label class="label">Logradouro</label>
                  <input class="input" formControlName="logradouro" placeholder="Rua/Av."/>
                </div>
                <div class="field">
                  <label class="label">Número</label>
                  <input class="input" formControlName="numero"/>
                </div>
                <div class="field">
                  <label class="label">Complemento</label>
                  <input class="input" formControlName="complemento"/>
                </div>
                <div class="field">
                  <label class="label">Bairro</label>
                  <input class="input" formControlName="bairro"/>
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
    .field-hint { font-size: 11px; color: var(--text2); }
    .combo-row { display: flex; gap: 6px; }
    .combo-row .input { flex: 1; }
    .btn-inline { background: var(--bg3); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem .75rem; font-size: 12.5px; cursor: pointer; white-space: nowrap; }
    .btn-inline:hover { color: var(--accent); border-color: var(--accent); }
    .btn-inline:disabled { opacity: .5; cursor: not-allowed; }
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

    /* ── Tablet (iPad) e mobile ── */
    @media (max-width: 1024px) {
      .table { min-width: 680px; }
      .form-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .header-actions { flex-direction: column; align-items: stretch; }
      .search-input { width: 100%; box-sizing: border-box; }
      .form-grid { grid-template-columns: 1fr; }
      .col-2 { grid-column: span 1; }
      .modal-footer { flex-direction: column-reverse; align-items: stretch; }
    }
  `],
})
export class ClientesListComponent implements OnInit {
  private readonly _svc         = inject(ClienteService);
  private readonly _contadorSvc = inject(ContadorService);
  private readonly _cepSvc      = inject(CepService);
  private readonly _cnpjSvc     = inject(CnpjService);
  private readonly _fb          = inject(FormBuilder);
  private readonly _router      = inject(Router);
  readonly auth = inject(AuthService);
  readonly buscandoCep = signal(false);
  readonly buscandoCnpj = signal(false);
  readonly erroCnpj = signal<string | null>(null);

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
    cep: [''],
    logradouro: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    codigoIbgeCidade: [''],
    cidade: [''],
    estado: [''],
    ativo: [true],
  });

  onCepChange(valor: string): void {
    const digitos = (valor || '').replace(/\D/g, '');
    if (digitos.length !== 8) return;

    this.buscandoCep.set(true);
    this._cepSvc.buscar(digitos).subscribe(r => {
      this.buscandoCep.set(false);
      if (!r) return;
      this.form.patchValue({
        logradouro: r.logradouro || this.form.controls.logradouro.value,
        bairro: r.bairro || this.form.controls.bairro.value,
        complemento: r.complemento || this.form.controls.complemento.value,
        cidade: r.localidade || this.form.controls.cidade.value,
        estado: r.uf || this.form.controls.estado.value,
        codigoIbgeCidade: r.ibge || this.form.controls.codigoIbgeCidade.value,
      });
    });
  }

  buscarCnpj(): void {
    const digitos = (this.form.controls.cnpj.value || '').replace(/\D/g, '');
    if (digitos.length !== 14) {
      this.erroCnpj.set('Digite os 14 dígitos do CNPJ antes de buscar.');
      return;
    }

    this.buscandoCnpj.set(true);
    this.erroCnpj.set(null);
    this._cnpjSvc.buscar(digitos).subscribe(r => {
      this.buscandoCnpj.set(false);
      if (!r) { this.erroCnpj.set('CNPJ não encontrado.'); return; }
      this.form.patchValue({
        razaoSocial: r.razaoSocial || this.form.controls.razaoSocial.value,
        nomeFantasia: r.nomeFantasia || this.form.controls.nomeFantasia.value,
        telefone: r.telefone || this.form.controls.telefone.value,
        email: r.email || this.form.controls.email.value,
        cep: r.cep || this.form.controls.cep.value,
        logradouro: r.logradouro || this.form.controls.logradouro.value,
        numero: r.numero || this.form.controls.numero.value,
        complemento: r.complemento || this.form.controls.complemento.value,
        bairro: r.bairro || this.form.controls.bairro.value,
        cidade: r.municipio || this.form.controls.cidade.value,
        estado: r.uf || this.form.controls.estado.value,
      });
    });
  }

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
    // Contador é sempre opcional — quando o Administrador não escolhe nenhum, o cliente fica
    // cadastrado direto por ele, sem vínculo com nenhum escritório.
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
      cep: v.cep || undefined,
      logradouro: v.logradouro || undefined,
      numero: v.numero || undefined,
      complemento: v.complemento || undefined,
      bairro: v.bairro || undefined,
      codigoIbgeCidade: v.codigoIbgeCidade || undefined,
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
