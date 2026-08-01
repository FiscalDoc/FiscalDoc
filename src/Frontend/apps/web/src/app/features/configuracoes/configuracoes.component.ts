import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, ConfiguracaoService, extractErrorMessage } from '@veloxml/services';
import { ImportacaoXmlLogDto, ImportacaoXmlLogsResumoDto, PagedResult } from '@veloxml/models';

type Tab = 'email' | 'social' | 'convite' | 'importacao' | 'storage';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
<div class="page">

  <!-- ── Header ── -->
  <header class="page-header">
    <div>
      <h2 class="font-heading">Configurações</h2>
      <p class="page-sub">Configurações globais do sistema</p>
    </div>
  </header>

  <nav class="tabs">
    <button class="tab-btn" [class.active]="tab() === 'email'" (click)="tab.set('email')">E-mail (SMTP)</button>
    <button class="tab-btn" [class.active]="tab() === 'social'" (click)="tab.set('social')">Redes Sociais</button>
    <button class="tab-btn" [class.active]="tab() === 'convite'" (click)="tab.set('convite')">Convidar</button>
    <button class="tab-btn" [class.active]="tab() === 'importacao'" (click)="tab.set('importacao'); carregarIntervalo(); carregarHistorico()">Importação de E-mails</button>
    <button class="tab-btn" [class.active]="tab() === 'storage'" (click)="tab.set('storage')">Armazenamento</button>
  </nav>

  <!-- ══ E-MAIL (SMTP) ══ -->
  @if (tab() === 'email') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Configuração de E-mail (SMTP)</div>
          <div class="section-sub">Utilizado em todos os envios de e-mail do sistema, incluindo os e-mails de boas-vindas</div>
        </div>
      </div>

      @if (loadingSmtp()) {
        <div class="empty-state">Carregando configurações...</div>
      } @else {
        <form [formGroup]="smtpForm" (ngSubmit)="saveSmtp()" class="settings-form">

          <div class="form-row">
            <div class="field">
              <label class="label">Servidor SMTP *</label>
              <input class="input" type="text" formControlName="host" placeholder="smtp.exemplo.com.br" />
              @if (f['host'].touched && f['host'].errors?.['required']) {
                <span class="field-error">Obrigatório</span>
              }
            </div>
            <div class="field field-sm">
              <label class="label">Porta *</label>
              <input class="input" type="number" formControlName="port" placeholder="587" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="label">E-mail remetente *</label>
              <input class="input" type="email" formControlName="from" placeholder="noreply@suaempresa.com.br" autocomplete="off" />
              @if (f['from'].touched && f['from'].errors?.['email']) {
                <span class="field-error">E-mail inválido</span>
              }
            </div>
            <div class="field">
              <label class="label">Nome remetente *</label>
              <input class="input" type="text" formControlName="fromName" placeholder="FiscalDoc" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="label">Usuário SMTP</label>
              <input class="input" type="text" formControlName="username" placeholder="usuario@smtp" />
            </div>
            <div class="field">
              <label class="label">Senha SMTP</label>
              <input class="input" type="password" formControlName="password" placeholder="Deixe em branco para não alterar" autocomplete="new-password" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="label">Reply-To</label>
              <input class="input" type="email" formControlName="replyTo" placeholder="suporte@suaempresa.com.br" autocomplete="off" />
            </div>
            <div class="field field-center">
              <label class="label">Segurança</label>
              <label class="checkbox-label">
                <input type="checkbox" formControlName="enableSsl" />
                Usar SSL/TLS
              </label>
            </div>
          </div>

          @if (smtpSuccess()) { <div class="alert-success">{{ checkIcon() }} Configurações salvas com sucesso!</div> }
          @if (smtpError()) { <div class="alert-error">{{ smtpError() }}</div> }

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="savingSmtp()">
              {{ savingSmtp() ? 'Salvando...' : 'Salvar Configurações' }}
            </button>
          </div>

        </form>

        <div class="test-block">
          <div class="test-block-title">Testar esta configuração</div>
          <p class="test-block-sub">Envia um e-mail de teste usando os dados preenchidos acima (não precisa salvar antes) para confirmar que o SMTP está funcionando.</p>
          <div class="test-row">
            <input class="input" type="email" [(ngModel)]="testEmailDestino" [ngModelOptions]="{standalone: true}" placeholder="seu-email@exemplo.com.br"/>
            <button type="button" class="btn-ghost" [disabled]="testingSmtp()" (click)="testSmtp()">
              {{ testingSmtp() ? 'Enviando...' : 'Enviar Teste' }}
            </button>
          </div>
          @if (smtpTestSuccess()) { <div class="alert-success">{{ checkIcon() }} E-mail de teste enviado! Confira a caixa de entrada (e o spam).</div> }
          @if (smtpTestError()) { <div class="alert-error">{{ smtpTestError() }}</div> }
        </div>
      }
    </div>
  }

  <!-- ══ REDES SOCIAIS ══ -->
  @if (tab() === 'social') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342a4 4 0 000 5.316m0-5.316a4 4 0 010-5.316m0 5.316L15.316 17m-6.632-8.658L15.316 5m0 8.342a4 4 0 100 5.316 4 4 0 000-5.316zm0-8.342a4 4 0 100 5.316 4 4 0 000-5.316z"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Redes Sociais</div>
          <div class="section-sub">Exibidas no rodapé do site — só aparecem os links preenchidos aqui</div>
        </div>
      </div>

      @if (loadingSocial()) {
        <div class="empty-state">Carregando configurações...</div>
      } @else {
        <form [formGroup]="socialForm" (ngSubmit)="saveSocial()" class="settings-form">
          <div class="form-row">
            <div class="field">
              <label class="label">Instagram</label>
              <input class="input" type="url" formControlName="instagram" placeholder="https://instagram.com/fiscaldoc" />
            </div>
            <div class="field">
              <label class="label">Facebook</label>
              <input class="input" type="url" formControlName="facebook" placeholder="https://facebook.com/fiscaldoc" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="label">LinkedIn</label>
              <input class="input" type="url" formControlName="linkedin" placeholder="https://linkedin.com/company/fiscaldoc" />
            </div>
            <div class="field">
              <label class="label">TikTok</label>
              <input class="input" type="url" formControlName="tiktok" placeholder="https://tiktok.com/@fiscaldoc" />
            </div>
          </div>

          @if (socialSuccess()) { <div class="alert-success">{{ checkIcon() }} Redes sociais salvas com sucesso!</div> }
          @if (socialError()) { <div class="alert-error">{{ socialError() }}</div> }

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="savingSocial()">
              {{ savingSocial() ? 'Salvando...' : 'Salvar Redes Sociais' }}
            </button>
          </div>
        </form>
      }
    </div>
  }

  <!-- ══ CONVIDAR ══ -->
  @if (tab() === 'convite') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Convidar para a Plataforma</div>
          <div class="section-sub">Envia um e-mail com o link do teste grátis de 30 dias</div>
        </div>
      </div>

      <form [formGroup]="conviteForm" (ngSubmit)="sendConvite()" class="settings-form">
        <div class="form-row">
          <div class="field">
            <label class="label">Nome do convidado *</label>
            <input class="input" type="text" formControlName="nome" placeholder="João Silva" />
            @if (cf['nome'].touched && cf['nome'].errors?.['required']) {
              <span class="field-error">Obrigatório</span>
            }
          </div>
          <div class="field">
            <label class="label">E-mail *</label>
            <input class="input" type="email" formControlName="email" placeholder="joao@escritorio.com.br" autocomplete="off" />
            @if (cf['email'].touched && cf['email'].errors) {
              <span class="field-error">E-mail inválido</span>
            }
          </div>
        </div>

        @if (conviteSuccess()) { <div class="alert-success">{{ checkIcon() }} Convite enviado com sucesso!</div> }
        @if (conviteError()) { <div class="alert-error">{{ conviteError() }}</div> }

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="sendingConvite()">
            {{ sendingConvite() ? 'Enviando...' : 'Enviar Convite' }}
          </button>
        </div>
      </form>
    </div>
  }

  <!-- ══ IMPORTAÇÃO DE E-MAILS ══ -->
  @if (tab() === 'importacao') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Importação de E-mails (XML)</div>
          <div class="section-sub">Histórico do robô que lê os e-mails de cada cliente — clique numa linha pra ver a mensagem completa</div>
        </div>
      </div>

      <div class="settings-form">
        <div class="intervalo-row">
          <div class="field field-sm">
            <label class="label">Intervalo de execução (minutos)</label>
            <input class="input" type="number" min="1" max="1440" [(ngModel)]="intervaloMinutos"/>
          </div>
          <button type="button" class="btn-ghost" [disabled]="salvandoIntervalo()" (click)="salvarIntervalo()">
            {{ salvandoIntervalo() ? 'Salvando...' : 'Salvar Intervalo' }}
          </button>
        </div>
        @if (intervaloSucesso()) { <div class="alert-success">{{ checkIcon() }} Intervalo atualizado para {{ intervaloMinutos }} minuto(s) — já aplicado, sem precisar reiniciar.</div> }
        @if (intervaloErro()) { <div class="alert-error">{{ intervaloErro() }}</div> }

        @if (forcarSucesso()) { <div class="alert-success">{{ checkIcon() }} Importação disparada! A tabela abaixo deve atualizar em alguns segundos — clique em "Atualizar".</div> }
        @if (forcarErro()) { <div class="alert-error">{{ forcarErro() }}</div> }

        @if (resumo(); as r) {
          <div class="status-summary">
            <div class="status-grid status-grid-3">
              <div class="status-item">
                <span class="status-item-value">{{ r.ultimaExecucaoEm ? (r.ultimaExecucaoEm | date:'dd/MM/yyyy HH:mm:ss') : '—' }}</span>
                <span class="status-item-label">Última execução</span>
              </div>
              <div class="status-item">
                <span class="status-item-value">{{ r.totalExecucoes }}</span>
                <span class="status-item-label">Execuções registradas</span>
              </div>
              <div class="status-item">
                <span class="status-item-value" [class.red]="r.totalErros > 0">{{ r.totalErros }}</span>
                <span class="status-item-label">Total de erros (independente do cliente)</span>
              </div>
            </div>
          </div>
        }

        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="carregarHistorico(1)">Atualizar</button>
          <button type="button" class="btn-primary" [disabled]="forcando()" (click)="forcarImportacao()">
            {{ forcando() ? 'Disparando...' : 'Forçar Importação Agora' }}
          </button>
        </div>

        @if (loadingHistorico()) {
          <div class="empty-state">Carregando...</div>
        } @else if (historico().items.length === 0) {
          <div class="empty-state">Nenhuma execução registrada ainda.</div>
        } @else {
          <table class="clientes-table historico-table">
            <thead>
              <tr>
                <th class="col-data">Data/Hora</th>
                <th class="col-cliente">Cliente</th>
                <th class="col-num">E-mails</th>
                <th class="col-num">XMLs</th>
                <th class="col-num">Importados</th>
                <th class="col-num">Erros</th>
                <th class="col-msg">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              @for (l of historico().items; track l.id) {
                <tr class="historico-row" (click)="abrirDetalheLog(l)">
                  <td class="col-data">{{ l.executadoEm | date:'dd/MM/yy HH:mm' }}</td>
                  <td class="col-cliente">{{ l.clienteNome }}</td>
                  <td class="col-num">{{ l.emailsEncontrados }}</td>
                  <td class="col-num">{{ l.xmlsProcessados }}</td>
                  <td class="col-num">{{ l.xmlsImportados }}</td>
                  <td class="col-num" [class.red-text]="l.erros > 0">{{ l.erros }}</td>
                  <td class="col-msg"><span class="mensagem-erro-preview" [class.msg-erro]="!!l.mensagemErro">{{ mensagemStatus(l) }}</span></td>
                </tr>
              }
            </tbody>
          </table>
          <div class="pagination-row">
            <button type="button" class="btn-ghost" [disabled]="historico().page <= 1" (click)="carregarHistorico(historico().page - 1)">Anterior</button>
            <span class="pagination-info">Página {{ historico().page }} de {{ historico().totalPages || 1 }} ({{ historico().totalCount }} execuções)</span>
            <button type="button" class="btn-ghost" [disabled]="historico().page >= historico().totalPages" (click)="carregarHistorico(historico().page + 1)">Próxima</button>
          </div>
        }
      </div>
    </div>

    @if (logDetalhe(); as l) {
      <div class="overlay" (click)="fecharDetalheLog()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title">{{ l.clienteNome }}</h3>
            <button class="modal-close" (click)="fecharDetalheLog()">✕</button>
          </header>
          <div class="modal-body">
            <div class="status-grid">
              <div class="status-item">
                <span class="status-item-value">{{ l.emailsEncontrados }}</span>
                <span class="status-item-label">E-mails encontrados</span>
              </div>
              <div class="status-item">
                <span class="status-item-value">{{ l.xmlsProcessados }}</span>
                <span class="status-item-label">XMLs processados</span>
              </div>
              <div class="status-item">
                <span class="status-item-value accent">{{ l.xmlsImportados }}</span>
                <span class="status-item-label">XMLs importados</span>
              </div>
              <div class="status-item">
                <span class="status-item-value" [class.red]="l.erros > 0">{{ l.erros }}</span>
                <span class="status-item-label">Erros</span>
              </div>
            </div>
            <p class="status-kpi-label">Executado em {{ l.executadoEm | date:'dd/MM/yyyy HH:mm:ss' }}</p>
            <div class="field">
              <label class="label">Status</label>
              <p [class.red-text]="!!l.mensagemErro">{{ mensagemStatus(l) }}</p>
            </div>
            @if (l.mensagemErro) {
              <div class="field">
                <label class="label">Mensagem completa</label>
                <pre class="mensagem-erro-detalhe">{{ l.mensagemErro }}</pre>
              </div>
            }
          </div>
        </div>
      </div>
    }
  }

  <!-- ══ ARMAZENAMENTO ══ -->
  @if (tab() === 'storage') {
    <div class="card">
      <div class="section-header">
        <div class="section-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 1.1 3.58 2 8 2s8-.9 8-2V7M4 7c0 1.1 3.58 2 8 2s8-.9 8-2M4 7c0-1.1 3.58-2 8-2s8 .9 8 2m0 5c0 1.1-3.58 2-8 2s-8-.9-8-2"/>
          </svg>
        </div>
        <div>
          <div class="section-title">Migração de arquivos para o S3</div>
          <div class="section-sub">Copia os XMLs e imagens que ainda estão no MinIO para o bucket S3 configurado — não apaga o original</div>
        </div>
      </div>

      <div class="settings-form">
        <p class="section-sub">
          Executa uma vez em segundo plano (não bloqueia a tela). Acompanhe o progresso pelos
          logs do servidor (prefixo <code>[MigrarArquivosParaS3]</code>). Pode rodar de novo
          com segurança — arquivos já migrados são pulados.
        </p>
        @if (migracaoSucesso()) { <div class="alert-success">{{ checkIcon() }} Migração disparada em segundo plano.</div> }
        @if (migracaoErro()) { <div class="alert-error">{{ migracaoErro() }}</div> }
        <div class="form-actions">
          <span></span>
          <button type="button" class="btn-primary" [disabled]="migrando()" (click)="migrarParaS3()">
            {{ migrando() ? 'Disparando...' : 'Migrar arquivos para o S3' }}
          </button>
        </div>
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }
    .page-sub { color: var(--text2); font-size: 13px; margin-top: 2px; }

    .intervalo-row { display: flex; align-items: flex-end; gap: .75rem; }
    .test-block { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: .625rem; }
    .test-block-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .test-block-sub { font-size: 12px; color: var(--text2); margin: -4px 0 0; }
    .test-row { display: flex; gap: .625rem; }
    .test-row .input { flex: 1; }

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab-btn { background: none; border: none; color: var(--text2); font-size: 13.5px; cursor: pointer; padding: .625rem 1rem; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }

    .section-header {
      display: flex; align-items: center; gap: 12px;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
      background: var(--bg3);
    }
    .section-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: var(--accent-dim); color: var(--accent);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .section-title { font-size: 13.5px; font-weight: 600; color: var(--text); }
    .section-sub   { font-size: 12px; color: var(--text2); margin-top: 2px; }

    .settings-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field-sm { max-width: 160px; }
    .field-center { justify-content: flex-end; padding-bottom: 2px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit;
    }
    .input:focus { border-color: var(--accent); }
    .field-error { font-size: 11px; color: var(--red); }

    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); margin-top: 6px; }
    .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent); }

    .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }

    .alert-error {
      background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3);
      color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px;
    }
    .alert-success {
      display: flex; align-items: center; gap: 8px;
      background: rgba(0,229,160,.1); border: 1px solid rgba(0,229,160,.25);
      color: var(--accent); border-radius: 8px; padding: .625rem .875rem; font-size: 13px;
    }
    .empty-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }

    .status-summary { display: flex; flex-direction: column; gap: 1.25rem; }
    .status-kpi { display: flex; flex-direction: column; gap: 2px; }
    .status-kpi-label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .status-kpi-value { font-size: 1.1rem; font-weight: 700; color: var(--text); }
    .status-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: .75rem; }
    .status-grid-3 { grid-template-columns: repeat(3, 1fr); }
    .status-item { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: .875rem; display: flex; flex-direction: column; gap: 2px; align-items: center; }
    .status-item-value { font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .status-item-value.accent { color: var(--accent); }
    .status-item-value.red { color: var(--red); }
    .status-item-label { font-size: 11px; color: var(--text2); text-align: center; }

    .clientes-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .clientes-table th { text-align: left; color: var(--text2); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .clientes-table td { padding: 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .clientes-table tr:last-child td { border-bottom: none; }
    .clientes-table .red-text { color: var(--red); font-weight: 600; }

    .historico-divider { border-top: 1px solid var(--border); padding-top: 1rem; margin-top: .25rem; display: flex; flex-direction: column; gap: 2px; }
    .historico-table { table-layout: fixed; width: 100%; }
    .historico-table .col-data { width: 108px; }
    .historico-table .col-cliente { width: 160px; }
    .historico-table .col-num { width: 64px; }
    .historico-table .col-msg { width: auto; }
    .historico-table td.col-cliente { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .historico-row { cursor: pointer; }
    .historico-row:hover td { background: var(--bg3); }
    .mensagem-erro-preview {
      display: block; color: var(--text2); font-size: 12px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .mensagem-erro-preview.msg-erro { color: var(--red); font-weight: 600; }
    .mensagem-erro-detalhe {
      color: var(--text2); font-size: 12.5px; white-space: pre-wrap; word-break: break-word;
      background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: .75rem;
      max-height: 320px; overflow-y: auto; margin: 0; font-family: inherit;
    }
    .pagination-row { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: .75rem; }
    .pagination-info { font-size: 12.5px; color: var(--text2); }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-body .status-grid { grid-template-columns: repeat(4, 1fr); }

    @media (max-width: 700px) {
      .form-row { grid-template-columns: 1fr; }
      .field-sm { max-width: 100%; }
      .status-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ConfiguracoesComponent implements OnInit {
  private readonly _svc  = inject(ConfiguracaoService);
  private readonly _fb   = inject(FormBuilder);
  private readonly _auth = inject(AuthService);

  readonly tab = signal<Tab>('email');
  checkIcon(): string { return '✓'; }

  // SMTP
  loadingSmtp = signal(false);
  savingSmtp  = signal(false);
  smtpSuccess = signal(false);
  smtpError   = signal<string | null>(null);

  testEmailDestino = '';
  testingSmtp      = signal(false);
  smtpTestSuccess  = signal(false);
  smtpTestError    = signal<string | null>(null);

  smtpForm = this._fb.group({
    host:      ['', Validators.required],
    port:      [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
    from:      ['', [Validators.required, Validators.email]],
    fromName:  ['FiscalDoc', Validators.required],
    username:  [''],
    password:  [''],
    enableSsl: [false],
    replyTo:   [''],
  });
  get f() { return this.smtpForm.controls; }

  // Redes Sociais
  loadingSocial = signal(false);
  savingSocial  = signal(false);
  socialSuccess = signal(false);
  socialError   = signal<string | null>(null);

  socialForm = this._fb.group({
    instagram: [''],
    facebook:  [''],
    linkedin:  [''],
    tiktok:    [''],
  });

  // Convidar
  sendingConvite  = signal(false);
  conviteSuccess  = signal(false);
  conviteError    = signal<string | null>(null);

  conviteForm = this._fb.group({
    nome:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });
  get cf() { return this.conviteForm.controls; }

  // Importação de e-mails
  forcando          = signal(false);
  forcarSucesso     = signal(false);
  forcarErro        = signal<string | null>(null);
  intervaloMinutos  = 5;
  salvandoIntervalo = signal(false);
  intervaloSucesso  = signal(false);
  intervaloErro     = signal<string | null>(null);

  // Armazenamento (migração pro S3)
  migrando          = signal(false);
  migracaoSucesso   = signal(false);
  migracaoErro      = signal<string | null>(null);

  loadingHistorico = signal(false);
  historico = signal<PagedResult<ImportacaoXmlLogDto>>({ items: [], totalCount: 0, page: 1, pageSize: 25, totalPages: 0 });
  logDetalhe = signal<ImportacaoXmlLogDto | null>(null);
  resumo = signal<ImportacaoXmlLogsResumoDto | null>(null);

  ngOnInit(): void {
    this.testEmailDestino = this._auth.currentUser()?.email ?? '';

    this.loadingSmtp.set(true);
    this._svc.getSmtp().subscribe({
      next: dto => {
        this.smtpForm.patchValue({
          host: dto.host, port: dto.port, from: dto.from, fromName: dto.fromName,
          username: dto.username ?? '', enableSsl: dto.enableSsl, replyTo: dto.replyTo ?? '',
        });
        this.loadingSmtp.set(false);
      },
      error: () => this.loadingSmtp.set(false),
    });

    this.loadingSocial.set(true);
    this._svc.getSocial().subscribe({
      next: dto => {
        this.socialForm.patchValue({
          instagram: dto.instagram ?? '', facebook: dto.facebook ?? '',
          linkedin: dto.linkedin ?? '', tiktok: dto.tiktok ?? '',
        });
        this.loadingSocial.set(false);
      },
      error: () => this.loadingSocial.set(false),
    });
  }

  testSmtp(): void {
    if (!this.testEmailDestino) {
      this.smtpTestError.set('Informe um e-mail de destino para o teste.');
      return;
    }
    this.testingSmtp.set(true);
    this.smtpTestSuccess.set(false);
    this.smtpTestError.set(null);
    const v = this.smtpForm.getRawValue();
    this._svc.testSmtp({
      host: v.host || '', port: v.port ?? 587, from: v.from || '', fromName: v.fromName || 'FiscalDoc',
      username: v.username || undefined,
      password: v.password || undefined,
      enableSsl: v.enableSsl ?? false,
      emailDestino: this.testEmailDestino,
    }).subscribe({
      next: () => {
        this.testingSmtp.set(false);
        this.smtpTestSuccess.set(true);
        setTimeout(() => this.smtpTestSuccess.set(false), 6000);
      },
      error: err => {
        this.testingSmtp.set(false);
        this.smtpTestError.set(extractErrorMessage(err, 'Erro ao enviar e-mail de teste.'));
      },
    });
  }

  saveSmtp(): void {
    if (this.smtpForm.invalid) { this.smtpForm.markAllAsTouched(); return; }
    this.savingSmtp.set(true);
    this.smtpSuccess.set(false);
    this.smtpError.set(null);
    const v = this.smtpForm.getRawValue();
    this._svc.saveSmtp({
      host: v.host!, port: v.port!, from: v.from!, fromName: v.fromName!,
      username: v.username || undefined,
      password: v.password || undefined,
      enableSsl: v.enableSsl ?? false,
      replyTo: v.replyTo || undefined,
    }).subscribe({
      next: () => {
        this.savingSmtp.set(false);
        this.smtpSuccess.set(true);
        setTimeout(() => this.smtpSuccess.set(false), 4000);
      },
      error: err => {
        this.savingSmtp.set(false);
        this.smtpError.set(extractErrorMessage(err, 'Erro ao salvar configurações.'));
      },
    });
  }

  saveSocial(): void {
    this.savingSocial.set(true);
    this.socialSuccess.set(false);
    this.socialError.set(null);
    const v = this.socialForm.getRawValue();
    this._svc.saveSocial({
      instagram: v.instagram || undefined,
      facebook: v.facebook || undefined,
      linkedin: v.linkedin || undefined,
      tiktok: v.tiktok || undefined,
    }).subscribe({
      next: () => {
        this.savingSocial.set(false);
        this.socialSuccess.set(true);
        setTimeout(() => this.socialSuccess.set(false), 4000);
      },
      error: err => {
        this.savingSocial.set(false);
        this.socialError.set(extractErrorMessage(err, 'Erro ao salvar redes sociais.'));
      },
    });
  }

  sendConvite(): void {
    if (this.conviteForm.invalid) { this.conviteForm.markAllAsTouched(); return; }
    this.sendingConvite.set(true);
    this.conviteSuccess.set(false);
    this.conviteError.set(null);
    const v = this.conviteForm.getRawValue();
    this._svc.sendConvite({ nome: v.nome!, email: v.email! }).subscribe({
      next: () => {
        this.sendingConvite.set(false);
        this.conviteSuccess.set(true);
        this.conviteForm.reset();
        setTimeout(() => this.conviteSuccess.set(false), 4000);
      },
      error: err => {
        this.sendingConvite.set(false);
        this.conviteError.set(extractErrorMessage(err, 'Erro ao enviar convite.'));
      },
    });
  }

  carregarIntervalo(): void {
    this._svc.getIntervaloImportacao().subscribe(r => this.intervaloMinutos = r.intervaloMinutos);
  }

  carregarHistorico(page = 1): void {
    this.loadingHistorico.set(true);
    this._svc.getImportacaoXmlLogs({ page, pageSize: 25 }).subscribe({
      next: r => { this.historico.set(r); this.loadingHistorico.set(false); },
      error: () => this.loadingHistorico.set(false),
    });
    this._svc.getImportacaoXmlLogsResumo().subscribe(r => this.resumo.set(r));
  }

  abrirDetalheLog(l: ImportacaoXmlLogDto): void {
    this.logDetalhe.set(l);
  }

  mensagemStatus(l: ImportacaoXmlLogDto): string {
    if (l.mensagemErro) return l.mensagemErro;
    if (l.emailsEncontrados === 0) return 'Nenhum e-mail novo encontrado';
    if (l.xmlsProcessados === 0) return 'E-mail(s) sem anexo XML/ZIP';
    if (l.xmlsImportados < l.xmlsProcessados) return 'XML(s) encontrados, mas não importados — ver Erros';
    return 'OK';
  }

  fecharDetalheLog(): void {
    this.logDetalhe.set(null);
  }

  salvarIntervalo(): void {
    if (!this.intervaloMinutos || this.intervaloMinutos < 1) {
      this.intervaloErro.set('Informe um intervalo válido (mínimo 1 minuto).');
      return;
    }
    this.salvandoIntervalo.set(true);
    this.intervaloSucesso.set(false);
    this.intervaloErro.set(null);
    this._svc.saveIntervaloImportacao(this.intervaloMinutos).subscribe({
      next: r => {
        this.intervaloMinutos = r.intervaloMinutos;
        this.salvandoIntervalo.set(false);
        this.intervaloSucesso.set(true);
        setTimeout(() => this.intervaloSucesso.set(false), 6000);
      },
      error: err => {
        this.salvandoIntervalo.set(false);
        this.intervaloErro.set(extractErrorMessage(err, 'Erro ao salvar intervalo.'));
      },
    });
  }

  forcarImportacao(): void {
    if (this.forcando()) return;
    this.forcando.set(true);
    this.forcarSucesso.set(false);
    this.forcarErro.set(null);
    this._svc.forcarImportacaoXml().subscribe({
      next: () => {
        this.forcando.set(false);
        this.forcarSucesso.set(true);
        setTimeout(() => this.forcarSucesso.set(false), 8000);
      },
      error: err => {
        this.forcando.set(false);
        this.forcarErro.set(extractErrorMessage(err, 'Erro ao forçar a importação.'));
      },
    });
  }

  migrarParaS3(): void {
    if (this.migrando()) return;
    this.migrando.set(true);
    this.migracaoSucesso.set(false);
    this.migracaoErro.set(null);
    this._svc.migrarArquivosParaS3().subscribe({
      next: () => {
        this.migrando.set(false);
        this.migracaoSucesso.set(true);
        setTimeout(() => this.migracaoSucesso.set(false), 8000);
      },
      error: err => {
        this.migrando.set(false);
        this.migracaoErro.set(extractErrorMessage(err, 'Erro ao disparar a migração.'));
      },
    });
  }
}
