import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService, CepService, extractErrorMessage } from '@veloxml/services';
import { ClienteDto } from '@veloxml/models';

type Tab = 'dados' | 'endereco' | 'fiscal' | 'parametros';

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

        <nav class="tabs">
          <button class="tab-btn" [class.active]="tab() === 'dados'" (click)="tab.set('dados')">Dados Principais</button>
          <button class="tab-btn" [class.active]="tab() === 'endereco'" (click)="tab.set('endereco')">Endereço</button>
          <button class="tab-btn" [class.active]="tab() === 'fiscal'" (click)="tab.set('fiscal')">Fiscal</button>
          <button class="tab-btn" [class.active]="tab() === 'parametros'" (click)="tab.set('parametros')">Parâmetros</button>
        </nav>

        <!-- ── Dados Principais ── -->
        @if (tab() === 'dados') {
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
            </div>

            @if (erro()) { <div class="alert-error">{{ erro() }}</div> }
            @if (sucesso()) { <div class="alert-ok">Dados da empresa salvos!</div> }

            <div class="form-actions">
              <button class="btn-primary" [disabled]="salvando()" (click)="salvar()">
                {{ salvando() ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
            </div>
          </div>
        }

        <!-- ── Endereço ── -->
        @if (tab() === 'endereco') {
          <div class="card section">
            <h4 class="section-title">Endereço</h4>
            <p class="field-hint" style="margin:0">Todos os campos abaixo são obrigatórios pra registrar o certificado digital e emitir NF-e.</p>
            <div class="form-grid">
              <div class="field">
                <label class="label">CEP *</label>
                <input class="input" [(ngModel)]="form.cep" (ngModelChange)="onCepChange($event)" placeholder="00000-000" maxlength="9"/>
                @if (buscandoCep()) { <span class="field-hint">Buscando endereço...</span> }
              </div>
              <div class="field col-2">
                <label class="label">Logradouro *</label>
                <input class="input" [(ngModel)]="form.logradouro" placeholder="Rua/Av."/>
              </div>
              <div class="field">
                <label class="label">Número *</label>
                <input class="input" [(ngModel)]="form.numero"/>
              </div>
              <div class="field">
                <label class="label">Complemento</label>
                <input class="input" [(ngModel)]="form.complemento"/>
              </div>
              <div class="field">
                <label class="label">Bairro *</label>
                <input class="input" [(ngModel)]="form.bairro"/>
              </div>
              <div class="field">
                <label class="label">Cidade *</label>
                <input class="input" [(ngModel)]="form.cidade"/>
              </div>
              <div class="field">
                <label class="label">UF *</label>
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
        }

        <!-- ── Fiscal ── -->
        @if (tab() === 'fiscal') {
          <div class="card section">
            <h4 class="section-title">Configuração Fiscal</h4>
            <p class="field-hint" style="margin:0">Usado no registro da empresa junto ao emissor de NF-e — preencha antes de enviar o certificado.</p>
            <div class="form-grid">
              <div class="field col-2">
                <label class="label">Regime Tributário *</label>
                <select class="input" [(ngModel)]="fiscal.regimeTributario">
                  <option value="">Não informado</option>
                  <option value="SimplesNacional">Simples Nacional</option>
                  <option value="LucroPresumido">Lucro Presumido</option>
                  <option value="LucroReal">Lucro Real</option>
                  <option value="Mei">MEI</option>
                </select>
              </div>
              <div class="field">
                <label class="label">Inscrição Estadual</label>
                <input class="input" [(ngModel)]="fiscal.inscricaoEstadual" placeholder="Opcional"/>
              </div>
              <div class="field">
                <label class="label">Inscrição Municipal</label>
                <input class="input" [(ngModel)]="fiscal.inscricaoMunicipal" placeholder="Opcional"/>
              </div>
              <div class="field">
                <label class="label">CNAE Principal</label>
                <input class="input" [(ngModel)]="fiscal.cnaePrincipal" placeholder="0000-0/00"/>
              </div>
            </div>

            @if (erroFiscal()) { <div class="alert-error">{{ erroFiscal() }}</div> }
            @if (sucessoFiscal()) { <div class="alert-ok">Configuração fiscal salva!</div> }

            <div class="form-actions">
              <span></span>
              <button class="btn-primary" [disabled]="salvandoFiscal()" (click)="salvarFiscal()">
                {{ salvandoFiscal() ? 'Salvando...' : 'Salvar configuração fiscal' }}
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

            <div class="cert-status-row">
              <span class="label">Certificado digital A1</span>
              <span class="badge" [class]="focusStatusClass()">{{ focusStatusLabel() }}</span>
            </div>
            @if (cliente()!.focusNfeErro) {
              <div class="alert-error">{{ cliente()!.focusNfeErro }}</div>
            }
            @if (cliente()!.certificadoA1Validade) {
              <p class="field-hint">Certificado válido até {{ formatDate(cliente()!.certificadoA1Validade!) }}.</p>
            }

            <div class="form-grid">
              <div class="field">
                <label class="label">Ambiente</label>
                <select class="input" [(ngModel)]="ambiente">
                  <option value="homologacao">Homologação (testes)</option>
                  <option value="producao">Produção</option>
                </select>
              </div>
              <div class="field">
                <label class="label">Arquivo do certificado (.pfx/.p12)</label>
                <input class="input" type="file" accept=".pfx,.p12" (change)="onCertificadoSelecionado($event)"/>
              </div>
              <div class="field col-2">
                <label class="label">Senha do certificado</label>
                <input class="input" type="password" [(ngModel)]="certificadoSenha" autocomplete="new-password"/>
              </div>
            </div>

            @if (erroCertificado()) { <div class="alert-error">{{ erroCertificado() }}</div> }
            @if (sucessoCertificado()) { <div class="alert-ok">Certificado enviado e processado!</div> }

            <div class="form-actions">
              <span></span>
              <button class="btn-primary" [disabled]="enviandoCertificado() || !certificadoArquivo() || !certificadoSenha" (click)="enviarCertificado()">
                {{ enviandoCertificado() ? 'Enviando...' : 'Enviar certificado' }}
              </button>
            </div>
          </div>
        }

        <!-- ── Parâmetros ── -->
        @if (tab() === 'parametros') {
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
        }
      </div>
    }
  `,
  styles: [`
    .loading-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .25rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .page-sub { color: var(--text2); font-size: 13px; margin: 0; }

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
    .input:disabled { opacity: .6; cursor: not-allowed; }

    .status-row { display: flex; align-items: center; gap: 10px; }
    .cert-status-row { display: flex; align-items: center; gap: 10px; padding-top: .5rem; border-top: 1px solid var(--border); }
    .badge-yellow { background: rgba(255,193,7,.12); color: #ffc107; }
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
  private readonly _svc    = inject(ClienteService);
  private readonly _cepSvc = inject(CepService);
  private readonly _route  = inject(ActivatedRoute);
  readonly buscandoCep = signal(false);
  readonly tab = signal<Tab>('dados');

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

  readonly certificadoArquivo   = signal<File | null>(null);
  readonly enviandoCertificado  = signal(false);
  readonly erroCertificado      = signal<string | null>(null);
  readonly sucessoCertificado   = signal(false);
  certificadoSenha = '';
  ambiente: 'homologacao' | 'producao' = 'homologacao';

  readonly salvandoFiscal = signal(false);
  readonly erroFiscal     = signal<string | null>(null);
  readonly sucessoFiscal  = signal(false);
  fiscal = { regimeTributario: '', inscricaoEstadual: '', inscricaoMunicipal: '', cnaePrincipal: '' };

  readonly focusStatusLabel = computed(() => {
    switch (this.cliente()?.focusNfeStatus) {
      case 'Registrada': return 'Certificado registrado';
      case 'PendenteRegistro': return 'Processando registro...';
      case 'ErroRegistro': return 'Erro ao registrar';
      default: return 'Não configurado';
    }
  });

  readonly focusStatusClass = computed(() => {
    switch (this.cliente()?.focusNfeStatus) {
      case 'Registrada': return 'badge badge-green';
      case 'PendenteRegistro': return 'badge badge-yellow';
      case 'ErroRegistro': return 'badge badge-red';
      default: return 'badge badge-gray';
    }
  });

  readonly curlExemplo = computed(() => {
    const c = this.cliente();
    const appKey = c?.appKey ?? '<sua-appkey>';
    return `curl -X POST "${location.origin}/api/v1/ingest/xml?tipo=NFe" \\
  -H "X-App-Key: ${appKey}" \\
  -H "Content-Type: application/xml" \\
  --data-binary @nota.xml`;
  });

  form = {
    razaoSocial: '', nomeFantasia: '', email: '', telefone: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', codigoIbgeCidade: '',
    cidade: '', estado: '',
  };
  imap = { habilitado: false, host: '', port: 993, email: '', senha: '' };

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this._svc.getById(this.clienteId).subscribe({
      next: c => {
        this.cliente.set(c);
        this.form = {
          razaoSocial: c.razaoSocial, nomeFantasia: c.nomeFantasia ?? '', email: c.email ?? '',
          telefone: c.telefone ?? '',
          cep: c.cep ?? '', logradouro: c.logradouro ?? '', numero: c.numero ?? '',
          complemento: c.complemento ?? '', bairro: c.bairro ?? '', codigoIbgeCidade: c.codigoIbgeCidade ?? '',
          cidade: c.cidade ?? '', estado: c.estado ?? '',
        };
        this._syncImap(c);
        this.ambiente = c.focusNfeAmbiente ?? 'homologacao';
        this.fiscal = {
          regimeTributario: c.regimeTributario ?? '', inscricaoEstadual: c.inscricaoEstadual ?? '',
          inscricaoMunicipal: c.inscricaoMunicipal ?? '', cnaePrincipal: c.cnaePrincipal ?? '',
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  onCertificadoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.certificadoArquivo.set(input.files?.[0] ?? null);
  }

  enviarCertificado(): void {
    const c = this.cliente();
    const arquivo = this.certificadoArquivo();
    if (!c || !arquivo || !this.certificadoSenha || this.enviandoCertificado()) return;

    this.enviandoCertificado.set(true);
    this.erroCertificado.set(null);
    this.sucessoCertificado.set(false);

    this._svc.uploadCertificado(c.id, arquivo, this.certificadoSenha, this.ambiente).subscribe({
      next: updated => {
        this.cliente.set(updated);
        this.enviandoCertificado.set(false);
        this.certificadoSenha = '';
        this.certificadoArquivo.set(null);
        // O upload em si sempre "dá certo" (o arquivo foi aceito e processado) — mas só é
        // sucesso de verdade se a Focus também aceitou o cadastro. Rejeição vira "ErroRegistro"
        // e já aparece no badge/alerta de erro logo acima, então evita mostrar as duas
        // mensagens contraditórias juntas ("enviado!" + erro).
        if (updated.focusNfeStatus === 'Registrada') {
          this.sucessoCertificado.set(true);
          setTimeout(() => this.sucessoCertificado.set(false), 4000);
        }
      },
      error: err => {
        this.enviandoCertificado.set(false);
        this.erroCertificado.set(extractErrorMessage(err, 'Erro ao enviar certificado.'));
      },
    });
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
      cep: this.form.cep || undefined,
      logradouro: this.form.logradouro || undefined,
      numero: this.form.numero || undefined,
      complemento: this.form.complemento || undefined,
      bairro: this.form.bairro || undefined,
      codigoIbgeCidade: this.form.codigoIbgeCidade || undefined,
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

  salvarFiscal(): void {
    const c = this.cliente();
    if (!c || this.salvandoFiscal()) return;
    this.salvandoFiscal.set(true);
    this.erroFiscal.set(null);
    this.sucessoFiscal.set(false);

    // serieNfe/nfeHabilitado não são editáveis nessa tela — manda os valores atuais pra não
    // sobrescrever com o default do backend (nfeHabilitado continua exclusivo do Administrador).
    this._svc.updateFiscal(c.id, {
      regimeTributario: this.fiscal.regimeTributario || undefined,
      inscricaoEstadual: this.fiscal.inscricaoEstadual || undefined,
      inscricaoMunicipal: this.fiscal.inscricaoMunicipal || undefined,
      cnaePrincipal: this.fiscal.cnaePrincipal || undefined,
      serieNfe: c.serieNfe ?? '1',
      nfeHabilitado: c.nfeHabilitado ?? false,
    }).subscribe({
      next: updated => {
        this.cliente.set(updated);
        this.salvandoFiscal.set(false);
        this.sucessoFiscal.set(true);
        setTimeout(() => this.sucessoFiscal.set(false), 3000);
      },
      error: err => {
        this.salvandoFiscal.set(false);
        this.erroFiscal.set(extractErrorMessage(err, 'Erro ao salvar configuração fiscal.'));
      },
    });
  }
}
