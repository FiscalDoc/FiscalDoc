import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService, extractErrorMessage } from '@veloxml/services';
import { ClienteDto } from '@veloxml/models';

@Component({
  selector: 'app-cliente-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading-state">Carregando...</div>
    } @else if (!cliente()) {
      <div class="loading-state">Não foi possível carregar os dados da empresa.</div>
    } @else {
      <div class="page">
        <div class="page-header">
          <h2 class="page-title">Empresa</h2>
          <p class="page-sub">Dados cadastrais da sua empresa</p>
        </div>

        <div class="card section">
          <h4 class="section-title">Dados da Empresa</h4>
          <div class="form-grid">
            <div class="field">
              <label class="label">CNPJ</label>
              <input class="input" [value]="formatCnpj(cliente()!.cnpj)" disabled/>
            </div>
            <div class="field">
              <label class="label">Status</label>
              <div class="status-row">
                <span class="badge" [class.badge-green]="cliente()!.ativo" [class.badge-red]="!cliente()!.ativo">
                  {{ cliente()!.ativo ? 'Ativo' : 'Inativo' }}
                </span>
                <span class="field-hint">Alteração de status é feita pelo seu escritório contábil.</span>
              </div>
            </div>
            <div class="field col-2">
              <label class="label">Razão Social *</label>
              <input class="input" [(ngModel)]="form.razaoSocial" placeholder="Razão Social"/>
            </div>
            <div class="field col-2">
              <label class="label">Nome Fantasia</label>
              <input class="input" [(ngModel)]="form.nomeFantasia" placeholder="Opcional"/>
            </div>
            <div class="field">
              <label class="label">E-mail</label>
              <input class="input" type="email" [(ngModel)]="form.email" autocomplete="off"/>
            </div>
            <div class="field">
              <label class="label">Telefone</label>
              <input class="input" [(ngModel)]="form.telefone" placeholder="(11) 99999-9999"/>
            </div>
            <div class="field">
              <label class="label">Cidade</label>
              <input class="input" [(ngModel)]="form.cidade"/>
            </div>
            <div class="field">
              <label class="label">UF</label>
              <input class="input" [(ngModel)]="form.estado" maxlength="2" placeholder="SP"/>
            </div>
          </div>

          @if (erro()) { <div class="alert-error">{{ erro() }}</div> }
          @if (sucesso()) { <div class="alert-ok">Dados da empresa salvos!</div> }

          <div class="form-actions">
            <button class="btn-primary" [disabled]="salvando()" (click)="salvar()">
              {{ salvando() ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </div>
        </div>

        <div class="card section">
          <h4 class="section-title">Emissão de NF-e</h4>
          <div class="status-row">
            <span class="badge" [class.badge-green]="cliente()!.nfeHabilitado" [class.badge-gray]="!cliente()!.nfeHabilitado">
              {{ cliente()!.nfeHabilitado ? 'Habilitada' : 'Não habilitada' }}
            </span>
            <span class="field-hint">Apenas o administrador pode habilitar a emissão de NF-e.</span>
          </div>
        </div>

        <div class="card section">
          <div class="section-header-row">
            <div>
              <h4 class="section-title" style="margin-bottom:4px">Importação de XML por E-mail</h4>
              <p class="field-hint" style="margin:0">Quando habilitado, o sistema lê a caixa de entrada configurada e importa anexos XML automaticamente.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="imap.habilitado"/>
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          @if (imap.habilitado) {
            <div class="form-grid" style="margin-top:1rem">
              <div class="field">
                <label class="label">Host IMAP</label>
                <input class="input" [(ngModel)]="imap.host" placeholder="imap.gmail.com"/>
              </div>
              <div class="field">
                <label class="label">Porta</label>
                <input class="input" type="number" [(ngModel)]="imap.port" placeholder="993"/>
              </div>
              <div class="field col-2">
                <label class="label">E-mail</label>
                <input class="input" [(ngModel)]="imap.email" type="email" placeholder="fiscal@empresa.com" autocomplete="off"/>
              </div>
              <div class="field col-2">
                <label class="label">Senha</label>
                <input class="input" [(ngModel)]="imap.senha" type="password" placeholder="{{ cliente()!.imapEmail ? '••••••••' : 'Senha do e-mail' }}" autocomplete="new-password"/>
                @if (cliente()!.imapEmail) {
                  <span class="field-hint">Deixe em branco para manter a senha atual.</span>
                }
              </div>
            </div>
          }
          @if (erroImap()) { <div class="alert-error">{{ erroImap() }}</div> }
          @if (sucessoImap()) { <div class="alert-ok">Configuração de e-mail salva!</div> }
          <div class="form-actions">
            <a routerLink="/logs" class="link-ghost">Ver histórico em Logs</a>
            <button class="btn-primary" [disabled]="salvandoImap()" (click)="salvarImap()">
              {{ salvandoImap() ? 'Salvando...' : 'Salvar configuração de e-mail' }}
            </button>
          </div>
        </div>

        <div class="card section">
          <h4 class="section-title">Integração via API</h4>
          <p class="field-hint">Use esta chave no header <code>X-App-Key</code> para o seu ERP ou emissor de nota enviar XMLs direto pra cá, sem login.</p>
          <div class="appkey-box">
            <code class="appkey-value">{{ cliente()!.appKey }}</code>
            <div class="appkey-actions">
              <button class="appkey-btn" (click)="copyAppKey()" [class.copied]="keyCopied()">
                {{ keyCopied() ? 'Copiado' : 'Copiar' }}
              </button>
              <button class="appkey-btn appkey-btn-warn" (click)="regenerarKey()" [disabled]="keyLoading()">
                {{ keyLoading() ? 'Gerando...' : 'Regenerar' }}
              </button>
            </div>
          </div>
          <p class="field-hint">Ao regenerar, a chave anterior deixa de funcionar imediatamente.</p>
          <div class="field">
            <label class="label">Exemplo (curl)</label>
            <pre class="docs-code">{{ curlExemplo() }}</pre>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .25rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .page-sub { color: var(--text2); font-size: 13px; margin: 0; }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; }
    .input:focus { border-color: var(--accent); }
    .input:disabled { opacity: .6; cursor: not-allowed; }

    .status-row { display: flex; align-items: center; gap: 10px; }
    .field-hint { font-size: 12px; color: var(--text2); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .badge-green { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-red   { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-gray  { background: var(--bg3); color: var(--text2); }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { background: rgba(0,229,160,.1); border: 1px solid rgba(0,229,160,.3); color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .form-actions { display: flex; align-items: center; justify-content: space-between; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .link-ghost { color: var(--text2); font-size: 13px; text-decoration: none; }
    .link-ghost:hover { color: var(--accent); text-decoration: underline; }

    .section-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .toggle { display: inline-flex; cursor: pointer; flex-shrink: 0; }
    .toggle input { display: none; }
    .toggle-track { width: 40px; height: 22px; background: var(--bg3); border: 1px solid var(--border); border-radius: 999px; position: relative; transition: background 200ms, border-color 200ms; }
    .toggle input:checked + .toggle-track { background: var(--accent); border-color: var(--accent); }
    .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: var(--text2); border-radius: 50%; transition: transform 200ms, background 200ms; }
    .toggle input:checked + .toggle-track .toggle-thumb { transform: translateX(18px); background: #0d0f14; }

    .appkey-box { display: flex; align-items: center; gap: 8px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
    .appkey-value { font-family: monospace; font-size: 13px; color: var(--accent); flex: 1; word-break: break-all; }
    .appkey-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .appkey-btn { display: inline-flex; align-items: center; gap: 5px; background: var(--bg2); border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; white-space: nowrap; }
    .appkey-btn:hover { color: var(--accent); border-color: var(--accent); }
    .appkey-btn.copied { color: var(--accent); border-color: var(--accent); }
    .appkey-btn-warn:hover { color: var(--yellow); border-color: var(--yellow); }
    .appkey-btn:disabled { opacity: .5; cursor: not-allowed; }
    .docs-code { margin: 0; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: .75rem; font-size: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-word; color: var(--text); overflow-x: auto; }
  `],
})
export class ClienteEmpresaComponent implements OnInit {
  private readonly _svc   = inject(ClienteService);
  private readonly _route = inject(ActivatedRoute);

  private clienteId = '';

  readonly cliente  = signal<ClienteDto | null>(null);
  readonly loading  = signal(true);
  readonly salvando = signal(false);
  readonly erro     = signal<string | null>(null);
  readonly sucesso  = signal(false);

  readonly salvandoImap = signal(false);
  readonly erroImap     = signal<string | null>(null);
  readonly sucessoImap  = signal(false);

  readonly keyLoading = signal(false);
  readonly keyCopied  = signal(false);

  readonly curlExemplo = computed(() => {
    const c = this.cliente();
    const appKey = c?.appKey ?? '<sua-appkey>';
    return `curl -X POST "${location.origin}/api/v1/ingest/xml?tipo=NFe" \\
  -H "X-App-Key: ${appKey}" \\
  -H "Content-Type: application/xml" \\
  --data-binary @nota.xml`;
  });

  form = { razaoSocial: '', nomeFantasia: '', email: '', telefone: '', cidade: '', estado: '' };
  imap = { habilitado: false, host: '', port: 993, email: '', senha: '' };

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this._svc.getById(this.clienteId).subscribe({
      next: c => {
        this.cliente.set(c);
        this.form = {
          razaoSocial: c.razaoSocial, nomeFantasia: c.nomeFantasia ?? '', email: c.email ?? '',
          telefone: c.telefone ?? '', cidade: c.cidade ?? '', estado: c.estado ?? '',
        };
        this._syncImap(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private _syncImap(c: ClienteDto): void {
    this.imap = { habilitado: c.imapHabilitado, host: c.imapHost ?? '', port: c.imapPort || 993, email: c.imapEmail ?? '', senha: '' };
  }

  salvarImap(): void {
    const c = this.cliente();
    if (!c || this.salvandoImap()) return;
    this.salvandoImap.set(true);
    this.erroImap.set(null);
    this.sucessoImap.set(false);
    this._svc.configurarImap(c.id, {
      habilitado: this.imap.habilitado,
      host: this.imap.host || undefined,
      port: this.imap.port || 993,
      email: this.imap.email || undefined,
      senha: this.imap.senha || undefined,
    }).subscribe({
      next: updated => {
        this.cliente.set(updated);
        this._syncImap(updated);
        this.salvandoImap.set(false);
        this.sucessoImap.set(true);
        setTimeout(() => this.sucessoImap.set(false), 3000);
      },
      error: err => { this.salvandoImap.set(false); this.erroImap.set(extractErrorMessage(err, 'Erro ao salvar configuração de e-mail.')); },
    });
  }

  copyAppKey(): void {
    const key = this.cliente()?.appKey;
    if (!key) return;
    navigator.clipboard.writeText(key);
    this.keyCopied.set(true);
    setTimeout(() => this.keyCopied.set(false), 2000);
  }

  regenerarKey(): void {
    const c = this.cliente();
    if (!c || this.keyLoading()) return;
    this.keyLoading.set(true);
    this._svc.regenerarAppKey(c.id).subscribe({
      next: res => { this.cliente.update(cur => cur ? { ...cur, appKey: res.appKey } : cur); this.keyLoading.set(false); },
      error: () => this.keyLoading.set(false),
    });
  }

  formatCnpj(cnpj: string): string {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  salvar(): void {
    const c = this.cliente();
    if (!c || this.salvando()) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(false);

    this._svc.update(c.id, {
      id: c.id,
      razaoSocial: this.form.razaoSocial,
      nomeFantasia: this.form.nomeFantasia || undefined,
      email: this.form.email || undefined,
      telefone: this.form.telefone || undefined,
      cidade: this.form.cidade || undefined,
      estado: this.form.estado || undefined,
      ativo: c.ativo,
    }).subscribe({
      next: updated => {
        this.cliente.set(updated);
        this.salvando.set(false);
        this.sucesso.set(true);
        setTimeout(() => this.sucesso.set(false), 3000);
      },
      error: err => { this.salvando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao salvar dados da empresa.')); },
    });
  }
}
