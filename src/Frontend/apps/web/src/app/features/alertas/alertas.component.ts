import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertaService } from '@veloxml/services';
import { AlertaDto } from '@veloxml/models';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <h2 class="font-heading">Alertas</h2>
        <div class="header-meta">
          @if (totalAtivos() > 0) {
            <span class="badge-ativos">{{ totalAtivos() }} ativo{{ totalAtivos() !== 1 ? 's' : '' }}</span>
          }
        </div>
      </header>

      <div class="filters card">
        <select [(ngModel)]="filterStatus" (ngModelChange)="onFilter()">
          <option value="">Todos os status</option>
          <option value="Ativo">Ativos</option>
          <option value="Lido">Lidos</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Carregando...</div>
      } @else {
        <div class="alerta-list">
          @for (a of alertas(); track a.id) {
            <div class="alerta-card card" [class.lido]="a.status === 'Lido'">
              <div class="alerta-left">
                <span class="sev-dot" [ngClass]="sevClass(a.severidade)"></span>
              </div>
              <div class="alerta-body">
                <div class="alerta-header">
                  <span class="alerta-titulo">{{ a.titulo }}</span>
                  <span class="badge sev-badge" [ngClass]="sevClass(a.severidade)">{{ a.severidade }}</span>
                  <span class="badge tipo-badge">{{ a.tipo }}</span>
                </div>
                <p class="alerta-desc">{{ a.descricao }}</p>
                <div class="alerta-meta">
                  <span class="meta-item">{{ a.nomeCliente }}</span>
                  <span class="meta-sep">·</span>
                  <span class="meta-item">{{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  @if (a.lidoEm) {
                    <span class="meta-sep">·</span>
                    <span class="meta-item lido-text">Lido em {{ a.lidoEm | date:'dd/MM HH:mm' }}</span>
                  }
                </div>
              </div>
              @if (a.status !== 'Lido') {
                <button class="mark-btn" (click)="marcarLido(a)" title="Marcar como lido">✓</button>
              }
            </div>
          }
          @if (!alertas().length) {
            <div class="empty-state card">
              <p>Nenhum alerta encontrado.</p>
            </div>
          }
        </div>

        <div class="pagination">
          <button class="btn btn-ghost" [disabled]="page() <= 1" (click)="prevPage()">‹ Anterior</button>
          <span class="page-info">Pág. {{ page() }} / {{ totalPages() }}</span>
          <button class="btn btn-ghost" [disabled]="page() >= totalPages()" (click)="nextPage()">Próxima ›</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: center; gap: 1rem; }
    .page-header h2 { font-size: 1.5rem; margin: 0; flex: 1; }
    .badge-ativos { background: rgba(255,77,109,0.12); color: var(--red); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }

    .filters { display: flex; padding: 0.75rem 1rem; gap: 0.75rem; }
    .filters select { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 7px 10px; color: var(--text); font-size: 13px; outline: none; }
    .filters select:focus { border-color: var(--accent); }

    .loading { color: var(--text2); }
    .alerta-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .alerta-card {
      display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem;
      transition: opacity 200ms;
    }
    .alerta-card.lido { opacity: 0.55; }

    .alerta-left { padding-top: 3px; }
    .sev-dot { display: block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .sev-dot.sev-critical { background: var(--red); }
    .sev-dot.sev-high { background: #ff8c42; }
    .sev-dot.sev-medium { background: var(--yellow); }
    .sev-dot.sev-low, .sev-dot.sev-info { background: var(--text2); }

    .alerta-body { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; }
    .alerta-header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .alerta-titulo { font-weight: 600; font-size: 14px; color: var(--text); }
    .alerta-desc { font-size: 13px; color: var(--text2); margin: 0; }
    .alerta-meta { display: flex; align-items: center; gap: 0.375rem; font-size: 11px; color: var(--text2); }
    .meta-sep { color: var(--text3, #4a5068); }
    .lido-text { color: var(--accent); }

    .badge { display: inline-block; padding: 2px 7px; border-radius: 100px; font-size: 11px; font-weight: 600; }
    .sev-badge.sev-critical { background: rgba(255,77,109,0.12); color: var(--red); }
    .sev-badge.sev-high { background: rgba(255,140,66,0.12); color: #ff8c42; }
    .sev-badge.sev-medium, .sev-badge.sev-warning { background: rgba(255,209,102,0.15); color: var(--yellow); }
    .sev-badge.sev-low, .sev-badge.sev-info { background: var(--bg3); color: var(--text2); }
    .tipo-badge { background: var(--bg3); color: var(--text2); }

    .mark-btn {
      background: none; border: 1px solid var(--border); border-radius: 6px;
      color: var(--text2); cursor: pointer; padding: 4px 8px; font-size: 14px;
      transition: all 120ms; flex-shrink: 0; align-self: flex-start;
    }
    .mark-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(0,229,160,0.08); }

    .empty-state { padding: 2rem; text-align: center; color: var(--text2); font-size: 14px; }
    .empty-state p { margin: 0; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; }
    .page-info { font-size: 13px; color: var(--text2); }
  `],
})
export class AlertasComponent implements OnInit {
  private readonly _svc = inject(AlertaService);

  readonly alertas = signal<AlertaDto[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 25;
  readonly totalPages = signal(1);
  readonly totalAtivos = signal(0);

  filterStatus = 'Ativo';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this._svc.getAll({ page: this.page(), pageSize: this.pageSize, status: this.filterStatus || undefined }).subscribe({
      next: (r) => {
        this.alertas.set(r.items);
        this.totalPages.set(Math.max(1, Math.ceil(r.totalCount / this.pageSize)));
        if (this.filterStatus === 'Ativo') this.totalAtivos.set(r.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilter(): void { this.page.set(1); this.load(); }
  prevPage(): void { this.page.update(p => p - 1); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  marcarLido(a: AlertaDto): void {
    this._svc.marcarLido(a.id).subscribe({
      next: () => this.load(),
    });
  }

  sevClass(sev: string): string {
    const s = sev?.toLowerCase() ?? 'info';
    return `sev-${s}`;
  }
}
