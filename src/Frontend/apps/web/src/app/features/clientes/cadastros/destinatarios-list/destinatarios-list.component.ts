import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, DestinatarioService } from '@veloxml/services';
import { DestinatarioDto } from '@veloxml/models';

@Component({
  selector: 'app-destinatarios-list',
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
        <h2 class="page-title">Clientes</h2>
      </div>

      <div class="card section">
        <div class="list-header">
          <div class="search-box">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input class="search-input" [(ngModel)]="termo" (input)="buscar()" placeholder="Buscar cliente..."/>
          </div>
          <button class="btn-primary" (click)="abrirDestinatario('novo')">+ Novo Cliente</button>
        </div>

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (destinatarios().length === 0) {
          <div class="empty">Nenhum cliente cadastrado.</div>
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr><th>Razão Social</th><th>CPF/CNPJ</th><th>Cidade/UF</th><th>Status</th></tr>
            </thead>
            <tbody>
              @for (d of destinatarios(); track d.id) {
                <tr class="row-link" (click)="abrirDestinatario(d.id)">
                  <td>
                    <div>{{ d.razaoSocial }}</div>
                    @if (d.nomeFantasia) { <div class="sub-text">{{ d.nomeFantasia }}</div> }
                  </td>
                  <td class="mono">{{ d.cpfCnpj ?? '-' }}</td>
                  <td>{{ d.cidade ? (d.cidade + '/' + d.estado) : '-' }}</td>
                  <td><span class="badge" [class.badge-green]="d.ativo" [class.badge-red]="!d.ativo">{{ d.ativo ? 'Ativo' : 'Inativo' }}</span></td>
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
export class DestinatariosListComponent implements OnInit {
  private readonly _destSvc = inject(DestinatarioService);
  private readonly _route   = inject(ActivatedRoute);
  private readonly _router  = inject(Router);
  private readonly _auth    = inject(AuthService);

  private clienteId = '';
  readonly isCliente = computed(() => this._auth.currentUser()?.perfil === 'Cliente');

  readonly destinatarios = signal<DestinatarioDto[]>([]);
  readonly loading       = signal(false);
  termo = '';

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.buscar();
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId]); }

  buscar(): void {
    this.loading.set(true);
    this._destSvc.getAll(this.clienteId, { termo: this.termo }).subscribe({
      next: r => { this.destinatarios.set(r.items as DestinatarioDto[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirDestinatario(id: string): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'destinatarios', id]); }
}
