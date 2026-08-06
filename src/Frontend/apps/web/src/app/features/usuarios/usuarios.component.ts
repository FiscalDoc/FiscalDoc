import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { UsuarioService } from '@veloxml/services';
import { UsuarioDto } from '@veloxml/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
<div class="page">

  <header class="page-header">
    <div>
      <h2 class="font-heading">Usuários</h2>
      <p class="page-sub">{{ total() }} usuário(s) cadastrado(s)</p>
    </div>
    <button class="btn-primary" (click)="abrirUsuario('novo')">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      Novo Usuário
    </button>
  </header>

  <div class="toolbar">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
      </svg>
      <input class="search-input" type="text" placeholder="Buscar por nome ou e-mail..."
        [value]="termo()" (input)="onSearch($event)" />
    </div>
    <select class="search-input" style="max-width:200px;cursor:pointer;"
      [value]="filtroPerfil()" (change)="onPerfilChange($event)">
      <option value="">Todos os perfis</option>
      <option value="Administrador">Administrador</option>
      <option value="Contador">Contador</option>
      <option value="UsuarioContador">Usuário Contador</option>
      <option value="Cliente">Cliente</option>
    </select>
  </div>

  <div class="card">
    @if (loading()) {
      <div class="empty-state">Carregando...</div>
    } @else if (usuarios().length === 0) {
      <div class="empty-state">Nenhum usuário encontrado.</div>
    } @else {
      <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Perfil</th>
            <th>Contador</th>
            <th>Status</th>
            <th>2FA</th>
            <th>Cadastro</th>
          </tr>
        </thead>
        <tbody>
          @for (u of usuarios(); track u.id) {
            <tr class="row-link" (click)="abrirUsuario(u.id)">
              <td>
                <div class="cell-name">
                  <div class="avatar">{{ initial(u.nome) }}</div>
                  <div>
                    <div class="cell-title">{{ u.nome }}</div>
                    <div class="cell-sub">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="perfilClass(u.perfil)">{{ u.perfil }}</span>
              </td>
              <td>
                <span class="cell-muted">{{ u.nomeContador ?? '—' }}</span>
              </td>
              <td>
                <span class="badge" [class.badge-green]="u.ativo" [class.badge-red]="!u.ativo">
                  {{ u.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                @if (u.twoFactorHabilitado) {
                  <span class="badge badge-green">Ativo</span>
                } @else {
                  <span class="cell-muted">—</span>
                }
              </td>
              <td class="cell-muted">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
            </tr>
          }
        </tbody>
      </table>
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" [disabled]="page() === 1" (click)="changePage(page()-1)">‹ Anterior</button>
          <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="page() === totalPages()" (click)="changePage(page()+1)">Próximo ›</button>
        </div>
      }
    }
  </div>
</div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-header h2 { font-size: 1.5rem; margin: 0; }
    .page-sub { color: var(--text2); font-size: 13px; margin-top: 2px; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.88; }

    .toolbar { display: flex; gap: .75rem; }
    .search-wrap { position: relative; flex: 1; max-width: 380px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text2); pointer-events: none; }
    .search-input {
      width: 100%; box-sizing: border-box; background: var(--bg2); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); padding: .45rem .75rem .45rem 2rem; font-size: 13px; outline: none;
    }
    .search-input:focus { border-color: var(--accent); }
    select.search-input { padding-left: .75rem; }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th {
      padding: .625rem 1rem; text-align: left; font-size: 10.5px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .05em; color: var(--text2);
      border-bottom: 1px solid var(--border); background: var(--bg3);
    }
    .table td { padding: .75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover td { background: rgba(255,255,255,.02); }
    .row-link { cursor: pointer; }

    .cell-name { display: flex; align-items: center; gap: .625rem; }
    .cell-title { font-weight: 500; }
    .cell-sub { font-size: 11.5px; color: var(--text2); margin-top: 1px; }
    .cell-muted { color: var(--text2); font-size: 13px; }

    .avatar {
      width: 32px; height: 32px; border-radius: 50%; background: var(--accent-dim); color: var(--accent);
      font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green  { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-red    { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-blue   { background: rgba(0,102,255,.12);  color: #4d94ff; }
    .badge-yellow { background: rgba(255,209,102,.15); color: var(--yellow); }
    .badge-gray   { background: var(--bg3); color: var(--text2); }

    .empty-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: .875rem 1rem; border-top: 1px solid var(--border); }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 12px; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { font-size: 13px; color: var(--text2); }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 700px; }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; gap: .75rem; }
      .btn-primary { justify-content: center; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-wrap { max-width: none; }
      select.search-input { max-width: none !important; }
    }
  `]
})
export class UsuariosComponent implements OnInit {
  private readonly _svc    = inject(UsuarioService);
  private readonly _router = inject(Router);

  usuarios      = signal<UsuarioDto[]>([]);
  loading       = signal(true);
  termo         = signal('');
  filtroPerfil  = signal('');
  total         = signal(0);
  page          = signal(1);
  totalPages    = signal(1);

  private _timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._svc.getAll({ termo: this.termo() || undefined, perfil: this.filtroPerfil() || undefined, page: this.page(), pageSize: 50 })
      .subscribe({
        next: r => { this.usuarios.set(r.items); this.total.set(r.totalCount); this.totalPages.set(r.totalPages); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  onSearch(e: Event): void {
    this.termo.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.load(), 350);
  }

  onPerfilChange(e: Event): void {
    this.filtroPerfil.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  changePage(p: number): void { this.page.set(p); this.load(); }

  abrirUsuario(id: string): void { this._router.navigate(['/usuarios', id]); }

  initial(nome: string): string { return nome?.charAt(0)?.toUpperCase() ?? '?'; }

  perfilClass(p: string): string {
    const map: Record<string, string> = {
      Administrador: 'badge-red',
      Contador: 'badge-green',
      UsuarioContador: 'badge-blue',
      Cliente: 'badge-yellow',
    };
    return map[p] ?? 'badge-gray';
  }
}
