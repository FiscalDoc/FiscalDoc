import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ClienteService, ContadorService, extractErrorMessage } from '@veloxml/services';
import { ClienteDto, ContadorDto } from '@veloxml/models';

@Component({
  selector: 'app-selecionar-contexto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="card">
        <div class="brand">
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h1 class="font-heading">FiscalDoc</h1>
        </div>
        <p class="subtitle">Como você quer entrar?</p>

        <button type="button" class="btn-admin" (click)="continuarComoAdmin()">
          Continuar como Administrador
        </button>

        <div class="divider"><span>ou atuar como</span></div>

        <div class="field">
          <label class="label">Perfil</label>
          <div class="perfil-toggle">
            <button type="button" class="perfil-btn" [class.active]="perfil === 'Contador'" (click)="onPerfilChange('Contador')">Contador</button>
            <button type="button" class="perfil-btn" [class.active]="perfil === 'Cliente'" (click)="onPerfilChange('Cliente')">Cliente</button>
          </div>
        </div>

        @if (perfil === 'Contador') {
          <div class="field combo-field">
            <label class="label">Empresa (Contador)</label>
            <input
              class="input"
              [(ngModel)]="contadorBusca"
              (ngModelChange)="onContadorBuscaChange($event)"
              (focus)="contadorDropdownOpen.set(true)"
              (blur)="onContadorBlur()"
              placeholder="Buscar por nome, empresa ou CRC..."
            />
            @if (contadorDropdownOpen()) {
              <div class="combo-dropdown">
                @if (loadingContadores()) {
                  <div class="combo-item combo-item-hint">Buscando...</div>
                } @else if (contadorResults().length === 0) {
                  <div class="combo-item combo-item-hint">{{ contadorBusca.trim() ? 'Nenhum contador encontrado' : 'Digite para buscar...' }}</div>
                } @else {
                  @for (c of contadorResults(); track c.id) {
                    <div class="combo-item" (mousedown)="selecionarContador(c)">{{ contadorLabel(c) }}</div>
                  }
                }
              </div>
            }
          </div>
        }

        @if (perfil === 'Cliente') {
          <div class="field combo-field">
            <label class="label">Cliente</label>
            <input
              class="input"
              [(ngModel)]="clienteBusca"
              (ngModelChange)="onClienteBuscaChange($event)"
              (focus)="clienteDropdownOpen.set(true)"
              (blur)="onClienteBlur()"
              placeholder="Buscar por razão social ou CNPJ..."
            />
            @if (clienteDropdownOpen()) {
              <div class="combo-dropdown">
                @if (loadingClientes()) {
                  <div class="combo-item combo-item-hint">Buscando...</div>
                } @else if (clienteResults().length === 0) {
                  <div class="combo-item combo-item-hint">{{ clienteBusca.trim() ? 'Nenhum cliente encontrado' : 'Digite para buscar...' }}</div>
                } @else {
                  @for (c of clienteResults(); track c.id) {
                    <div class="combo-item" (mousedown)="selecionarCliente(c)">{{ clienteLabel(c) }}</div>
                  }
                }
              </div>
            }
          </div>
        }

        @if (erro()) { <p class="error-msg">{{ erro() }}</p> }

        <button type="button" class="btn btn-primary" [disabled]="!podeEntrar() || entrando()" (click)="entrar()">
          {{ entrando() ? 'Entrando...' : 'Entrar como ' + perfil }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); }
    .card {
      width: 400px; display: flex; flex-direction: column; gap: 1rem; background: var(--bg2);
      border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem;
    }
    .brand { display: flex; align-items: center; gap: 0.625rem; }
    .brand-icon {
      width: 34px; height: 34px; border-radius: 9px; background: var(--accent); color: #0d0f14;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .brand h1 { font-size: 1.5rem; margin: 0; }
    .subtitle { color: var(--text2); font-size: 13px; margin: -0.5rem 0 0; }
    .btn-admin {
      width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--accent);
      background: var(--accent); color: #0d0f14; font-weight: 700; font-size: 14px; cursor: pointer;
    }
    .btn-admin:hover { opacity: .9; }
    .divider { display: flex; align-items: center; gap: .75rem; color: var(--text2); font-size: 11.5px; text-transform: uppercase; letter-spacing: .04em; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 12px; color: var(--text2); font-weight: 500; }
    .input {
      background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 10px 12px; color: var(--text); font-size: 14px; outline: none; width: 100%; box-sizing: border-box;
    }
    .input:focus { border-color: var(--accent); }
    .input:disabled { opacity: .5; }
    .perfil-toggle { display: flex; gap: .5rem; }
    .perfil-btn {
      flex: 1; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--bg3); color: var(--text2); font-size: 13px; cursor: pointer;
    }
    .perfil-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(0,229,160,.08); }
    .btn { width: 100%; justify-content: center; padding: 10px; }
    .error-msg {
      font-size: 13px; color: var(--red); background: rgba(255,77,109,0.1);
      border: 1px solid rgba(255,77,109,0.2); border-radius: var(--radius-sm); padding: 8px 12px; margin: 0;
    }
    .combo-field { position: relative; }
    .combo-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20; max-height: 220px; overflow-y: auto;
      background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm);
      box-shadow: 0 8px 20px rgba(0,0,0,.35);
    }
    .combo-item { padding: 9px 12px; font-size: 13.5px; color: var(--text); cursor: pointer; }
    .combo-item:hover { background: var(--bg2); }
    .combo-item-hint { color: var(--text2); cursor: default; }
    .combo-item-hint:hover { background: transparent; }
  `],
})
export class SelecionarContextoComponent {
  private readonly _auth    = inject(AuthService);
  private readonly _cntSvc  = inject(ContadorService);
  private readonly _cliSvc  = inject(ClienteService);
  private readonly _router  = inject(Router);

  perfil: 'Contador' | 'Cliente' = 'Contador';
  entrando = signal(false);
  erro     = signal<string | null>(null);

  contadorBusca = '';
  contadorSelecionado = signal<ContadorDto | null>(null);
  contadorResults = signal<ContadorDto[]>([]);
  contadorDropdownOpen = signal(false);
  loadingContadores = signal(false);
  private _contadorSearchTimer: ReturnType<typeof setTimeout> | null = null;

  clienteBusca = '';
  clienteSelecionado = signal<ClienteDto | null>(null);
  clienteResults = signal<ClienteDto[]>([]);
  clienteDropdownOpen = signal(false);
  loadingClientes = signal(false);
  private _clienteSearchTimer: ReturnType<typeof setTimeout> | null = null;

  contadorLabel(c: ContadorDto): string {
    const partes = [c.nome];
    if (c.empresa && c.empresa !== c.nome) partes.push(c.empresa);
    if (c.crc) partes.push('CRC ' + c.crc);
    return partes.join(' · ');
  }

  clienteLabel(c: ClienteDto): string {
    const partes = [`${c.razaoSocial} — ${this._formatCnpj(c.cnpj)}`];
    if (c.nomeContador) partes.push(c.nomeContador);
    return partes.join(' · ');
  }

  private _formatCnpj(cnpj: string): string {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  onPerfilChange(perfil: 'Contador' | 'Cliente'): void {
    this.perfil = perfil;
    this.erro.set(null);
  }

  onContadorBuscaChange(valor: string): void {
    this.contadorSelecionado.set(null);
    this.contadorDropdownOpen.set(true);
    if (this._contadorSearchTimer) clearTimeout(this._contadorSearchTimer);
    if (!valor.trim()) { this.contadorResults.set([]); return; }
    this.loadingContadores.set(true);
    this._contadorSearchTimer = setTimeout(() => {
      this._cntSvc.getAll({ termo: valor, pageSize: 15 }).subscribe({
        next: r => { this.contadorResults.set(r.items); this.loadingContadores.set(false); },
        error: () => this.loadingContadores.set(false),
      });
    }, 300);
  }

  selecionarContador(c: ContadorDto): void {
    this.contadorSelecionado.set(c);
    this.contadorBusca = this.contadorLabel(c);
    this.contadorDropdownOpen.set(false);
  }

  onContadorBlur(): void {
    setTimeout(() => this.contadorDropdownOpen.set(false), 150);
  }

  onClienteBuscaChange(valor: string): void {
    this.clienteSelecionado.set(null);
    this.clienteDropdownOpen.set(true);
    if (this._clienteSearchTimer) clearTimeout(this._clienteSearchTimer);
    if (!valor.trim()) { this.clienteResults.set([]); return; }
    this.loadingClientes.set(true);
    this._clienteSearchTimer = setTimeout(() => {
      // Busca global (sem contadorId) — o Admin escolhe o cliente direto, sem precisar
      // selecionar o contador antes.
      this._cliSvc.getAll({ termo: valor, pageSize: 15 }).subscribe({
        next: r => { this.clienteResults.set(r.items); this.loadingClientes.set(false); },
        error: () => this.loadingClientes.set(false),
      });
    }, 300);
  }

  selecionarCliente(c: ClienteDto): void {
    this.clienteSelecionado.set(c);
    this.clienteBusca = this.clienteLabel(c);
    this.clienteDropdownOpen.set(false);
  }

  onClienteBlur(): void {
    setTimeout(() => this.clienteDropdownOpen.set(false), 150);
  }

  podeEntrar(): boolean {
    if (this.perfil === 'Contador') return !!this.contadorSelecionado();
    return !!this.clienteSelecionado();
  }

  continuarComoAdmin(): void {
    this._router.navigate(['/dashboard']);
  }

  entrar(): void {
    if (!this.podeEntrar() || this.entrando()) return;
    this.entrando.set(true);
    this.erro.set(null);
    this._auth.switchContext({
      contadorId: this.perfil === 'Contador' ? this.contadorSelecionado()!.id : undefined,
      perfil: this.perfil,
      clienteId: this.perfil === 'Cliente' ? this.clienteSelecionado()!.id : undefined,
    }).subscribe({
      next: () => {
        this.entrando.set(false);
        this._router.navigate([this.perfil === 'Cliente' ? '/documentos' : '/dashboard']);
      },
      error: err => {
        this.entrando.set(false);
        this.erro.set(extractErrorMessage(err, 'Não foi possível entrar nesse contexto.'));
      },
    });
  }
}
