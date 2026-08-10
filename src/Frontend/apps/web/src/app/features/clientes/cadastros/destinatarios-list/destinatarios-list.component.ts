import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, DestinatarioService, ConfirmDialogService, ToastService, extractErrorMessage } from '@veloxml/services';
import { DestinatarioDto } from '@veloxml/models';
import { NovoRegistroAtalhoDirective } from '../../../../shared/novo-registro-atalho.directive';

@Component({
  selector: 'app-destinatarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NovoRegistroAtalhoDirective],
  template: `
    <div class="page" appNovoAtalho (appNovoAtalho)="abrirDestinatario('novo')">
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
          <div class="header-btns">
            <button class="btn-ghost-sm" [disabled]="exportando()" (click)="exportar()">{{ exportando() ? 'Exportando...' : 'Exportar XLSX' }}</button>
            <button class="btn-ghost-sm" [disabled]="importando()" (click)="fileInput.click()">{{ importando() ? 'Importando...' : 'Importar XLSX' }}</button>
            <input #fileInput type="file" accept=".xlsx" style="display:none" (change)="onImportarArquivo($event)"/>
            <button class="btn-primary" title="Atalho: Ctrl+Alt+N" (click)="abrirDestinatario('novo')">+ Novo Cliente</button>
          </div>
        </div>

        <div class="filter-bar">
          <button class="filter-btn" [class.active]="filtroAtivo() === null" (click)="filtrarAtivo(null)">Todos</button>
          <button class="filter-btn" [class.active]="filtroAtivo() === true" (click)="filtrarAtivo(true)">Ativos</button>
          <button class="filter-btn" [class.active]="filtroAtivo() === false" (click)="filtrarAtivo(false)">Inativos</button>
        </div>

        @if (selecionados().size > 0) {
          <div class="bulk-bar">
            <span class="bulk-count">{{ selecionados().size }} selecionado(s)</span>
            <div class="bulk-actions">
              <button class="btn-ghost-sm" [disabled]="processandoLote()" (click)="bulkAtivar(true)">Ativar</button>
              <button class="btn-ghost-sm" [disabled]="processandoLote()" (click)="bulkAtivar(false)">Desativar</button>
              <button class="btn-ghost-sm danger" [disabled]="processandoLote()" (click)="bulkExcluir()">Excluir</button>
              <button class="btn-ghost-sm" (click)="limparSelecao()">Limpar seleção</button>
            </div>
          </div>
        }

        @if (loading()) {
          <div class="empty">Carregando...</div>
        } @else if (destinatarios().length === 0) {
          @if (termo) {
            <div class="empty">
              <p>Nenhum cliente encontrado pra "{{ termo }}".</p>
              <button class="btn-ghost-sm" (click)="termo = ''; buscar()">Limpar busca</button>
            </div>
          } @else {
            <div class="empty">
              <p>Você ainda não tem nenhum destinatário cadastrado.</p>
              <button class="btn-primary" (click)="abrirDestinatario('novo')">+ Cadastrar o primeiro cliente</button>
            </div>
          }
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th class="checkbox-cell"><input type="checkbox" [checked]="todosSelecionados()" (change)="toggleSelecionarTodos()" (click)="$event.stopPropagation()"/></th>
                <th>Razão Social</th><th>CPF/CNPJ</th><th>Cidade/UF</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (d of destinatarios(); track d.id) {
                <tr class="row-link" [class.row-selected]="selecionados().has(d.id)" (click)="abrirDestinatario(d.id)">
                  <td class="checkbox-cell"><input type="checkbox" [checked]="selecionados().has(d.id)" (change)="toggleSelecionado(d.id)" (click)="$event.stopPropagation()"/></td>
                  <td>
                    <div>{{ d.razaoSocial }}</div>
                    @if (d.nomeFantasia) { <div class="sub-text">{{ d.nomeFantasia }}</div> }
                  </td>
                  <td class="mono">{{ d.cpfCnpj ?? '-' }}</td>
                  <td>{{ d.cidade ? (d.cidade + '/' + d.estado) : '-' }}</td>
                  <td><span class="badge" [class.badge-green]="d.ativo" [class.badge-red]="!d.ativo">{{ d.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                  <td class="actions-cell">
                    <button class="icon-btn danger" title="Excluir" (click)="$event.stopPropagation(); excluir(d)">
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
    .list-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .header-btns { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
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
    .checkbox-cell { width: 32px; }
    .row-selected td { background: var(--accent-dim, rgba(0,102,255,.08)); }
    .bulk-bar {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: .625rem .875rem; margin-bottom: .875rem;
    }
    .bulk-count { font-size: 13px; color: var(--text); font-weight: 600; }
    .bulk-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
    .btn-ghost-sm.danger { color: var(--red); border-color: rgba(255,77,109,.4); }
    .btn-ghost-sm.danger:hover { background: rgba(255,77,109,.1); }
    .btn-ghost-sm:disabled { opacity: .5; cursor: not-allowed; }
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
  private readonly _confirm = inject(ConfirmDialogService);
  private readonly _toast   = inject(ToastService);

  private clienteId = '';
  readonly isCliente = computed(() => this._auth.currentUser()?.perfil === 'Cliente');

  readonly destinatarios = signal<DestinatarioDto[]>([]);
  readonly loading       = signal(false);
  readonly filtroAtivo   = signal<boolean | null>(null);
  termo = '';

  readonly selecionados = signal<Set<string>>(new Set());
  readonly processandoLote = signal(false);
  readonly exportando = signal(false);
  readonly importando = signal(false);
  readonly todosSelecionados = computed(() => {
    const itens = this.destinatarios();
    return itens.length > 0 && itens.every(d => this.selecionados().has(d.id));
  });

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
    this.limparSelecao();
    const ativo = this.filtroAtivo();
    this._destSvc.getAll(this.clienteId, { termo: this.termo, ativo: ativo ?? undefined }).subscribe({
      next: r => { this.destinatarios.set(r.items as DestinatarioDto[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirDestinatario(id: string): void { this._router.navigate(['/clientes', this.clienteId, 'cadastros', 'destinatarios', id]); }

  exportar(): void {
    if (this.exportando()) return;
    this.exportando.set(true);
    const ativo = this.filtroAtivo();
    this._destSvc.exportarXlsx(this.clienteId, this.termo || undefined, ativo ?? undefined).subscribe({
      next: blob => { this.exportando.set(false); this._triggerDownload(blob, 'destinatarios.xlsx'); },
      error: err => { this.exportando.set(false); this._toast.error(extractErrorMessage(err, 'Erro ao exportar destinatários.')); },
    });
  }

  onImportarArquivo(e: Event): void {
    const input = e.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo || this.importando()) return;

    this.importando.set(true);
    this._destSvc.importarXlsx(this.clienteId, arquivo).subscribe({
      next: r => {
        this.importando.set(false);
        if (r.criados > 0) this._toast.success(`${r.criados} destinatário(s) importado(s)!`);
        if (r.erros.length > 0) this._toast.error(`${r.erros.length} linha(s) com erro: ${r.erros[0]}${r.erros.length > 1 ? ' (e outras)' : ''}`);
        this.buscar();
      },
      error: err => { this.importando.set(false); this._toast.error(extractErrorMessage(err, 'Erro ao importar planilha.')); },
    });
  }

  private _triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  toggleSelecionado(id: string): void {
    this.selecionados.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  toggleSelecionarTodos(): void {
    if (this.todosSelecionados()) { this.limparSelecao(); return; }
    this.selecionados.set(new Set(this.destinatarios().map(d => d.id)));
  }

  limparSelecao(): void { this.selecionados.set(new Set()); }

  bulkAtivar(ativo: boolean): void {
    if (this.processandoLote()) return;
    const ids = Array.from(this.selecionados());
    this.processandoLote.set(true);
    this._destSvc.bulkAtivar(this.clienteId, ids, ativo).subscribe({
      next: () => {
        this.processandoLote.set(false);
        this._toast.success(`${ids.length} destinatário(s) ${ativo ? 'ativado(s)' : 'desativado(s)'}!`);
        this.buscar();
      },
      error: err => { this.processandoLote.set(false); this._toast.error(extractErrorMessage(err, 'Erro ao atualizar destinatários.')); },
    });
  }

  async bulkExcluir(): Promise<void> {
    if (this.processandoLote()) return;
    const ids = Array.from(this.selecionados());
    const ok = await this._confirm.ask(`Excluir ${ids.length} destinatário(s) selecionado(s)? Esta ação não pode ser desfeita.`, { confirmLabel: 'Excluir' });
    if (!ok) return;

    this.processandoLote.set(true);
    forkJoin(ids.map(id => this._destSvc.delete(this.clienteId, id).pipe(catchError(() => of('erro' as const))))).subscribe(resultados => {
      this.processandoLote.set(false);
      const falhas = resultados.filter(r => r === 'erro').length;
      const sucesso = resultados.length - falhas;
      if (sucesso > 0) this._toast.success(`${sucesso} destinatário(s) excluído(s)!`);
      if (falhas > 0) this._toast.error(`${falhas} destinatário(s) não puderam ser excluídos.`);
      this.buscar();
    });
  }

  async excluir(d: DestinatarioDto): Promise<void> {
    const ok = await this._confirm.ask(`Excluir "${d.razaoSocial}"? Esta ação não pode ser desfeita.`, { confirmLabel: 'Excluir' });
    if (!ok) return;
    this._destSvc.delete(this.clienteId, d.id).subscribe({
      next: () => { this._toast.success('Destinatário excluído!'); this.buscar(); },
      error: err => this._toast.error(extractErrorMessage(err, 'Erro ao excluir destinatário.')),
    });
  }
}
