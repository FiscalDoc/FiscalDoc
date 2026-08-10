import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, TransportadoraService, ConfirmDialogService, ToastService, extractErrorMessage } from '@veloxml/services';
import { TransportadoraDto } from '@veloxml/models';
import { NovoRegistroAtalhoDirective } from '../../../../shared/novo-registro-atalho.directive';

@Component({
  selector: 'app-transportadoras-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NovoRegistroAtalhoDirective],
  template: `
    <div class="page" appNovoAtalho (appNovoAtalho)="abrirTransportadora('novo')">
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
          <button class="btn-primary" title="Atalho: Ctrl+Alt+N" (click)="abrirTransportadora('novo')">+ Nova Transportadora</button>
        </div>

        <div class="filter-bar">
          <button class="filter-btn" [class.active]="filtroAtivo() === null" (click)="filtrarAtivo(null)">Todos</button>
          <button class="filter-btn" [class.active]="filtroAtivo() === true" (click)="filtrarAtivo(true)">Ativos</button>
          <button class="filter-btn" [class.active]="filtroAtivo() === false" (click)="filtrarAtivo(false)">Inativos</button>
        </div>

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (transportadoras().length === 0) {
          @if (termo) {
            <div class="empty">
              <p>Nenhuma transportadora encontrada pra "{{ termo }}".</p>
              <button class="btn-ghost-sm" (click)="termo = ''; buscar()">Limpar busca</button>
            </div>
          } @else {
            <div class="empty">
              <p>Você ainda não tem nenhuma transportadora cadastrada.</p>
              <button class="btn-primary" (click)="abrirTransportadora('novo')">+ Cadastrar a primeira transportadora</button>
            </div>
          }
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr><th>Razão Social</th><th>CNPJ</th><th>Cidade/UF</th><th>Status</th><th></th></tr>
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
                  <td class="actions-cell">
                    <button class="icon-btn danger" title="Excluir" (click)="$event.stopPropagation(); excluir(t)">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
                      </svg>
                    </button>
                  </td>
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
    .empty p { margin: 0 0 1rem; }
    .btn-ghost-sm { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .45rem .875rem; font-size: 12.5px; cursor: pointer; }
    .filter-bar { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .875rem; }
    .filter-btn { background: var(--bg2); border: 1px solid var(--border); color: var(--text2); border-radius: 20px; padding: 4px 14px; font-size: 12px; cursor: pointer; }
    .filter-btn:hover { border-color: var(--text2); color: var(--text); }
    .filter-btn.active { background: var(--accent); color: #0d0f14; border-color: var(--accent); font-weight: 600; }
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
    .actions-cell { display: flex; gap: 6px; }
    .icon-btn {
      background: none; border: 1px solid var(--border); color: var(--text2);
      border-radius: 6px; padding: 5px; cursor: pointer; display: flex; align-items: center;
      transition: color 120ms, background 120ms, border-color 120ms;
    }
    .icon-btn.danger:hover { color: var(--red); border-color: var(--red); background: rgba(255,77,109,.1); }
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
  private readonly _confirm = inject(ConfirmDialogService);
  private readonly _toast   = inject(ToastService);

  private clienteId = '';
  readonly isCliente = computed(() => this._auth.currentUser()?.perfil === 'Cliente');

  readonly transportadoras = signal<TransportadoraDto[]>([]);
  readonly loading         = signal(false);
  readonly filtroAtivo     = signal<boolean | null>(null);
  termo = '';

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.buscar();
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId]); }

  filtrarAtivo(v: boolean | null): void {
    this.filtroAtivo.set(v);
    this.buscar();
  }

  buscar(): void {
    this.loading.set(true);
    const ativo = this.filtroAtivo();
    this._svc.getAll(this.clienteId, { termo: this.termo, ativo: ativo ?? undefined }).subscribe({
      next: r => { this.transportadoras.set(r.items as TransportadoraDto[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirTransportadora(id: string): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'transportadoras', id]); }

  async excluir(t: TransportadoraDto): Promise<void> {
    const ok = await this._confirm.ask(`Excluir "${t.razaoSocial}"? Esta ação não pode ser desfeita.`, { confirmLabel: 'Excluir' });
    if (!ok) return;
    this._svc.delete(this.clienteId, t.id).subscribe({
      next: () => { this._toast.success('Transportadora excluída!'); this.buscar(); },
      error: err => this._toast.error(extractErrorMessage(err, 'Erro ao excluir transportadora.')),
    });
  }
}
