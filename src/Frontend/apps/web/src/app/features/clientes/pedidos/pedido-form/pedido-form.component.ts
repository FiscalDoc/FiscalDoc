import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService, ProdutoService, DestinatarioService, extractErrorMessage } from '@veloxml/services';
import { PedidoDto, ProdutoDto, DestinatarioDto, PedidoItemInput, CreatePedidoRequest } from '@veloxml/models';

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Pedidos
        </button>
        <div class="header-top">
          <div class="title-row">
            <h2 class="page-title">{{ isNew() ? 'Novo Pedido' : 'Pedido #' + numero() }}</h2>
            @if (!isNew()) {
              <span class="badge" [class]="statusClass()">{{ pedidoStatus() }}</span>
            }
          </div>
          @if (!isNew()) {
            <div class="header-actions">
              <button class="btn-ghost" (click)="imprimir()">Imprimir</button>
              @if (pedidoStatus() === 'Rascunho') {
                <button class="btn-ghost" [disabled]="emitindo()" (click)="emitir()">
                  {{ emitindo() ? 'Emitindo...' : 'Emitir Pedido' }}
                </button>
              }
              @if (pedidoStatus() !== 'Cancelado') {
                <button class="btn-ghost danger" [disabled]="cancelando()" (click)="cancelar()">
                  {{ cancelando() ? 'Cancelando...' : 'Cancelar Pedido' }}
                </button>
              }
            </div>
          }
        </div>
      </div>

      @if (readonly()) {
        <div class="alert-info">Este pedido está com status "{{ pedidoStatus() }}" e não pode mais ser editado.</div>
      }

      <div class="card section">
        <h4 class="section-title">Destinatário</h4>
        <div class="form-grid">
          <div class="field col-2">
            <label class="label">Destinatário *</label>
            <select class="input" [disabled]="readonly()" [(ngModel)]="form.destinatarioId">
              <option value="">Selecione...</option>
              @for (d of destinatarios(); track d.id) {
                <option [value]="d.id">{{ d.razaoSocial }}{{ d.nomeFantasia ? ' — ' + d.nomeFantasia : '' }}</option>
              }
            </select>
          </div>
          <div class="field col-2">
            <label class="label">Observações (uso interno)</label>
            <textarea class="input" [disabled]="readonly()" [(ngModel)]="form.observacoes" rows="2" placeholder="Opcional"></textarea>
          </div>
        </div>
      </div>

      <div class="card section">
        <h4 class="section-title">Dados Fiscais</h4>
        <div class="form-grid">
          <div class="field col-2">
            <label class="label">Natureza da Operação *</label>
            <input class="input" [disabled]="readonly()" [(ngModel)]="form.naturezaOperacao" placeholder="Venda de mercadoria"/>
          </div>
          <div class="field">
            <label class="label">Data de Saída prevista</label>
            <input class="input" type="date" [disabled]="readonly()" [(ngModel)]="form.dataSaida"/>
          </div>
          <div class="field">
            <label class="label">Forma de Pagamento</label>
            <select class="input" [disabled]="readonly()" [(ngModel)]="form.formaPagamento">
              <option value="">Não informado</option>
              <option value="AVista">À vista</option>
              <option value="APrazo">A prazo</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Meio de Pagamento</label>
            <select class="input" [disabled]="readonly()" [(ngModel)]="form.meioPagamento">
              <option value="">Não informado</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartao">Cartão</option>
              <option value="Pix">PIX</option>
              <option value="Boleto">Boleto</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="field col-2">
            <label class="label">Informações Complementares</label>
            <textarea class="input" [disabled]="readonly()" [(ngModel)]="form.informacoesComplementares" rows="2" placeholder="Texto que vai para a nota fiscal (opcional)"></textarea>
          </div>
        </div>
      </div>

      <div class="card section">
        <div class="list-header">
          <h4 class="section-title">Itens</h4>
          @if (!readonly()) {
            <button class="btn-ghost-sm" (click)="adicionarItem()">+ Adicionar item</button>
          }
        </div>

        @if (itens().length === 0) {
          <div class="empty">Nenhum item adicionado.</div>
        } @else {
          <table class="table">
            <thead>
              <tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Desconto</th><th>Total</th>@if (!readonly()) { <th></th> }</tr>
            </thead>
            <tbody>
              @for (item of itens(); track $index; let i = $index) {
                <tr>
                  <td>
                    <select class="input-sm" [class.error]="rowErrors().has(i)" [disabled]="readonly()" [(ngModel)]="item.produtoId" (change)="preencherProduto(i)">
                      <option value="">Selecione...</option>
                      @for (p of produtos(); track p.id) {
                        <option [value]="p.id">{{ p.codigo }} — {{ p.descricao }}</option>
                      }
                    </select>
                  </td>
                  <td><input class="input-sm num" [class.error]="rowErrors().has(i)" [disabled]="readonly()" type="number" [(ngModel)]="item.quantidade" (input)="calcTotal(i)" min="0.001" step="0.001"/></td>
                  <td><input class="input-sm num" [class.error]="rowErrors().has(i)" [disabled]="readonly()" type="number" [(ngModel)]="item.precoUnitario" (input)="calcTotal(i)" min="0" step="0.01"/></td>
                  <td><input class="input-sm num" [disabled]="readonly()" type="number" [(ngModel)]="item.desconto" (input)="calcTotal(i)" min="0" step="0.01"/></td>
                  <td class="total-cell">{{ itemTotal(item) | currency:'BRL':'symbol':'1.2-2' }}</td>
                  @if (!readonly()) {
                    <td><button class="row-btn danger" (click)="removerItem(i)">✕</button></td>
                  }
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="total-label">Total do Pedido</td>
                <td class="total-value" colspan="2">{{ valorTotal() | currency:'BRL':'symbol':'1.2-2' }}</td>
              </tr>
            </tfoot>
          </table>
        }
      </div>

      @if (erro()) { <div class="alert-error">{{ erro() }}</div> }

      <div class="form-actions">
        <button class="btn-ghost" (click)="goBack()">{{ readonly() ? 'Voltar' : 'Cancelar' }}</button>
        @if (!readonly()) {
          <button class="btn-primary" [disabled]="salvando()" (click)="salvar()">
            {{ salvando() ? 'Salvando...' : 'Salvar Pedido' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; align-self: flex-start; }
    .back-btn:hover { color: var(--accent); }
    .header-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; }
    .title-row { display: flex; align-items: center; gap: .75rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .header-actions { display: flex; align-items: center; gap: .5rem; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-rascunho { background: rgba(124,130,153,.15); color: var(--text2); }
    .badge-emitido  { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-cancelado { background: rgba(255,77,109,.12); color: var(--red); }
    .btn-ghost.danger { color: var(--red); border-color: rgba(255,77,109,.35); }
    .btn-ghost.danger:hover:not(:disabled) { background: rgba(255,77,109,.1); border-color: var(--red); }
    .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .list-header { display: flex; align-items: center; justify-content: space-between; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input, textarea.input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .input:focus, textarea.input:focus { border-color: var(--accent); }
    .input:disabled, textarea.input:disabled { opacity: .6; cursor: not-allowed; }
    .input-sm { background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 4px 8px; font-size: 12.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .input-sm:focus { border-color: var(--accent); }
    .input-sm:disabled { opacity: .6; cursor: not-allowed; }
    .input-sm.num { text-align: right; }
    .input-sm.error, select.input-sm.error { border-color: var(--red); }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 1.5rem; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .table tfoot td { border-top: 1px solid var(--border); border-bottom: none; padding: 10px 8px; }
    .total-cell { text-align: right; font-variant-numeric: tabular-nums; }
    .total-label { text-align: right; font-weight: 600; color: var(--text2); font-size: 12px; }
    .total-value { text-align: right; font-weight: 700; color: var(--accent); font-size: 14px; }
    .row-btn { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer; }
    .row-btn.danger:hover { color: var(--red); border-color: var(--red); }
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-info { background: rgba(124,130,153,.1); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .form-actions { display: flex; align-items: center; justify-content: space-between; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .btn-ghost-sm { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .btn-ghost-sm:hover { color: var(--accent); border-color: var(--accent); }
  `],
})
export class PedidoFormComponent implements OnInit {
  private readonly _pedidoSvc = inject(PedidoService);
  private readonly _prodSvc   = inject(ProdutoService);
  private readonly _destSvc   = inject(DestinatarioService);
  private readonly _route     = inject(ActivatedRoute);
  private readonly _router    = inject(Router);

  private clienteId = '';
  private pedidoId  = '';

  readonly isNew    = signal(true);
  readonly salvando = signal(false);
  readonly erro     = signal<string | null>(null);
  readonly produtos       = signal<ProdutoDto[]>([]);
  readonly destinatarios  = signal<DestinatarioDto[]>([]);
  readonly pedidoStatus   = signal<string>('Rascunho');
  readonly numero         = signal<number | null>(null);
  readonly emitindo       = signal(false);
  readonly cancelando     = signal(false);

  readonly readonly = computed(() => !this.isNew() && this.pedidoStatus() !== 'Rascunho');

  itens = signal<PedidoItemInput[]>([]);
  readonly rowErrors = signal<Set<number>>(new Set());

  form = this._emptyForm();

  readonly valorTotal = computed(() =>
    this.itens().reduce((sum, i) => sum + this.itemTotal(i), 0)
  );

  ngOnInit(): void {
    this.clienteId = this._route.snapshot.paramMap.get('id')!;
    this.pedidoId  = this._route.snapshot.paramMap.get('pedidoId') ?? '';
    this.isNew.set(!this.pedidoId || this.pedidoId === 'novo');

    this._prodSvc.getAll(this.clienteId, { pageSize: 200 }).subscribe({ next: r => this.produtos.set(r.items as ProdutoDto[]) });
    this._destSvc.getAll(this.clienteId, { pageSize: 200 }).subscribe({ next: r => this.destinatarios.set(r.items as DestinatarioDto[]) });

    if (!this.isNew()) {
      this._pedidoSvc.getById(this.clienteId, this.pedidoId).subscribe({
        next: p => this._carregarPedido(p),
      });
    }
  }

  private _emptyForm() {
    return {
      destinatarioId: '', observacoes: '', naturezaOperacao: 'Venda de mercadoria',
      dataSaida: '', formaPagamento: '', meioPagamento: '', informacoesComplementares: '',
    };
  }

  private _carregarPedido(p: PedidoDto): void {
    this.pedidoStatus.set(p.status);
    this.numero.set(p.numero);
    this.form = {
      destinatarioId: p.destinatarioId, observacoes: p.observacoes ?? '',
      naturezaOperacao: p.naturezaOperacao || 'Venda de mercadoria',
      dataSaida: p.dataSaida ? p.dataSaida.slice(0, 10) : '',
      formaPagamento: p.formaPagamento ?? '', meioPagamento: p.meioPagamento ?? '',
      informacoesComplementares: p.informacoesComplementares ?? '',
    };
    this.itens.set(p.itens.map(i => ({
      produtoId: i.produtoId,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      desconto: i.desconto,
      cfop: i.cfop,
      ncm: i.ncm,
      aliquotaIcms: i.aliquotaIcms,
      aliquotaPis: i.aliquotaPis,
      aliquotaCofins: i.aliquotaCofins,
    })));
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId, 'pedidos']); }

  imprimir(): void {
    window.open(`/imprimir/pedidos/${this.clienteId}/${this.pedidoId}`, '_blank');
  }

  emitir(): void {
    if (this.emitindo()) return;
    if (!confirm(`Emitir o pedido #${this.numero()}? Depois de emitido ele não poderá mais ser editado.`)) return;
    this.emitindo.set(true);
    this.erro.set(null);
    this._pedidoSvc.emitir(this.clienteId, this.pedidoId).subscribe({
      next: p => { this.emitindo.set(false); this._carregarPedido(p); },
      error: err => { this.emitindo.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao emitir pedido.')); },
    });
  }

  cancelar(): void {
    if (this.cancelando()) return;
    if (!confirm(`Cancelar o pedido #${this.numero()}? Esta ação não pode ser desfeita.`)) return;
    this.cancelando.set(true);
    this.erro.set(null);
    this._pedidoSvc.cancelar(this.clienteId, this.pedidoId).subscribe({
      next: () => { this.cancelando.set(false); this.pedidoStatus.set('Cancelado'); },
      error: err => { this.cancelando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao cancelar pedido.')); },
    });
  }

  statusClass(): string {
    return {
      Rascunho: 'badge badge-rascunho',
      Emitido: 'badge badge-emitido',
      Cancelado: 'badge badge-cancelado',
    }[this.pedidoStatus()] ?? 'badge';
  }

  adicionarItem(): void {
    this.itens.update(l => [...l, {
      produtoId: '', descricao: '', unidade: 'UN',
      quantidade: 1, precoUnitario: 0, desconto: 0,
      aliquotaIcms: 0, aliquotaPis: 0, aliquotaCofins: 0,
    }]);
  }

  removerItem(i: number): void {
    this.itens.update(l => l.filter((_, idx) => idx !== i));
  }

  preencherProduto(i: number): void {
    const item = this.itens()[i];
    const prod = this.produtos().find(p => p.id === item.produtoId);
    if (!prod) return;
    this.itens.update(l => l.map((it, idx) => idx !== i ? it : {
      ...it,
      descricao: prod.descricao,
      unidade: prod.unidade,
      precoUnitario: prod.precoUnitario,
      cfop: prod.cfop,
      ncm: prod.ncm,
      aliquotaIcms: prod.aliquotaIcms,
      aliquotaPis: prod.aliquotaPis,
      aliquotaCofins: prod.aliquotaCofins,
    }));
  }

  calcTotal(_i: number): void {
    // ngModel muta o objeto do item diretamente (não passa por itens.set()),
    // então o signal "itens" nunca emite mudança sozinho. Recriar o array
    // força o computed valorTotal (e o total por linha) a recalcular na hora.
    this.itens.update(l => [...l]);
  }

  itemTotal(item: PedidoItemInput): number {
    return Math.max(0, (+item.quantidade * +item.precoUnitario) - +item.desconto);
  }

  private _validarItens(): boolean {
    const invalidas = new Set<number>();
    let primeiraMensagem: string | null = null;

    this.itens().forEach((item, i) => {
      let msg: string | null = null;
      if (!item.produtoId) msg = `Selecione o produto do item ${i + 1}.`;
      else if (!item.quantidade || item.quantidade <= 0) msg = `Informe uma quantidade válida para o item ${i + 1}.`;
      else if (item.precoUnitario < 0) msg = `Preço unitário do item ${i + 1} não pode ser negativo.`;

      if (msg) {
        invalidas.add(i);
        primeiraMensagem ??= msg;
      }
    });

    this.rowErrors.set(invalidas);
    if (primeiraMensagem) { this.erro.set(primeiraMensagem); return false; }
    return true;
  }

  salvar(): void {
    if (this.salvando()) return;
    if (!this.form.destinatarioId) { this.erro.set('Selecione um destinatário.'); return; }
    if (!this.form.naturezaOperacao.trim()) { this.erro.set('Informe a natureza da operação.'); return; }
    if (this.itens().length === 0) { this.erro.set('Adicione pelo menos um item.'); return; }
    if (!this._validarItens()) return;

    this.salvando.set(true);
    this.erro.set(null);

    const camposFiscais = {
      naturezaOperacao: this.form.naturezaOperacao,
      dataSaida: this.form.dataSaida || undefined,
      formaPagamento: (this.form.formaPagamento || undefined) as CreatePedidoRequest['formaPagamento'],
      meioPagamento: (this.form.meioPagamento || undefined) as CreatePedidoRequest['meioPagamento'],
      informacoesComplementares: this.form.informacoesComplementares || undefined,
    };

    if (this.isNew()) {
      const req: CreatePedidoRequest = {
        clienteId: this.clienteId,
        destinatarioId: this.form.destinatarioId,
        observacoes: this.form.observacoes || undefined,
        itens: this.itens(),
        ...camposFiscais,
      };
      this._pedidoSvc.create(req).subscribe({
        next: () => { this.salvando.set(false); this.goBack(); },
        error: (err) => { this.salvando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao criar pedido.')); },
      });
    } else {
      this._pedidoSvc.update(this.clienteId, this.pedidoId, {
        id: this.pedidoId,
        destinatarioId: this.form.destinatarioId,
        observacoes: this.form.observacoes || undefined,
        itens: this.itens(),
        ...camposFiscais,
      }).subscribe({
        next: () => { this.salvando.set(false); this.goBack(); },
        error: (err) => { this.salvando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao atualizar pedido.')); },
      });
    }
  }
}
