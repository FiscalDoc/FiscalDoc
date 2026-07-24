import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '@veloxml/services';
import { LogDto, PagedResult } from '@veloxml/models';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Logs de Auditoria</h2>
          <p class="page-sub">Histórico completo de alterações no sistema</p>
        </div>
      </div>

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
    table { width: 100%; border-collapse: collapse; }
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
  `]
})
export class LogsComponent implements OnInit {
  private readonly _logs = inject(LogService);

  logs = signal<LogDto[]>([]);
  loading = signal(false);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  expandedId = signal<string | null>(null);

  filterCategoria = '';
  filterOperacao = '';

  ngOnInit(): void {
    this.load();
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
