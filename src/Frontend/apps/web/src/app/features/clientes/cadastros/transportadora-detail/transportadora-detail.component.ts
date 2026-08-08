import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransportadoraService, CepService, CnpjService, extractErrorMessage, extractFieldErrors } from '@veloxml/services';
import { TransportadoraDto } from '@veloxml/models';

type Tab = 'cadastro' | 'endereco';

@Component({
  selector: 'app-transportadora-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            Cadastros
          </button>
          <div class="header-top">
            <h2 class="page-title">{{ isNew() ? 'Nova Transportadora' : form.razaoSocial || 'Transportadora' }}</h2>
            @if (!isNew()) {
              <button class="btn-danger-outline" (click)="excluir()">Excluir</button>
            }
          </div>
        </div>

        <nav class="tabs">
          <button class="tab-btn" [class.active]="tab() === 'cadastro'" (click)="tab.set('cadastro')">Cadastro</button>
          <button class="tab-btn" [class.active]="tab() === 'endereco'" (click)="tab.set('endereco')">Endereço</button>
        </nav>

        @if (tab() === 'cadastro') {
          <div class="card section">
            <h4 class="section-title">Dados da Transportadora</h4>
            <div class="form-grid">
              <div class="field col-2">
                <label class="label">CNPJ / CPF</label>
                <div class="combo-row">
                  <input class="input" [(ngModel)]="form.cpfCnpj" placeholder="00.000.000/0001-00"/>
                  @if (ehCnpj()) {
                    <button type="button" class="btn-inline" [disabled]="buscandoCnpj()" (click)="buscarCnpj()">
                      {{ buscandoCnpj() ? 'Buscando...' : 'Buscar dados' }}
                    </button>
                  }
                </div>
                <span class="field-hint">Digite o CNPJ primeiro pra preencher o resto automaticamente.</span>
                @if (erroCnpj()) { <span class="field-error">{{ erroCnpj() }}</span> }
              </div>
              <div class="field col-2">
                <label class="label">Razão Social *</label>
                <input class="input" [class.error]="fieldErrors()['razaosocial']" [(ngModel)]="form.razaoSocial" placeholder="Transportadora Ltda"/>
                @if (fieldErrors()['razaosocial']) { <span class="field-error">{{ fieldErrors()['razaosocial'] }}</span> }
              </div>
              <div class="field col-2">
                <label class="label">Nome Fantasia</label>
                <input class="input" [(ngModel)]="form.nomeFantasia" placeholder="Opcional"/>
              </div>
              <div class="field">
                <label class="label">Inscrição Estadual</label>
                <input class="input" [(ngModel)]="form.inscricaoEstadual" placeholder="Opcional"/>
              </div>
              <div class="field">
                <label class="label">E-mail</label>
                <input class="input" type="email" [class.error]="fieldErrors()['email']" [(ngModel)]="form.email" autocomplete="off"/>
                @if (fieldErrors()['email']) { <span class="field-error">{{ fieldErrors()['email'] }}</span> }
              </div>
              <div class="field">
                <label class="label">Telefone</label>
                <input class="input" [(ngModel)]="form.telefone" placeholder="(11) 99999-9999"/>
              </div>
              @if (!isNew()) {
                <div class="field" style="justify-content:flex-end;padding-bottom:2px;">
                  <label class="label">Status</label>
                  <label class="toggle-row">
                    <input type="checkbox" [(ngModel)]="form.ativo" style="width:16px;height:16px;accent-color:var(--accent);"/>
                    Transportadora ativa
                  </label>
                </div>
              }
            </div>
          </div>
        }

        @if (tab() === 'endereco') {
          <div class="card section">
            <h4 class="section-title">Endereço</h4>
            <div class="form-grid">
              <div class="field">
                <label class="label">CEP</label>
                <input class="input" [(ngModel)]="form.cep" (ngModelChange)="onCepChange($event)" placeholder="00000-000" maxlength="9"/>
                @if (buscandoCep()) { <span class="field-hint">Buscando endereço...</span> }
              </div>
              <div class="field col-2">
                <label class="label">Logradouro</label>
                <input class="input" [(ngModel)]="form.logradouro"/>
              </div>
              <div class="field">
                <label class="label">Número</label>
                <input class="input" [(ngModel)]="form.numero"/>
              </div>
              <div class="field">
                <label class="label">Complemento</label>
                <input class="input" [(ngModel)]="form.complemento"/>
              </div>
              <div class="field">
                <label class="label">Bairro</label>
                <input class="input" [(ngModel)]="form.bairro"/>
              </div>
              <div class="field">
                <label class="label">Cidade</label>
                <input class="input" [(ngModel)]="form.cidade"/>
              </div>
              <div class="field">
                <label class="label">UF</label>
                <input class="input" [(ngModel)]="form.estado" maxlength="2" placeholder="SP"/>
              </div>
              <div class="field">
                <label class="label">Código IBGE</label>
                <input class="input" [(ngModel)]="form.codigoIbgeCidade" placeholder="3550308"/>
              </div>
            </div>
          </div>
        }

        @if (erro()) { <div class="alert-error">{{ erro() }}</div> }
        @if (sucesso()) { <div class="alert-ok">Transportadora salva!</div> }

        <div class="form-actions">
          <button class="btn-ghost" (click)="goBack()">Cancelar</button>
          <button class="btn-primary" [disabled]="salvando()" (click)="salvar()">
            {{ salvando() ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
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
    .btn-danger-outline:hover { background: rgba(255,77,109,.1); }

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

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
    .field-error { font-size: 11px; color: var(--red); }
    .field-hint { font-size: 11px; color: var(--text2); }
    .combo-row { display: flex; gap: 6px; }
    .combo-row .input { flex: 1; }
    .btn-inline { background: var(--bg3); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem .75rem; font-size: 12.5px; cursor: pointer; white-space: nowrap; }
    .btn-inline:hover { color: var(--accent); border-color: var(--accent); }
    .btn-inline:disabled { opacity: .5; cursor: not-allowed; }
    .toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); margin-top: 6px; }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { background: rgba(0, 229, 160, .1); border: 1px solid rgba(0, 229, 160, .3); color: var(--green); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }

    /* Tablet/iPad e mobile */
    @media (max-width: 640px) {
      .header-top { flex-direction: column; align-items: stretch; }
      .form-grid { grid-template-columns: 1fr; }
      .col-2 { grid-column: span 1; }
      .combo-row { flex-direction: column; align-items: stretch; }
      .form-actions { flex-direction: column-reverse; }
      .form-actions button { width: 100%; }
    }
  `],
})
export class TransportadoraDetailComponent implements OnInit {
  private readonly _svc     = inject(TransportadoraService);
  private readonly _cepSvc  = inject(CepService);
  private readonly _cnpjSvc = inject(CnpjService);
  private readonly _route   = inject(ActivatedRoute);
  private readonly _router  = inject(Router);

  private clienteId = '';
  private transportadoraId = '';

  readonly isNew    = signal(true);
  readonly loading  = signal(true);
  readonly salvando = signal(false);
  readonly erro     = signal<string | null>(null);
  readonly sucesso  = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly tab      = signal<Tab>('cadastro');
  readonly buscandoCep = signal(false);
  readonly buscandoCnpj = signal(false);
  readonly erroCnpj = signal<string | null>(null);

  form = this._empty();

  ehCnpj(): boolean {
    return (this.form.cpfCnpj || '').replace(/\D/g, '').length === 14;
  }

  buscarCnpj(): void {
    const digitos = (this.form.cpfCnpj || '').replace(/\D/g, '');
    if (digitos.length !== 14) return;

    this.buscandoCnpj.set(true);
    this.erroCnpj.set(null);
    this._cnpjSvc.buscar(digitos).subscribe(r => {
      this.buscandoCnpj.set(false);
      if (!r) { this.erroCnpj.set('CNPJ não encontrado.'); return; }
      this.form.razaoSocial = r.razaoSocial || this.form.razaoSocial;
      this.form.nomeFantasia = r.nomeFantasia || this.form.nomeFantasia;
      this.form.telefone = r.telefone || this.form.telefone;
      this.form.email = r.email || this.form.email;
      this.form.logradouro = r.logradouro || this.form.logradouro;
      this.form.numero = r.numero || this.form.numero;
      this.form.complemento = r.complemento || this.form.complemento;
      this.form.bairro = r.bairro || this.form.bairro;
      this.form.cep = r.cep || this.form.cep;
      this.form.cidade = r.municipio || this.form.cidade;
      this.form.estado = r.uf || this.form.estado;
    });
  }

  onCepChange(valor: string): void {
    const digitos = (valor || '').replace(/\D/g, '');
    if (digitos.length !== 8) return;

    this.buscandoCep.set(true);
    this._cepSvc.buscar(digitos).subscribe(r => {
      this.buscandoCep.set(false);
      if (!r) return;
      this.form.logradouro = r.logradouro || this.form.logradouro;
      this.form.bairro = r.bairro || this.form.bairro;
      this.form.complemento = r.complemento || this.form.complemento;
      this.form.cidade = r.localidade || this.form.cidade;
      this.form.estado = r.uf || this.form.estado;
      this.form.codigoIbgeCidade = r.ibge || this.form.codigoIbgeCidade;
    });
  }

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.transportadoraId = this._route.snapshot.paramMap.get('transportadoraId') ?? '';
    this.isNew.set(!this.transportadoraId || this.transportadoraId === 'novo');

    if (this.isNew()) {
      this.loading.set(false);
      return;
    }

    this._svc.getById(this.clienteId, this.transportadoraId).subscribe({
      next: t => { this._sync(t); this.loading.set(false); },
      error: () => { this.loading.set(false); this.erro.set('Transportadora não encontrada.'); },
    });
  }

  private _sync(t: TransportadoraDto): void {
    this.form = {
      razaoSocial: t.razaoSocial, nomeFantasia: t.nomeFantasia ?? '', cpfCnpj: t.cpfCnpj ?? '',
      inscricaoEstadual: t.inscricaoEstadual ?? '', email: t.email ?? '', telefone: t.telefone ?? '',
      logradouro: t.logradouro ?? '', numero: t.numero ?? '', complemento: t.complemento ?? '',
      bairro: t.bairro ?? '', cep: t.cep ?? '', cidade: t.cidade ?? '', estado: t.estado ?? '',
      codigoIbgeCidade: t.codigoIbgeCidade ?? '', ativo: t.ativo,
    };
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'transportadoras']); }

  salvar(): void {
    if (this.salvando()) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(false);
    this.fieldErrors.set({});

    const req = {
      razaoSocial: this.form.razaoSocial,
      nomeFantasia: this.form.nomeFantasia || undefined,
      cpfCnpj: this.form.cpfCnpj || undefined,
      inscricaoEstadual: this.form.inscricaoEstadual || undefined,
      email: this.form.email || undefined,
      telefone: this.form.telefone || undefined,
      logradouro: this.form.logradouro || undefined,
      numero: this.form.numero || undefined,
      complemento: this.form.complemento || undefined,
      bairro: this.form.bairro || undefined,
      cep: this.form.cep || undefined,
      cidade: this.form.cidade || undefined,
      estado: this.form.estado || undefined,
      codigoIbgeCidade: this.form.codigoIbgeCidade || undefined,
    };

    const obs = this.isNew()
      ? this._svc.create(this.clienteId, req)
      : this._svc.update(this.clienteId, this.transportadoraId, { ...req, ativo: this.form.ativo });

    obs.subscribe({
      next: t => {
        this.salvando.set(false);
        this.sucesso.set(true);
        if (this.isNew()) { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'transportadoras', t.id]); }
        else { this._sync(t); }
        setTimeout(() => this.sucesso.set(false), 3000);
      },
      error: err => {
        this.salvando.set(false);
        this.erro.set(extractErrorMessage(err, 'Erro ao salvar transportadora.'));
        this.fieldErrors.set(extractFieldErrors(err) ?? {});
      },
    });
  }

  excluir(): void {
    if (!confirm(`Excluir "${this.form.razaoSocial}"? Esta ação não pode ser desfeita.`)) return;
    this._svc.delete(this.clienteId, this.transportadoraId).subscribe({
      next: () => this.goBack(),
      error: err => this.erro.set(extractErrorMessage(err, 'Erro ao excluir transportadora.')),
    });
  }

  private _empty() {
    return {
      razaoSocial: '', nomeFantasia: '', cpfCnpj: '', inscricaoEstadual: '', email: '', telefone: '',
      logradouro: '', numero: '', complemento: '', bairro: '', cep: '', cidade: '', estado: '',
      codigoIbgeCidade: '', ativo: true,
    };
  }
}
