import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, ClienteService, ConfiguracaoService, CepService, extractErrorMessage } from '@veloxml/services';
import { ClienteDto, CriarContaClienteResponse, ImportacaoXmlClienteStatusDto } from '@veloxml/models';

type Tab = 'cadastro' | 'fiscal' | 'integracao';

@Component({
  selector: 'app-cliente-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading-state">Carregando...</div>
    } @else if (!cliente()) {
      <div class="loading-state">Cliente não encontrado.</div>
    } @else {
      <div class="page">
        <!-- Header -->
        <div class="profile-header">
          <button class="back-btn" (click)="goBack()">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Clientes
          </button>
          <div class="profile-top">
            <div class="profile-info">
              <div class="profile-avatar">{{ initials() }}</div>
              <div>
                <div class="profile-name">{{ cliente()!.razaoSocial }}</div>
                @if (cliente()!.nomeFantasia) {
                  <div class="profile-sub">{{ cliente()!.nomeFantasia }}</div>
                }
                <div class="profile-meta">
                  <span class="mono">{{ formatCnpj(cliente()!.cnpj) }}</span>
                  <span class="badge" [class.badge-green]="cliente()!.ativo" [class.badge-red]="!cliente()!.ativo">
                    {{ cliente()!.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Módulos -->
        <div class="modules-row">
          <a [routerLink]="['/clientes', cliente()!.id, 'cadastros', 'produtos']" class="module-card">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <div>
              <div class="module-title">Produtos</div>
              <div class="module-sub">Cadastrar produtos usados nos pedidos e NF-e</div>
            </div>
            <svg class="module-arrow" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
          <a [routerLink]="['/clientes', cliente()!.id, 'cadastros', 'destinatarios']" class="module-card">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>
            </svg>
            <div>
              <div class="module-title">Destinatários</div>
              <div class="module-sub">Cadastrar destinatários das NF-e (clientes finais)</div>
            </div>
            <svg class="module-arrow" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
          <a [routerLink]="['/clientes', cliente()!.id, 'pedidos']" class="module-card" [class.module-disabled]="!cliente()!.nfeHabilitado">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <div>
              <div class="module-title">Pedidos / NF-e</div>
              <div class="module-sub">
                @if (cliente()!.nfeHabilitado) { Montar pedidos e gerar notas fiscais }
                @else { NF-e não habilitada para este cliente }
              </div>
            </div>
            <svg class="module-arrow" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        <!-- Tabs -->
        <nav class="tabs">
          <button class="tab-btn" [class.active]="tab() === 'cadastro'" (click)="tab.set('cadastro')">Cadastro</button>
          <button class="tab-btn" [class.active]="tab() === 'fiscal'" (click)="tab.set('fiscal')">Fiscal</button>
          <button class="tab-btn" [class.active]="tab() === 'integracao'" (click)="tab.set('integracao')">Integração</button>
        </nav>

        <!-- ── Cadastro ── -->
        @if (tab() === 'cadastro') {
          <div class="card section">
            <h4 class="section-title">Dados do Cliente</h4>
            <div class="form-grid">
              <div class="field col-2">
                <label class="label">Razão Social</label>
                <input class="input" [(ngModel)]="edit.razaoSocial" placeholder="Razão Social"/>
              </div>
              <div class="field col-2">
                <label class="label">Nome Fantasia</label>
                <input class="input" [(ngModel)]="edit.nomeFantasia" placeholder="Opcional"/>
              </div>
              <div class="field">
                <label class="label">E-mail</label>
                <input class="input" [(ngModel)]="edit.email" type="email" placeholder="email@empresa.com" autocomplete="off"/>
              </div>
              <div class="field">
                <label class="label">Telefone</label>
                <input class="input" [(ngModel)]="edit.telefone" placeholder="(11) 99999-9999"/>
              </div>
              <div class="field">
                <label class="label">CEP</label>
                <input class="input" [(ngModel)]="edit.cep" (ngModelChange)="onCepChange($event)" placeholder="00000-000" maxlength="9"/>
                @if (buscandoCep()) { <span class="field-hint">Buscando endereço...</span> }
              </div>
              <div class="field col-2">
                <label class="label">Logradouro</label>
                <input class="input" [(ngModel)]="edit.logradouro" placeholder="Rua/Av."/>
              </div>
              <div class="field">
                <label class="label">Número</label>
                <input class="input" [(ngModel)]="edit.numero"/>
              </div>
              <div class="field">
                <label class="label">Complemento</label>
                <input class="input" [(ngModel)]="edit.complemento"/>
              </div>
              <div class="field">
                <label class="label">Bairro</label>
                <input class="input" [(ngModel)]="edit.bairro"/>
              </div>
              <div class="field">
                <label class="label">Cidade</label>
                <input class="input" [(ngModel)]="edit.cidade" placeholder="São Paulo"/>
              </div>
              <div class="field">
                <label class="label">UF</label>
                <input class="input" [(ngModel)]="edit.estado" placeholder="SP" maxlength="2"/>
              </div>
              <div class="field">
                <label class="label">Status</label>
                <select class="input" [(ngModel)]="edit.ativo">
                  <option [ngValue]="true">Ativo</option>
                  <option [ngValue]="false">Inativo</option>
                </select>
              </div>
            </div>
            @if (erroSave()) { <div class="alert-error">{{ erroSave() }}</div> }
            @if (sucessoSave()) { <div class="alert-ok">Salvo com sucesso!</div> }
            <div class="form-actions">
              <button class="btn-danger-ghost" (click)="confirmDelete()">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Excluir cliente
              </button>
              <button class="btn-primary" [disabled]="salvando()" (click)="salvarCadastro()">
                {{ salvando() ? 'Salvando...' : 'Salvar alterações' }}
              </button>
            </div>
          </div>
        }

        <!-- ── Fiscal ── -->
        @if (tab() === 'fiscal') {
          <div class="card section">
            <h4 class="section-title">Configuração Fiscal</h4>
            <div class="form-grid">
              <div class="field col-2">
                <label class="label">Regime Tributário</label>
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
              <div class="field">
                <label class="label">Série NF-e</label>
                <input class="input" [(ngModel)]="fiscal.serieNfe" placeholder="1"/>
              </div>
            </div>

            <!-- NF-e toggle: somente Admin -->
            @if (isAdmin()) {
              <div class="imap-header" style="margin-top:.5rem">
                <div>
                  <h4 class="section-title" style="margin-bottom:4px">Emissão de NF-e</h4>
                  <p class="section-desc" style="margin:0">Habilite para liberar a emissão de NF-e para este cliente.</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="fiscal.nfeHabilitado"/>
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                </label>
              </div>
            } @else {
              <div class="nfe-info">
                <span class="label">Status NF-e</span>
                <span class="badge" [class.badge-green]="cliente()!.nfeHabilitado" [class.badge-gray]="!cliente()!.nfeHabilitado">
                  {{ cliente()!.nfeHabilitado ? 'Habilitada' : 'Não habilitada' }}
                </span>
                <span class="field-hint">Apenas o administrador pode alterar.</span>
              </div>
            }

            @if (erroFiscal()) { <div class="alert-error">{{ erroFiscal() }}</div> }
            @if (sucessoFiscal()) { <div class="alert-ok">Configuração fiscal salva!</div> }
            <div class="form-actions">
              <span></span>
              <button class="btn-primary" [disabled]="salvandoFiscal()" (click)="salvarFiscal()">
                {{ salvandoFiscal() ? 'Salvando...' : 'Salvar configuração fiscal' }}
              </button>
            </div>
          </div>
        }

        <!-- ── Integração ── -->
        @if (tab() === 'integracao') {
          <div class="card section">
            <h4 class="section-title">API Key</h4>
            <p class="section-desc">Use esta chave no header <code>X-App-Key</code> para enviar documentos fiscais via API.</p>
            <div class="appkey-box">
              <code class="appkey-value">{{ cliente()!.appKey }}</code>
              <div class="appkey-actions">
                <button class="appkey-btn" (click)="copyAppKey()" [class.copied]="keyCopied()">
                  @if (keyCopied()) {
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Copiado
                  } @else {
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    Copiar
                  }
                </button>
                <button class="appkey-btn appkey-btn-warn" (click)="regenerarKey()" [disabled]="keyLoading()">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  {{ keyLoading() ? 'Gerando...' : 'Regenerar' }}
                </button>
              </div>
            </div>
            <p class="warn-text">Ao regenerar, a chave anterior deixará de funcionar imediatamente.</p>
            <div class="endpoint-info">
              <span class="method-badge">POST</span>
              <code class="endpoint-path">/api/v1/ingest/xml</code>
              <span class="endpoint-sub">Header: <code>X-App-Key: &lt;sua-chave&gt;</code></span>
            </div>
          </div>

          <div class="card section">
            <h4 class="section-title">Como integrar</h4>
            <p class="section-desc">
              O ERP ou emissor de nota do cliente envia o XML no corpo (body) da requisição, sem precisar de login —
              só a AppKey acima. Um XML por chamada.
            </p>

            <div class="docs-field">
              <span class="docs-label">Parâmetros</span>
              <div class="table-scroll">
              <table class="docs-table">
                <tbody>
                  <tr>
                    <td><code>X-App-Key</code></td>
                    <td>header, obrigatório</td>
                    <td>A chave deste cliente (acima).</td>
                  </tr>
                  <tr>
                    <td><code>tipo</code></td>
                    <td>query string, obrigatório</td>
                    <td><code>NFe</code>, <code>CTe</code>, <code>MDFe</code> ou <code>NFSe</code></td>
                  </tr>
                  <tr>
                    <td><code>X-File-Name</code></td>
                    <td>header, opcional</td>
                    <td>Nome do arquivo original (usado no registro). Se omitido, é gerado um nome automático.</td>
                  </tr>
                  <tr>
                    <td>body</td>
                    <td>obrigatório</td>
                    <td>O conteúdo do XML, sem encoding (não é multipart nem base64).</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

            <div class="docs-field">
              <span class="docs-label">Exemplo (curl)</span>
              <pre class="docs-code">{{ curlExemplo() }}</pre>
            </div>

            <div class="docs-field">
              <span class="docs-label">Resposta — 200 OK</span>
              <pre class="docs-code">{{ '{'
              }}
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "clienteId": "{{ cliente()!.id }}",
  "tipo": 1,
  "tipoNome": "NFe",
  "status": 1,
  "statusNome": "Valido",
  "origemImportacao": "ApiIngest",
  "numero": "1234",
  "chaveAcesso": "35260112345678000199550010000012341234567890",
  "cnpjEmitente": "12345678000199",
  "nomeEmitente": "Fornecedor Exemplo LTDA",
  "valorTotal": 1500.00,
  "dataEmissao": "2026-08-01T12:00:00Z"
{{ '}' }}</pre>
            </div>

            <div class="docs-field">
              <span class="docs-label">Erros comuns</span>
              <div class="table-scroll">
              <table class="docs-table">
                <tbody>
                  <tr><td><code>401</code></td><td>AppKey ausente, inválida ou cliente inativo.</td></tr>
                  <tr><td><code>400 EMPTY_BODY</code></td><td>Nenhum conteúdo enviado no body.</td></tr>
                  <tr><td><code>400 VALIDATION_ERROR</code></td><td>Arquivo maior que 50&nbsp;MB ou content-type não suportado.</td></tr>
                  <tr><td><code>200</code> com <code>statusNome: "Duplicado"</code></td><td>XML com a mesma chave de acesso já foi importado antes — não é erro, é idempotência.</td></tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <div class="card section">
            <div class="imap-header">
              <div>
                <h4 class="section-title" style="margin-bottom:4px">Webhook de Documentos</h4>
                <p class="section-desc" style="margin:0">Quando habilitado, o sistema envia um POST ao URL configurado sempre que um novo documento for recebido.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="webhook.habilitado"/>
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </label>
            </div>
            @if (webhook.habilitado) {
              <div class="form-grid" style="margin-top:1rem">
                <div class="field col-2">
                  <label class="label">URL do Webhook</label>
                  <input class="input" [(ngModel)]="webhook.url" type="url" placeholder="https://meu-sistema.com/webhook"/>
                </div>
              </div>
            }
            @if (erroWebhook()) { <div class="alert-error" style="margin-top:.75rem">{{ erroWebhook() }}</div> }
            @if (sucessoWebhook()) { <div class="alert-ok" style="margin-top:.75rem">Webhook salvo!</div> }
            <div class="form-actions" style="margin-top:1rem">
              <span></span>
              <button class="btn-primary" [disabled]="salvandoWebhook()" (click)="salvarWebhook()">
                {{ salvandoWebhook() ? 'Salvando...' : 'Salvar Webhook' }}
              </button>
            </div>
          </div>

          <div class="card section">
            <div class="imap-header">
              <div>
                <h4 class="section-title" style="margin-bottom:4px">Importação de XML por E-mail</h4>
                <p class="section-desc" style="margin:0">Quando habilitado, o sistema lê a caixa de entrada configurada a cada 5 minutos e importa anexos XML automaticamente.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="imap.habilitado"/>
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </label>
            </div>
            @if (imap.habilitado) {
              <div class="form-grid" style="margin-top:1rem">
                <div class="field col-2" style="grid-column:span 1">
                  <label class="label">Host IMAP</label>
                  <input class="input" [(ngModel)]="imap.host" placeholder="imap.gmail.com"/>
                </div>
                <div class="field" style="max-width:140px">
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

              <div class="imap-log">
                <div class="imap-log-header">
                  <span class="label">Última execução do robô</span>
                  <button type="button" class="btn-ghost btn-sm" [disabled]="logImapLoading()" (click)="carregarLogImap(cliente()!.id)">
                    {{ logImapLoading() ? 'Atualizando...' : 'Atualizar' }}
                  </button>
                </div>
                @if (logImapLoading()) {
                  <p class="section-desc">Carregando...</p>
                } @else if (!logImapExecutadoEm()) {
                  <p class="section-desc">O robô de importação ainda não executou.</p>
                } @else if (!logImap()) {
                  <p class="section-desc">Última execução em {{ logImapExecutadoEm() | date:'dd/MM/yyyy HH:mm' }} — este cliente ainda não foi processado nela (deve entrar na próxima passada).</p>
                } @else {
                  <p class="section-desc">Última execução em {{ logImapExecutadoEm() | date:'dd/MM/yyyy HH:mm' }}</p>
                  <div class="imap-log-grid">
                    <span>{{ logImap()!.emailsEncontrados }} e-mail(s) encontrado(s)</span>
                    <span>{{ logImap()!.xmlsProcessados }} XML(s) processado(s)</span>
                    <span>{{ logImap()!.xmlsImportados }} importado(s)</span>
                    <span [class.red-text]="logImap()!.erros > 0">{{ logImap()!.erros }} erro(s)</span>
                  </div>
                  @if (logImap()!.mensagemErro) {
                    <p class="alert-error" style="margin-top:.5rem">{{ logImap()!.mensagemErro }}</p>
                  }
                }
              </div>
            }
            @if (erroImap()) { <div class="alert-error" style="margin-top:.75rem">{{ erroImap() }}</div> }
            @if (sucessoImap()) { <div class="alert-ok" style="margin-top:.75rem">Configuração salva!</div> }
            <div class="form-actions" style="margin-top:1rem">
              <span></span>
              <button class="btn-primary" [disabled]="salvandoImap()" (click)="salvarImap()">
                {{ salvandoImap() ? 'Salvando...' : 'Salvar configuração IMAP' }}
              </button>
            </div>
          </div>

          <div class="card section">
            <h4 class="section-title">Portal do Cliente</h4>
            <p class="section-desc">Crie uma conta de acesso para que o cliente possa visualizar seus documentos diretamente no portal.</p>

            @if (!contaCriada()) {
              <div class="form-grid" style="margin-top:.25rem">
                <div class="field col-2">
                  <label class="label">Nome</label>
                  <input class="input" [(ngModel)]="conta.nome" placeholder="Nome do responsável"/>
                </div>
                <div class="field col-2">
                  <label class="label">E-mail de acesso</label>
                  <input class="input" [(ngModel)]="conta.email" type="email" placeholder="responsavel@empresa.com" autocomplete="off"/>
                </div>
              </div>
              <p class="section-desc" style="margin-top:.5rem">Um e-mail será enviado pra esse endereço com um link pra definir a senha de acesso.</p>
              @if (erroConta()) { <div class="alert-error" style="margin-top:.5rem">{{ erroConta() }}</div> }
              <div class="form-actions">
                <span></span>
                <button class="btn-primary" [disabled]="criandoConta()" (click)="criarConta()">
                  {{ criandoConta() ? 'Criando...' : 'Criar conta de acesso' }}
                </button>
              </div>
            } @else {
              <div class="alert-ok">
                Conta criada! E-mail: <strong>{{ contaCriada()!.email }}</strong>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .loading-state { text-align: center; color: var(--text2); padding: 4rem; font-size: 14px; }
    .page { display: flex; flex-direction: column; gap: 1.25rem; }

    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; margin-bottom: .25rem; }
    .back-btn:hover { color: var(--accent); }
    .profile-header { display: flex; flex-direction: column; gap: .5rem; }
    .profile-top { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .profile-info { display: flex; align-items: center; gap: 1rem; }
    .profile-avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--accent-dim); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--accent); flex-shrink: 0; text-transform: uppercase; }
    .profile-name { font-size: 1.25rem; font-weight: 700; color: var(--text); }
    .profile-sub { font-size: 13px; color: var(--text2); margin-top: 2px; }
    .profile-meta { display: flex; align-items: center; gap: .5rem; margin-top: 4px; flex-wrap: wrap; }
    .mono { font-family: monospace; font-size: 12px; color: var(--text2); }

    /* Modules */
    .modules-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    @media (max-width: 600px) { .modules-row { grid-template-columns: 1fr; } }
    .module-card {
      display: flex; align-items: center; gap: .875rem;
      background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 1rem 1.25rem; text-decoration: none; color: var(--text);
      transition: border-color 150ms, background 150ms; cursor: pointer;
    }
    .module-card:hover { border-color: var(--accent); background: var(--bg3); }
    .module-card svg:first-child { color: var(--accent); flex-shrink: 0; }
    .module-card > div { flex: 1; }
    .module-title { font-size: 14px; font-weight: 600; color: var(--text); }
    .module-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }
    .module-arrow { color: var(--text2); flex-shrink: 0; }
    .module-disabled { opacity: .5; pointer-events: none; }
    .module-disabled svg:first-child { color: var(--text2); }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: oklch(0.62 0.17 254 / .12); color: var(--accent); }
    .badge-red { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-gray { background: rgba(124,130,153,.12); color: var(--text2); }

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0 0 .25rem; font-size: .95rem; font-weight: 600; color: var(--text); }
    .section-desc { margin: 0; font-size: 13px; color: var(--text2); line-height: 1.5; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; }
    .input:focus { border-color: var(--accent); }
    select.input { cursor: pointer; }
    .field-hint { font-size: 11px; color: var(--text2); }

    .form-actions { display: flex; align-items: center; justify-content: space-between; padding-top: .75rem; border-top: 1px solid var(--border); }

    .nfe-info { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; padding: .75rem 0; }

    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { background: oklch(0.62 0.17 254 / .1); border: 1px solid oklch(0.62 0.17 254 / .3); color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-danger-ghost { display: inline-flex; align-items: center; gap: 6px; background: transparent; color: var(--red); border: 1px solid rgba(255,77,109,.3); border-radius: 8px; padding: .45rem .875rem; font-size: 13px; cursor: pointer; }
    .btn-danger-ghost:hover { background: rgba(255,77,109,.08); border-color: var(--red); }

    .appkey-box { display: flex; align-items: center; gap: 8px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
    .appkey-value { font-family: monospace; font-size: 13px; color: var(--accent); flex: 1; word-break: break-all; }
    .appkey-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .appkey-btn { display: inline-flex; align-items: center; gap: 5px; background: var(--bg2); border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; white-space: nowrap; }
    .appkey-btn:hover { color: var(--accent); border-color: var(--accent); }
    .appkey-btn.copied { color: var(--accent); border-color: var(--accent); }
    .appkey-btn-warn:hover { color: var(--yellow); border-color: var(--yellow); }
    .appkey-btn:disabled { opacity: .5; cursor: not-allowed; }
    .warn-text { margin: 0; font-size: 11px; color: var(--yellow); background: rgba(255,209,102,.07); border: 1px solid rgba(255,209,102,.2); border-radius: 6px; padding: 6px 10px; }
    .endpoint-info { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--text2); flex-wrap: wrap; }
    .method-badge { background: rgba(0,102,255,.15); color: #4d94ff; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 700; }
    .endpoint-path { font-family: monospace; font-size: 12px; color: var(--text); }
    .endpoint-sub { color: var(--text2); font-size: 11px; }
    .imap-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .imap-log { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .imap-log-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .375rem; }
    .imap-log-grid { display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; font-size: 13px; color: var(--text); margin-top: .375rem; }
    .imap-log-grid .red-text { color: var(--red); font-weight: 600; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
    .btn-sm { padding: .3rem .7rem; font-size: 12px; }
    .toggle { display: inline-flex; cursor: pointer; flex-shrink: 0; }
    .toggle input { display: none; }
    .toggle-track { width: 40px; height: 22px; background: var(--bg3); border: 1px solid var(--border); border-radius: 999px; position: relative; transition: background 200ms, border-color 200ms; }
    .toggle input:checked + .toggle-track { background: var(--accent); border-color: var(--accent); }
    .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: var(--text2); border-radius: 50%; transition: transform 200ms, background 200ms; }
    .toggle input:checked + .toggle-track .toggle-thumb { transform: translateX(18px); background: #0d0f14; }

    .docs-field { margin-bottom: 1rem; }
    .docs-field:last-child { margin-bottom: 0; }
    .docs-label { display: block; font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .03em; margin-bottom: 6px; }
    .docs-code { margin: 0; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: .75rem; font-size: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-word; color: var(--text); overflow-x: auto; }
    .docs-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .docs-table td { padding: 6px 10px 6px 0; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: top; }
    .docs-table tr:last-child td { border-bottom: none; }
    .docs-table code { color: var(--accent); font-size: 12px; }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .docs-table { min-width: 480px; }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .col-2 { grid-column: span 1; }
      .profile-top { flex-direction: column; align-items: stretch; }
      .form-actions { flex-direction: column-reverse; align-items: stretch; gap: .5rem; }
      .imap-header, .imap-log-header { flex-direction: column; align-items: stretch; }
      .appkey-box { flex-direction: column; align-items: stretch; }
      .appkey-actions { justify-content: flex-end; }
      .endpoint-info { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class ClienteDetailComponent implements OnInit {
  private readonly _svc    = inject(ClienteService);
  private readonly _auth   = inject(AuthService);
  private readonly _route  = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _config = inject(ConfiguracaoService);
  private readonly _cepSvc = inject(CepService);
  readonly buscandoCep = signal(false);

  readonly isAdmin = computed(() => this._auth.currentUser()?.perfil === 'Administrador');

  readonly curlExemplo = computed(() => {
    const c = this.cliente();
    const appKey = c?.appKey ?? '<sua-appkey>';
    return `curl -X POST "${location.origin}/api/v1/ingest/xml?tipo=NFe" \\
  -H "X-App-Key: ${appKey}" \\
  -H "X-File-Name: nfe-35260112345678000199550010000012341234567890.xml" \\
  -H "Content-Type: application/xml" \\
  --data-binary @nota.xml`;
  });

  readonly cliente      = signal<ClienteDto | null>(null);
  readonly loading      = signal(true);
  readonly tab          = signal<Tab>('cadastro');

  readonly salvando     = signal(false);
  readonly erroSave     = signal<string | null>(null);
  readonly sucessoSave  = signal(false);

  readonly keyLoading   = signal(false);
  readonly keyCopied    = signal(false);

  readonly salvandoImap   = signal(false);
  readonly erroImap       = signal<string | null>(null);
  readonly sucessoImap    = signal(false);

  readonly logImapLoading = signal(false);
  readonly logImapExecutadoEm = signal<string | null>(null);
  readonly logImap        = signal<ImportacaoXmlClienteStatusDto | null>(null);

  readonly salvandoWebhook = signal(false);
  readonly erroWebhook     = signal<string | null>(null);
  readonly sucessoWebhook  = signal(false);

  readonly criandoConta  = signal(false);
  readonly erroConta     = signal<string | null>(null);
  readonly contaCriada   = signal<CriarContaClienteResponse | null>(null);

  readonly salvandoFiscal = signal(false);
  readonly erroFiscal     = signal<string | null>(null);
  readonly sucessoFiscal  = signal(false);

  edit    = {
    razaoSocial: '', nomeFantasia: '', email: '', telefone: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', codigoIbgeCidade: '',
    cidade: '', estado: '', ativo: true,
  };
  fiscal  = { regimeTributario: '', inscricaoEstadual: '', inscricaoMunicipal: '', cnaePrincipal: '', serieNfe: '1', nfeHabilitado: false };
  imap    = { habilitado: false, host: '', port: 993, email: '', senha: '' };
  webhook = { habilitado: false, url: '' };
  conta   = { nome: '', email: '' };

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._svc.getById(id).subscribe({
      next: c => {
        this.cliente.set(c);
        this._syncEdit(c);
        this._syncFiscal(c);
        this._syncImap(c);
        this._syncWebhook(c);
        this.loading.set(false);
        if (c.imapHabilitado) this.carregarLogImap(c.id);
      },
      error: () => this.loading.set(false),
    });
  }

  carregarLogImap(clienteId: string): void {
    this.logImapLoading.set(true);
    this._config.getImportacaoXmlStatus().subscribe({
      next: status => {
        this.logImapLoading.set(false);
        this.logImapExecutadoEm.set(status?.executadoEm ?? null);
        this.logImap.set(status?.clientes.find(c => c.clienteId === clienteId) ?? null);
      },
      error: () => this.logImapLoading.set(false),
    });
  }

  private _syncEdit(c: ClienteDto): void {
    this.edit = {
      razaoSocial: c.razaoSocial, nomeFantasia: c.nomeFantasia ?? '', email: c.email ?? '', telefone: c.telefone ?? '',
      cep: c.cep ?? '', logradouro: c.logradouro ?? '', numero: c.numero ?? '', complemento: c.complemento ?? '',
      bairro: c.bairro ?? '', codigoIbgeCidade: c.codigoIbgeCidade ?? '',
      cidade: c.cidade ?? '', estado: c.estado ?? '', ativo: c.ativo,
    };
  }

  onCepChange(valor: string): void {
    const digitos = (valor || '').replace(/\D/g, '');
    if (digitos.length !== 8) return;

    this.buscandoCep.set(true);
    this._cepSvc.buscar(digitos).subscribe(r => {
      this.buscandoCep.set(false);
      if (!r) return;
      this.edit.logradouro = r.logradouro || this.edit.logradouro;
      this.edit.bairro = r.bairro || this.edit.bairro;
      this.edit.complemento = r.complemento || this.edit.complemento;
      this.edit.cidade = r.localidade || this.edit.cidade;
      this.edit.estado = r.uf || this.edit.estado;
      this.edit.codigoIbgeCidade = r.ibge || this.edit.codigoIbgeCidade;
    });
  }

  private _syncFiscal(c: ClienteDto): void {
    this.fiscal = { regimeTributario: c.regimeTributario ?? '', inscricaoEstadual: c.inscricaoEstadual ?? '', inscricaoMunicipal: c.inscricaoMunicipal ?? '', cnaePrincipal: c.cnaePrincipal ?? '', serieNfe: c.serieNfe ?? '1', nfeHabilitado: c.nfeHabilitado ?? false };
  }

  private _syncImap(c: ClienteDto): void {
    this.imap = { habilitado: c.imapHabilitado, host: c.imapHost ?? '', port: c.imapPort || 993, email: c.imapEmail ?? '', senha: '' };
  }

  private _syncWebhook(c: ClienteDto): void {
    this.webhook = { habilitado: c.webhookHabilitado, url: c.webhookUrl ?? '' };
  }

  initials(): string {
    const c = this.cliente();
    if (!c) return '';
    return c.razaoSocial.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  formatCnpj(cnpj: string): string {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  goBack(): void { this._router.navigate(['/clientes']); }

  salvarCadastro(): void {
    const c = this.cliente();
    if (!c || this.salvando()) return;
    this.salvando.set(true);
    this.erroSave.set(null);
    this.sucessoSave.set(false);
    this._svc.update(c.id, {
      id: c.id, razaoSocial: this.edit.razaoSocial, nomeFantasia: this.edit.nomeFantasia || undefined,
      email: this.edit.email || undefined, telefone: this.edit.telefone || undefined,
      cep: this.edit.cep || undefined, logradouro: this.edit.logradouro || undefined,
      numero: this.edit.numero || undefined, complemento: this.edit.complemento || undefined,
      bairro: this.edit.bairro || undefined, codigoIbgeCidade: this.edit.codigoIbgeCidade || undefined,
      cidade: this.edit.cidade || undefined, estado: this.edit.estado || undefined, ativo: this.edit.ativo,
    }).subscribe({
      next: updated => { this.cliente.set(updated); this._syncEdit(updated); this.salvando.set(false); this.sucessoSave.set(true); setTimeout(() => this.sucessoSave.set(false), 3000); },
      error: err => { this.salvando.set(false); this.erroSave.set(extractErrorMessage(err, 'Erro ao salvar.')); },
    });
  }

  confirmDelete(): void {
    const c = this.cliente();
    if (!c || !confirm(`Excluir "${c.razaoSocial}"? Esta ação não pode ser desfeita.`)) return;
    this._svc.delete(c.id).subscribe({ next: () => this._router.navigate(['/clientes']) });
  }

  salvarFiscal(): void {
    const c = this.cliente();
    if (!c || this.salvandoFiscal()) return;
    this.salvandoFiscal.set(true);
    this.erroFiscal.set(null);
    this.sucessoFiscal.set(false);
    this._svc.updateFiscal(c.id, {
      regimeTributario: this.fiscal.regimeTributario || undefined,
      inscricaoEstadual: this.fiscal.inscricaoEstadual || undefined,
      inscricaoMunicipal: this.fiscal.inscricaoMunicipal || undefined,
      cnaePrincipal: this.fiscal.cnaePrincipal || undefined,
      serieNfe: this.fiscal.serieNfe || '1',
      nfeHabilitado: this.isAdmin() ? this.fiscal.nfeHabilitado : (c.nfeHabilitado ?? false),
    }).subscribe({
      next: updated => {
        this.cliente.set(updated);
        this._syncFiscal(updated);
        this.salvandoFiscal.set(false);
        this.sucessoFiscal.set(true);
        setTimeout(() => this.sucessoFiscal.set(false), 3000);
      },
      error: err => { this.salvandoFiscal.set(false); this.erroFiscal.set(extractErrorMessage(err, 'Erro ao salvar.')); },
    });
  }

  copyAppKey(): void {
    const key = this.cliente()?.appKey;
    if (!key) return;
    navigator.clipboard.writeText(key).then(() => { this.keyCopied.set(true); setTimeout(() => this.keyCopied.set(false), 2000); });
  }

  regenerarKey(): void {
    const c = this.cliente();
    if (!c || !confirm('A chave atual deixará de funcionar. Confirmar?')) return;
    this.keyLoading.set(true);
    this._svc.regenerarAppKey(c.id).subscribe({
      next: res => { this.cliente.update(cur => cur ? { ...cur, appKey: res.appKey } : cur); this.keyLoading.set(false); },
      error: () => this.keyLoading.set(false),
    });
  }

  salvarImap(): void {
    const c = this.cliente();
    if (!c || this.salvandoImap()) return;
    this.salvandoImap.set(true);
    this.erroImap.set(null);
    this.sucessoImap.set(false);
    this._svc.configurarImap(c.id, { habilitado: this.imap.habilitado, host: this.imap.host || undefined, port: this.imap.port || 993, email: this.imap.email || undefined, senha: this.imap.senha || undefined }).subscribe({
      next: updated => { this.cliente.set(updated); this._syncImap(updated); this.salvandoImap.set(false); this.sucessoImap.set(true); setTimeout(() => this.sucessoImap.set(false), 3000); },
      error: err => { this.salvandoImap.set(false); this.erroImap.set(extractErrorMessage(err, 'Erro ao salvar.')); },
    });
  }

  salvarWebhook(): void {
    const c = this.cliente();
    if (!c || this.salvandoWebhook()) return;
    this.salvandoWebhook.set(true);
    this.erroWebhook.set(null);
    this.sucessoWebhook.set(false);
    this._svc.configurarWebhook(c.id, { habilitado: this.webhook.habilitado, url: this.webhook.url || undefined }).subscribe({
      next: updated => { this.cliente.set(updated); this._syncWebhook(updated); this.salvandoWebhook.set(false); this.sucessoWebhook.set(true); setTimeout(() => this.sucessoWebhook.set(false), 3000); },
      error: err => { this.salvandoWebhook.set(false); this.erroWebhook.set(extractErrorMessage(err, 'Erro ao salvar.')); },
    });
  }

  criarConta(): void {
    const c = this.cliente();
    if (!c || this.criandoConta()) return;
    if (!this.conta.nome || !this.conta.email) {
      this.erroConta.set('Preencha nome e e-mail.');
      return;
    }
    this.criandoConta.set(true);
    this.erroConta.set(null);
    this._svc.criarConta(c.id, { nome: this.conta.nome, email: this.conta.email }).subscribe({
      next: res => { this.contaCriada.set(res); this.criandoConta.set(false); },
      error: err => { this.criandoConta.set(false); this.erroConta.set(extractErrorMessage(err, 'Erro ao criar conta. Verifique se o e-mail já está em uso.')); },
    });
  }
}
