import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, TransportadoraService } from '@veloxml/services';
import { TransportadoraDto } from '@veloxml/models';

@Component({
  selector: 'app-transportadoras-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        @if (!isCliente()) {
          <button class="back-btn" (click)="goBack()">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Voltar ao cliente
          </button>
        }
        <h2 class="page-title">Transportadoras</h2>
      </div>

      <div class="card section">
        <div class="list-header">
          <div class="search-box">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input class="search-input" [(ngModel)]="termo" (input)="buscar()" placeholder="Buscar transportadora..."/>
          </div>
          <button class="btn-primary" (click)="abrirTransportadora('novo')">+ Nova Transportadora</button>
        </div>

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (transportadoras().length === 0) {
          <div class="empty">Nenhuma transportadora cadastrada.</div>
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr><th>Razão Social</th><th>CNPJ</th><th>Cidade/UF</th><th>Status</th></tr>
            </thead>
            <tbody>
              @for (t of transportadoras(); track t.id) {
                <tr class="row-link" (click)="abrirTransportadora(t.id)">
                  <td>
                    <div>{{ t.razaoSocial }}</div>
                    @if (t.nomeFantasia) { <div class="sub-text">{{ t.nomeFantasia }}</div> }
                  </td>
                  <td class="mono">{{ t.cpfCnpj ?? '-' }}</td>
                  <td>{{ t.cidade ? (t.cidade + '/' + t.estado) : '-' }}</td>
                  <td><span class="badge" [class.badge-green]="t.ativo" [class.badge-red]="!t.ativo">{{ t.ativo ? 'Ativo' : 'Inativo' }}</span></td>
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
    .page-header { display: flex; flex-direction: column; gap: .25rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; }
    .back-btn:hover { color: var(--accent); }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .list-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .search-box { display: flex; align-items: center; gap: 6px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; color: var(--text2); flex: 1; max-width: 320px; }
    .search-input { background: none; border: none; outline: none; color: var(--text); font-size: 13px; flex: 1; }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 2rem; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .row-link { cursor: pointer; }
    .row-link:hover td { background: rgba(255,255,255,.02); }
    .mono { font-family: monospace; font-size: 12px; }
    .sub-text { font-size: 11px; color: var(--text2); margin-top: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: rgba(0, 229, 160, .12); color: var(--green); }
    .badge-red { background: rgba(255,77,109,.12); color: var(--red); }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:hover { opacity: .88; }
    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 560px; }

    @media (max-width: 640px) {
      .list-header { flex-direction: column; align-items: stretch; }
      .search-box { max-width: none; }
    }
  `],
})
export class TransportadorasListComponent implements OnInit {
  private readonly _svc    = inject(TransportadoraService);
  private readonly _route  = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _auth   = inject(AuthService);

  private clienteId = '';
  readonly isCliente = computed(() => this._auth.currentUser()?.perfil === 'Cliente');

  readonly transportadoras = signal<TransportadoraDto[]>([]);
  readonly loading         = signal(false);
  termo = '';

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.buscar();
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId]); }

  buscar(): void {
    this.loading.set(true);
    this._svc.getAll(this.clienteId, { termo: this.termo }).subscribe({
      next: r => { this.transportadoras.set(r.items as TransportadoraDto[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirTransportadora(id: string): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'transportadoras', id]); }
}
