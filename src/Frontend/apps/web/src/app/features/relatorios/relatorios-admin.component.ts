import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RelatorioService } from '@veloxml/services';
import { RelatorioNfePorClienteItemDto } from '@veloxml/models';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-relatorios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Relatórios</h2>
      </div>

      <div class="card section">
        <h4 class="section-title">Notas Fiscais Emitidas por Cliente</h4>
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
        } @else if (itens().length === 0) {
          <div class="empty">Nenhuma nota fiscal emitida nesse mês.</div>
        } @else {
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Clientes com Emissão</span>
              <span class="stat-value">{{ itens().length }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Total de Notas</span>
              <span class="stat-value">{{ totalNotas() }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Valor Total</span>
              <span class="stat-value">{{ totalValor() | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
          </div>

          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th>Cliente</th><th>Notas</th><th>Autorizadas</th><th>Canceladas</th><th>Valor Total</th></tr>
              </thead>
              <tbody>
                @for (i of itens(); track i.clienteId) {
                  <tr class="row-link" (click)="abrirCliente(i.clienteId)">
                    <td>{{ i.clienteNome }}</td>
                    <td class="mono">{{ i.quantidade }}</td>
                    <td class="mono">{{ i.totalAutorizadas }}</td>
                    <td class="mono">{{ i.totalCanceladas }}</td>
                    <td>{{ i.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
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

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .875rem; }
    .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: .875rem 1rem; display: flex; flex-direction: column; gap: 4px; }
    .stat-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text2); }
    .stat-value { font-size: 1.3rem; font-weight: 700; color: var(--text); }

    .table-wrap { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 520px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .table td { padding: 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; white-space: nowrap; }
    .table tr:last-child td { border-bottom: none; }
    .mono { font-family: monospace; font-size: 12px; }
    .row-link { cursor: pointer; }
    .row-link:hover td { background: rgba(255,255,255,.02); }

    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr; }
      .filter-bar { flex-direction: column; align-items: stretch; }
      .input { min-width: 0; width: 100%; box-sizing: border-box; }
    }
  `],
})
export class RelatoriosAdminComponent implements OnInit {
  private readonly _svc = inject(RelatorioService);
  private readonly _router = inject(Router);

  readonly meses = MESES;
  readonly anos = this._gerarAnos();

  private readonly _hoje = new Date();
  mes = this._hoje.getMonth() + 1;
  ano = this._hoje.getFullYear();

  readonly loading = signal(false);
  readonly itens = signal<RelatorioNfePorClienteItemDto[]>([]);

  readonly totalNotas = () => this.itens().reduce((s, i) => s + i.quantidade, 0);
  readonly totalValor = () => this.itens().reduce((s, i) => s + i.valorTotal, 0);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this._svc.getNfePorCliente(+this.mes, +this.ano).subscribe({
      next: itens => { this.itens.set(itens); this.loading.set(false); },
      error: () => { this.itens.set([]); this.loading.set(false); },
    });
  }

  abrirCliente(clienteId: string): void {
    this._router.navigate(['/clientes', clienteId]);
  }

  private _gerarAnos(): number[] {
    const atual = new Date().getFullYear();
    return [atual, atual - 1, atual - 2];
  }
}
