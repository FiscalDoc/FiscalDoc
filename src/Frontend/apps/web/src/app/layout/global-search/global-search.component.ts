import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { forkJoin } from 'rxjs';
import { AuthService, PedidoService, ProdutoService, DestinatarioService, TransportadoraService, ClienteService } from '@veloxml/services';

interface ResultadoBusca {
  tipo: string;
  titulo: string;
  subtitulo?: string;
  route: string[];
}

// Busca global (Ctrl+K / Cmd+K), montada uma vez no Shell. Escopo dos resultados depende do
// perfil logado: Cliente busca dentro dos próprios pedidos/produtos/destinatários/
// transportadoras; Contador/Administrador busca na base de Clientes — cada um reaproveitando
// o mesmo getAll({termo}) que as telas de listagem já usam, sem endpoint novo no backend.
@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (visivel()) {
      <div class="overlay" (click)="fechar()">
        <div class="palette" (click)="$event.stopPropagation()">
          <div class="search-row">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input #inputEl class="search-input" [(ngModel)]="termo" (ngModelChange)="onTermoChange()"
              (keydown)="onKeydown($event)" placeholder="Buscar pedidos, produtos, clientes, transportadoras..." autocomplete="off"/>
            <kbd class="esc-hint">Esc</kbd>
          </div>

          @if (buscando()) {
            <div class="palette-hint">Buscando...</div>
          } @else if (termo.trim().length < 2) {
            <div class="palette-hint">Digite pelo menos 2 letras.</div>
          } @else if (resultados().length === 0) {
            <div class="palette-hint">Nada encontrado pra "{{ termo }}".</div>
          } @else {
            <div class="results">
              @for (r of resultados(); track r.tipo + r.titulo + $index; let i = $index) {
                <button type="button" class="result-item" [class.active]="i === indiceAtivo()"
                  (mouseenter)="indiceAtivo.set(i)" (click)="abrir(r)">
                  <span class="result-tipo">{{ r.tipo }}</span>
                  <span class="result-titulo">{{ r.titulo }}</span>
                  @if (r.subtitulo) { <span class="result-sub">{{ r.subtitulo }}</span> }
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: flex-start; justify-content: center; z-index: 1050; padding: 10vh 1rem 1rem; }
    .palette { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius, 10px); width: 100%; max-width: 560px; max-height: 70vh; display: flex; flex-direction: column; box-shadow: 0 12px 32px rgba(0,0,0,.45); overflow: hidden; }
    .search-row { display: flex; align-items: center; gap: 10px; padding: .9rem 1.1rem; border-bottom: 1px solid var(--border); color: var(--text2); }
    .search-input { flex: 1; background: none; border: none; outline: none; color: var(--text); font-size: 14.5px; font-family: inherit; }
    .esc-hint { font-size: 10.5px; color: var(--text2); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }
    .palette-hint { padding: 1.5rem; text-align: center; color: var(--text2); font-size: 13px; }
    .results { overflow-y: auto; padding: .4rem; }
    .result-item {
      width: 100%; display: flex; align-items: center; gap: 10px; text-align: left;
      background: none; border: none; border-radius: 8px; padding: .55rem .75rem; cursor: pointer;
      font-family: inherit; font-size: 13.5px; color: var(--text);
    }
    .result-item.active, .result-item:hover { background: rgba(255,255,255,.06); }
    .result-tipo {
      flex-shrink: 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
      color: var(--accent); background: rgba(0, 229, 160, .1); border-radius: 4px; padding: 2px 6px;
    }
    .result-titulo { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .result-sub { flex-shrink: 0; color: var(--text2); font-size: 12px; }
  `],
})
export class GlobalSearchComponent {
  private readonly _auth = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _pedidoSvc = inject(PedidoService);
  private readonly _produtoSvc = inject(ProdutoService);
  private readonly _destSvc = inject(DestinatarioService);
  private readonly _transpSvc = inject(TransportadoraService);
  private readonly _clienteSvc = inject(ClienteService);

  @ViewChild('inputEl') private _inputEl?: ElementRef<HTMLInputElement>;

  readonly visivel = signal(false);
  readonly buscando = signal(false);
  readonly resultados = signal<ResultadoBusca[]>([]);
  readonly indiceAtivo = signal(0);
  termo = '';

  private _debounce: ReturnType<typeof setTimeout> | null = null;
  private _reqToken = 0;

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.abrirPalette();
    } else if (e.key === 'Escape' && this.visivel()) {
      this.fechar();
    }
  }

  abrirPalette(): void {
    this.visivel.set(true);
    this.termo = '';
    this.resultados.set([]);
    this.indiceAtivo.set(0);
    setTimeout(() => this._inputEl?.nativeElement.focus(), 0);
  }

  fechar(): void {
    this.visivel.set(false);
  }

  onTermoChange(): void {
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = setTimeout(() => this._buscar(), 300);
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.indiceAtivo.update(i => Math.min(i + 1, this.resultados().length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.indiceAtivo.update(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const r = this.resultados()[this.indiceAtivo()];
      if (r) this.abrir(r);
    }
  }

  abrir(r: ResultadoBusca): void {
    this._router.navigate(r.route);
    this.fechar();
  }

  private _buscar(): void {
    const termo = this.termo.trim();
    if (termo.length < 2) { this.resultados.set([]); return; }

    const token = ++this._reqToken;
    this.buscando.set(true);
    const user = this._auth.currentUser();

    if (user?.perfil === 'Cliente' && user.clienteId) {
      const id = user.clienteId;
      forkJoin({
        pedidos: this._pedidoSvc.getAll(id, { termo, pageSize: 5 }).pipe(catchError(() => of(null))),
        produtos: this._produtoSvc.getAll(id, { termo, pageSize: 5 }).pipe(catchError(() => of(null))),
        destinatarios: this._destSvc.getAll(id, { termo, pageSize: 5 }).pipe(catchError(() => of(null))),
        transportadoras: this._transpSvc.getAll(id, { termo, pageSize: 5 }).pipe(catchError(() => of(null))),
      }).subscribe(res => {
        if (token !== this._reqToken) return;
        this.buscando.set(false);
        const resultados: ResultadoBusca[] = [
          ...(res.pedidos?.items ?? []).map(p => ({
            tipo: 'Pedido', titulo: `Pedido nº ${p.numero}`, subtitulo: p.destinatarioNome,
            route: ['/clientes', id, 'pedidos', p.id],
          })),
          ...(res.produtos?.items ?? []).map(p => ({
            tipo: 'Produto', titulo: p.descricao, subtitulo: p.codigo,
            route: ['/clientes', id, 'cadastros', 'produtos', p.id],
          })),
          ...(res.destinatarios?.items ?? []).map(d => ({
            tipo: 'Cliente', titulo: d.razaoSocial, subtitulo: d.cpfCnpj,
            route: ['/clientes', id, 'cadastros', 'destinatarios', d.id],
          })),
          ...(res.transportadoras?.items ?? []).map(t => ({
            tipo: 'Transportadora', titulo: t.razaoSocial, subtitulo: t.cpfCnpj,
            route: ['/clientes', id, 'cadastros', 'transportadoras', t.id],
          })),
        ];
        this.resultados.set(resultados);
        this.indiceAtivo.set(0);
      });
    } else {
      this._clienteSvc.getAll({ termo, pageSize: 8 }).pipe(catchError(() => of(null))).subscribe(res => {
        if (token !== this._reqToken) return;
        this.buscando.set(false);
        this.resultados.set((res?.items ?? []).map(c => ({
          tipo: 'Cliente', titulo: c.razaoSocial, subtitulo: c.cnpj, route: ['/clientes', c.id],
        })));
        this.indiceAtivo.set(0);
      });
    }
  }
}
