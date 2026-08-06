import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RelatorioService } from '@veloxml/services';
import { RelatorioNfeEmitidasDto } from '@veloxml/models';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao cliente
        </button>
        <h2 class="page-title">Relatórios</h2>
      </div>

      <div class="card section">
        <h4 class="section-title">Notas Fiscais Emitidas no Mês</h4>
        <div class="filter-bar">
          <div class="field">
            <label class="label">Mês</label>
            <select class="input" [(ngModel)]="mes" (ngModelChange)="carregar()">
              @for (m of meses; track $index) { <option [value]="$index + 1">{{ m }}</option> }
            </select>
          </div>
          <div class="field">
            <label class="label">Ano</label>
            <select class="input" [(ngModel)]="ano" (ngModelChange)="carregar()">
              @for (a of anos; track a) { <option [value]="a">{{ a }}</option> }
            </select>
          </div>
        </div>

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else {
          @if (relatorio(); as r) {
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-label">Total de Notas</span>
                <span class="stat-value">{{ r.totalNotas }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Autorizadas</span>
                <span class="stat-value stat-value--ok">{{ r.totalAutorizadas }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Canceladas</span>
                <span class="stat-value stat-value--erro">{{ r.totalCanceladas }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Valor Total</span>
                <span class="stat-value">{{ r.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</span>
              </div>
            </div>

            @if (r.itens.length === 0) {
              <div class="empty">Nenhuma nota fiscal emitida nesse mês.</div>
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr><th>Usuário</th><th>Data</th><th>Número</th><th>Série</th><th>Status</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    @for (i of r.itens; track i.chaveAcesso ?? $index) {
                      <tr>
                        <td>{{ i.usuarioNome || '—' }}</td>
                        <td>{{ i.data | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td class="mono">{{ i.numero || '—' }}</td>
                        <td class="mono">{{ i.serie || '—' }}</td>
                        <td><span class="badge" [class]="statusClass(i.status)">{{ statusLabel(i.status) }}</span></td>
                        <td>{{ i.valorTotal != null ? (i.valorTotal | currency:'BRL':'symbol':'1.2-2') : '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; align-self: flex-start; }
    .back-btn:hover { color: var(--accent); }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .filter-bar { display: flex; gap: .875rem; flex-wrap: wrap; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; min-width: 160px; }
    .input:focus { border-color: var(--accent); }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 2rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .875rem; }
    .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: .875rem 1rem; display: flex; flex-direction: column; gap: 4px; }
    .stat-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text2); }
    .stat-value { font-size: 1.3rem; font-weight: 700; color: var(--text); }
    .stat-value--ok { color: var(--accent); }
    .stat-value--erro { color: var(--red); }

    .table-wrap { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .table td { padding: 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; white-space: nowrap; }
    .table tr:last-child td { border-bottom: none; }
    .mono { font-family: monospace; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-autorizada { background: oklch(0.62 0.17 254 / .12); color: var(--accent); }
    .badge-cancelada { background: rgba(255,77,109,.12); color: var(--red); }

    /* ── Tablet (iPad) e mobile ── */
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr; }
      .filter-bar { flex-direction: column; align-items: stretch; }
      .input { min-width: 0; width: 100%; box-sizing: border-box; }
    }
  `],
})
export class RelatoriosComponent implements OnInit {
  private readonly _svc = inject(RelatorioService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  private clienteId = '';
  readonly meses = MESES;
  readonly anos = this._gerarAnos();

  private readonly _hoje = new Date();
  mes = this._hoje.getMonth() + 1;
  ano = this._hoje.getFullYear();

  readonly loading = signal(false);
  readonly relatorio = signal<RelatorioNfeEmitidasDto | null>(null);

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.carregar();
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId]); }

  carregar(): void {
    this.loading.set(true);
    this._svc.getNfeEmitidas(this.clienteId, +this.mes, +this.ano).subscribe({
      next: r => { this.relatorio.set(r); this.loading.set(false); },
      error: () => { this.relatorio.set(null); this.loading.set(false); },
    });
  }

  statusLabel(status: string): string {
    return status === 'Autorizada' ? 'Autorizada' : status === 'Cancelada' ? 'Cancelada' : status;
  }

  statusClass(status: string): string {
    return status === 'Autorizada' ? 'badge badge-autorizada' : status === 'Cancelada' ? 'badge badge-cancelada' : 'badge';
  }

  private _gerarAnos(): number[] {
    const atual = new Date().getFullYear();
    return [atual, atual - 1, atual - 2];
  }
}
