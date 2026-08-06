import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, LogService } from '@veloxml/services';
import { ImportacaoXmlLogDto, ImportacaoXmlLogsResumoDto, LogDto, PagedResult } from '@veloxml/models';

type LogsTab = 'auditoria' | 'integracao';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Logs</h2>
          <p class="page-sub">
            @if (isAdmin()) {
              Auditoria de alterações e histórico de importação de XML (e-mail e API)
            } @else {
              Histórico de importação de XML por e-mail e por integração via API
            }
          </p>
        </div>
      </div>

      @if (isAdmin()) {
        <nav class="tabs">
          <button class="tab-btn" [class.active]="tab() === 'auditoria'" (click)="tab.set('auditoria')">Auditoria</button>
          <button class="tab-btn" [class.active]="tab() === 'integracao'" (click)="selectIntegracaoTab()">E-mail &amp; API</button>
        </nav>
      }

      @if (tab() === 'auditoria') {
      <!-- Filtros -->
      <div class="filters card">
        <div class="filter-row">
          <div class="filter-field">
            <label>Tabela</label>
            <input [(ngModel)]="filterCategoria" (ngModelChange)="onFilterChange()" placeholder="Ex: contadores, clientes..." />
          </div>
          <div class="filter-field">
            <label>Operação</label>
            <select [(ngModel)]="filterOperacao" (ngModelChange)="onFilterChange()">
              <option value="">Todas</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <button class="btn btn-ghost" (click)="clearFilters()">Limpar</button>
        </div>
      </div>

      <!-- Tabela -->
      <div class="table-card card">
        @if (loading()) {
          <div class="empty-state">
            <div class="spinner"></div>
            <span>Carregando logs...</span>
          </div>
        } @else if (logs().length === 0) {
          <div class="empty-state">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <span>Nenhum log encontrado</span>
          </div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Tabela</th>
                  <th>Operação</th>
                  <th>Registro</th>
                  <th>Usuário</th>
                  <th>IP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (log of logs(); track log.id) {
                  <tr [class.expanded]="expandedId() === log.id">
                    <td class="mono text-sm">{{ formatDate(log.criadoEm) }}</td>
                    <td><span class="table-badge">{{ log.tabela }}</span></td>
                    <td><span class="op-badge" [class]="opClass(log.operacao)">{{ log.operacao }}</span></td>
                    <td class="mono text-sm text2">{{ log.registroId ? log.registroId.substring(0,8) + '...' : '—' }}</td>
                    <td class="text-sm text2">{{ log.userId ? log.userId.substring(0,8) + '...' : '—' }}</td>
                    <td class="text-sm text2">{{ log.ipAddress ?? '—' }}</td>
                    <td>
                      @if (log.valoresAntigos || log.valoresNovos) {
                        <button class="btn-expand" (click)="toggleExpand(log.id)" title="Ver detalhes">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            @if (expandedId() === log.id) {
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>
                            } @else {
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                            }
                          </svg>
                        </button>
                      }
                    </td>
                  </tr>
                  @if (expandedId() === log.id) {
                    <tr class="detail-row">
                      <td colspan="7">
                        <div class="detail-grid">
                          @if (log.valoresAntigos) {
                            <div class="detail-block">
                              <div class="detail-label">Antes</div>
                              <pre class="detail-json">{{ formatJson(log.valoresAntigos) }}</pre>
                            </div>
                          }
                          @if (log.valoresNovos) {
                            <div class="detail-block">
                              <div class="detail-label">Depois</div>
                              <pre class="detail-json after">{{ formatJson(log.valoresNovos) }}</pre>
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Paginação -->
          <div class="pagination">
            <span class="pag-info">{{ total() }} registros — página {{ page() }} de {{ totalPages() }}</span>
            <div class="pag-btns">
              <button class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="goPage(page() - 1)">Anterior</button>
              <button class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="goPage(page() + 1)">Próxima</button>
            </div>
          </div>
        }
      </div>
      }

      @if (tab() === 'integracao') {
        @if (resumo(); as r) {
          <div class="status-grid">
            <div class="card status-card">
              <span class="status-value">{{ r.ultimaExecucaoEm ? formatDate(r.ultimaExecucaoEm) : '—' }}</span>
              <span class="status-label">Última execução</span>
            </div>
            <div class="card status-card">
              <span class="status-value">{{ r.totalExecucoes }}</span>
              <span class="status-label">Execuções registradas</span>
            </div>
            <div class="card status-card">
              <span class="status-value" [class.text-red]="r.totalErros > 0">{{ r.totalErros }}</span>
              <span class="status-label">Total de erros</span>
            </div>
          </div>
        }

        <div class="filters card">
          <div class="filter-row">
            <div class="filter-field">
              <label>Origem</label>
              <select [(ngModel)]="filterOrigem" (ngModelChange)="onIntegracaoFilterChange()">
                <option value="">Todas</option>
                <option value="ImportacaoEmail">E-mail</option>
                <option value="ApiIngest">API</option>
              </select>
            </div>
            <button class="btn btn-ghost" (click)="loadIntegracao(1)">Atualizar</button>
          </div>
        </div>

        <div class="table-card card">
          @if (loadingIntegracao()) {
            <div class="empty-state"><div class="spinner"></div><span>Carregando...</span></div>
          } @else if (integracaoLogs().length === 0) {
            <div class="empty-state"><span>Nenhuma execução registrada ainda.</span></div>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Origem</th>
                    <th>Cliente</th>
                    <th>E-mails</th>
                    <th>XMLs</th>
                    <th>Importados</th>
                    <th>Erros</th>
                    <th>Mensagem</th>
                    <th>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  @for (l of integracaoLogs(); track l.id) {
                    <tr class="row-clickable" (click)="openIntegracaoDetail(l)">
                      <td class="mono text-sm">{{ formatDate(l.executadoEm) }}</td>
                      <td><span class="op-badge" [class]="origemClass(l.origem)">{{ origemLabel(l.origem) }}</span></td>
                      <td class="text-sm">{{ l.clienteNome }}</td>
                      <td class="text-sm">{{ l.emailsEncontrados }}</td>
                      <td class="text-sm">{{ l.xmlsProcessados }}</td>
                      <td class="text-sm">{{ l.xmlsImportados }}</td>
                      <td class="text-sm" [class.text-red]="l.erros > 0">{{ l.erros }}</td>
                      <td class="text-sm text2 msg-preview" [class.text-red]="!!l.mensagemErro">{{ mensagemStatus(l) }}</td>
                      <td class="text-sm" (click)="$event.stopPropagation()">
                        @if (l.documentoIds.length === 1) {
                          <a class="doc-link" [routerLink]="['/documentos']" [queryParams]="{ id: l.documentoIds[0] }">Ver documento</a>
                        } @else if (l.documentoIds.length > 1) {
                          <span class="doc-link" (click)="openIntegracaoDetail(l)">{{ l.documentoIds.length }} documentos</span>
                        } @else {
                          <span class="text2">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="pagination">
              <span class="pag-info">{{ integracaoTotal() }} registros — página {{ integracaoPage() }} de {{ integracaoTotalPages() }}</span>
              <div class="pag-btns">
                <button class="btn btn-ghost btn-sm" [disabled]="integracaoPage() <= 1" (click)="loadIntegracao(integracaoPage() - 1)">Anterior</button>
                <button class="btn btn-ghost btn-sm" [disabled]="integracaoPage() >= integracaoTotalPages()" (click)="loadIntegracao(integracaoPage() + 1)">Próxima</button>
              </div>
            </div>
          }
        </div>

        @if (integracaoDetail(); as l) {
          <div class="overlay" (click)="integracaoDetail.set(null)">
            <div class="modal" (click)="$event.stopPropagation()">
              <header class="modal-header">
                <h3 class="modal-title">{{ l.clienteNome }}</h3>
                <button class="modal-close" (click)="integracaoDetail.set(null)">✕</button>
              </header>
              <div class="modal-body">
                <div class="status-grid">
                  <div class="card status-card">
                    <span class="status-value">{{ l.emailsEncontrados }}</span>
                    <span class="status-label">E-mails encontrados</span>
                  </div>
                  <div class="card status-card">
                    <span class="status-value">{{ l.xmlsProcessados }}</span>
                    <span class="status-label">XMLs processados</span>
                  </div>
                  <div class="card status-card">
                    <span class="status-value text-accent">{{ l.xmlsImportados }}</span>
                    <span class="status-label">XMLs importados</span>
                  </div>
                  <div class="card status-card">
                    <span class="status-value" [class.text-red]="l.erros > 0">{{ l.erros }}</span>
                    <span class="status-label">Erros</span>
                  </div>
                </div>
                <p class="pag-info">Executado em {{ formatDate(l.executadoEm) }} · Origem: {{ origemLabel(l.origem) }}</p>
                @if (l.documentoIds.length > 0) {
                  <div class="field">
                    <label class="detail-label">Documento(s) importado(s)</label>
                    <div class="doc-link-list">
                      @for (docId of l.documentoIds; track docId) {
                        <a class="doc-link" [routerLink]="['/documentos']" [queryParams]="{ id: docId }">Ver documento</a>
                      }
                    </div>
                  </div>
                }
                @if (l.mensagemErro) {
                  <div class="field">
                    <label class="detail-label">Mensagem completa</label>
                    <pre class="detail-json">{{ l.mensagemErro }}</pre>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-title { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text); }
    .page-sub { font-size: 13px; color: var(--text2); margin: 4px 0 0; }

    .filters { padding: 1rem; }
    .filter-row { display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap; }
    .filter-field { display: flex; flex-direction: column; gap: 4px; }
    .filter-field label { font-size: 11px; color: var(--text2); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
    .filter-field input, .filter-field select {
      background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 7px 10px; color: var(--text); font-size: 13px; outline: none; min-width: 160px;
    }
    .filter-field input:focus, .filter-field select:focus { border-color: var(--accent); }
    .filter-field select option { background: var(--bg3); }

    .table-card { padding: 0; overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 720px; }
    thead tr { border-bottom: 1px solid var(--border); }
    th { padding: 10px 12px; font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; white-space: nowrap; }
    td { padding: 10px 12px; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr.expanded td { border-bottom: none; }
    tr:hover:not(.detail-row) td { background: var(--bg3); }

    .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    .text-sm { font-size: 12px; }
    .text2 { color: var(--text2); }

    .table-badge {
      background: var(--bg3); border: 1px solid var(--border);
      border-radius: 4px; padding: 2px 6px; font-size: 11px; font-family: monospace;
      color: var(--text);
    }

    .op-badge {
      border-radius: 4px; padding: 2px 7px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .op-badge.insert { background: rgba(0,229,160,0.12); color: var(--accent); }
    .op-badge.update { background: rgba(255,209,102,0.12); color: var(--yellow); }
    .op-badge.delete { background: rgba(255,77,109,0.12); color: var(--red); }

    .btn-expand {
      background: none; border: 1px solid var(--border); border-radius: 4px;
      color: var(--text2); cursor: pointer; padding: 3px 6px; display: flex; align-items: center;
      transition: color 120ms, border-color 120ms;
    }
    .btn-expand:hover { color: var(--accent); border-color: var(--accent); }

    .detail-row td { background: var(--bg3) !important; padding: 0; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); }
    .detail-block { background: var(--bg3); padding: 12px 16px; }
    .detail-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text2); font-weight: 600; margin-bottom: 6px; }
    .detail-json {
      font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2);
      white-space: pre-wrap; word-break: break-all; margin: 0; max-height: 200px; overflow-y: auto;
    }
    .detail-json.after { color: var(--accent); }

    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-top: 1px solid var(--border);
    }
    .pag-info { font-size: 12px; color: var(--text2); }
    .pag-btns { display: flex; gap: 6px; }
    .btn-sm { padding: 5px 12px; font-size: 12px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; color: var(--text2); font-size: 14px; }
    .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
    .tab-btn {
      background: none; border: none; padding: 8px 14px; font-size: 13.5px; color: var(--text2);
      cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

    .status-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
    .status-card { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 4px; padding: 1rem; }
    .status-value { font-size: 1.15rem; font-weight: 700; color: var(--text); }
    .status-label { font-size: 11.5px; color: var(--text2); }
    .text-red { color: var(--red) !important; }
    .text-accent { color: var(--accent) !important; }

    .op-badge.origem-manual { background: var(--bg3); color: var(--text2); }
    .op-badge.origem-importacaoemail { background: rgba(77,148,255,0.12); color: #4d94ff; }
    .op-badge.origem-apiingest { background: rgba(0,229,160,0.12); color: var(--accent); }

    .row-clickable { cursor: pointer; }
    .msg-preview { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .doc-link { color: var(--accent); font-size: 12px; cursor: pointer; text-decoration: none; white-space: nowrap; }
    .doc-link:hover { text-decoration: underline; }
    .doc-link-list { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; max-width: 520px; width: 100%; max-height: 85vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
    .modal-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 15px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 6px; }


    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .filter-row { flex-direction: column; align-items: stretch; }
      .filter-field input, .filter-field select { min-width: 0; width: 100%; }
      .detail-grid { grid-template-columns: 1fr; }
      .pagination { flex-direction: column; align-items: stretch; gap: 8px; }
      .modal-header { flex-direction: column; align-items: stretch; gap: 6px; }
    }
  `]
})
export class LogsComponent implements OnInit {
  private readonly _logs  = inject(LogService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _auth  = inject(AuthService);

  readonly isAdmin = computed(() => this._auth.currentUser()?.perfil === 'Administrador');

  tab = signal<LogsTab>('auditoria');

  logs = signal<LogDto[]>([]);
  loading = signal(false);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  expandedId = signal<string | null>(null);

  filterCategoria = '';
  filterOperacao = '';

  resumo = signal<ImportacaoXmlLogsResumoDto | null>(null);
  integracaoLogs = signal<ImportacaoXmlLogDto[]>([]);
  loadingIntegracao = signal(false);
  integracaoTotal = signal(0);
  integracaoPage = signal(1);
  integracaoTotalPages = signal(1);
  integracaoDetail = signal<ImportacaoXmlLogDto | null>(null);
  filterOrigem = '';

  ngOnInit(): void {
    if (!this.isAdmin() || this._route.snapshot.queryParamMap.get('tab') === 'integracao') {
      this.selectIntegracaoTab();
    } else {
      this.load();
    }
  }

  selectIntegracaoTab(): void {
    this.tab.set('integracao');
    this.loadIntegracao(1);
  }

  loadIntegracao(page = 1): void {
    this.integracaoPage.set(page);
    this.loadingIntegracao.set(true);
    this._logs.getIntegracao({
      origem: this.filterOrigem || undefined,
      page,
      pageSize: 25,
    }).subscribe({
      next: (r) => {
        this.integracaoLogs.set(r.items);
        this.integracaoTotal.set(r.totalCount);
        this.integracaoTotalPages.set(Math.max(1, r.totalPages));
        this.loadingIntegracao.set(false);
      },
      error: () => this.loadingIntegracao.set(false),
    });
    this._logs.getIntegracaoResumo(this.filterOrigem || undefined).subscribe(r => this.resumo.set(r));
  }

  onIntegracaoFilterChange(): void {
    this.loadIntegracao(1);
  }

  openIntegracaoDetail(l: ImportacaoXmlLogDto): void {
    this.integracaoDetail.set(l);
  }

  origemLabel(origem: string): string {
    const map: Record<string, string> = { Manual: 'Manual', ImportacaoEmail: 'E-mail', ApiIngest: 'API' };
    return map[origem] ?? origem;
  }

  origemClass(origem: string): string {
    return `origem-${origem.toLowerCase()}`;
  }

  mensagemStatus(l: ImportacaoXmlLogDto): string {
    if (l.mensagemErro) return l.mensagemErro;
    if (l.emailsEncontrados === 0 && l.origem === 'ImportacaoEmail') return 'Nenhum e-mail novo encontrado';
    if (l.xmlsProcessados === 0) return 'Sem anexo XML/ZIP';
    if (l.xmlsImportados < l.xmlsProcessados) return 'XML(s) encontrados, mas não importados';
    return 'OK';
  }

  load(): void {
    this.loading.set(true);
    this._logs.getAll({
      categoria: this.filterCategoria || undefined,
      operacao: this.filterOperacao || undefined,
      page: this.page(),
      pageSize: 50,
    }).subscribe({
      next: (r) => {
        this.logs.set(r.items);
        this.total.set(r.totalCount);
        this.totalPages.set(Math.max(1, r.totalPages));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.filterCategoria = '';
    this.filterOperacao = '';
    this.page.set(1);
    this.load();
  }

  goPage(p: number): void {
    this.page.set(p);
    this.expandedId.set(null);
    this.load();
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  opClass(op: string): string {
    return op.toLowerCase();
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatJson(raw: string): string {
    try { return JSON.stringify(JSON.parse(raw), null, 2); }
    catch { return raw; }
  }
}
