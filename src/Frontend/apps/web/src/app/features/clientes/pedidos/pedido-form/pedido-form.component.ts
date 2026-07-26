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
        <h2 class="page-title">{{ isNew() ? 'Novo Pedido' : 'Editar Pedido' }}</h2>
      </div>

      <div class="card section">
        <h4 class="section-title">Destinatário</h4>
        <div class="form-grid">
          <div class="field col-2">
            <label class="label">Destinatário *</label>
            <select class="input" [(ngModel)]="form.destinatarioId">
              <option value="">Selecione...</option>
              @for (d of destinatarios(); track d.id) {
                <option [value]="d.id">{{ d.razaoSocial }}{{ d.nomeFantasia ? ' — ' + d.nomeFantasia : '' }}</option>
              }
            </select>
          </div>
          <div class="field col-2">
            <label class="label">Observações</label>
            <textarea class="input" [(ngModel)]="form.observacoes" rows="2" placeholder="Opcional"></textarea>
          </div>
        </div>
      </div>

      <div class="card section">
        <div class="list-header">
          <h4 class="section-title">Itens</h4>
          <button class="btn-ghost-sm" (click)="adicionarItem()">+ Adicionar item</button>
        </div>

        @if (itens().length === 0) {
          <div class="empty">Nenhum item adicionado.</div>
        } @else {
          <table class="table">
            <thead>
              <tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Desconto</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              @for (item of itens(); track $index; let i = $index) {
                <tr>
                  <td>
                    <select class="input-sm" [(ngModel)]="item.produtoId" (change)="preencherProduto(i)">
                      <option value="">Selecione...</option>
                      @for (p of produtos(); track p.id) {
                        <option [value]="p.id">{{ p.codigo }} — {{ p.descricao }}</option>
                      }
                    </select>
                  </td>
                  <td><input class="input-sm num" type="number" [(ngModel)]="item.quantidade" (input)="calcTotal(i)" min="0.001" step="0.001"/></td>
                  <td><input class="input-sm num" type="number" [(ngModel)]="item.precoUnitario" (input)="calcTotal(i)" min="0" step="0.01"/></td>
                  <td><input class="input-sm num" type="number" [(ngModel)]="item.desconto" (input)="calcTotal(i)" min="0" step="0.01"/></td>
                  <td class="total-cell">{{ itemTotal(item) | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td><button class="row-btn danger" (click)="removerItem(i)">✕</button></td>
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
        <button class="btn-ghost" (click)="goBack()">Cancelar</button>
        <div class="actions-right">
          <button class="btn-nfe" disabled title="Em breve">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Gerar NF-e
          </button>
          <button class="btn-primary" [disabled]="salvando()" (click)="salvar()">
            {{ salvando() ? 'Salvando...' : 'Salvar Pedido' }}
          </button>
        </div>
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
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .list-header { display: flex; align-items: center; justify-content: space-between; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .col-2 { grid-column: span 2; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input, textarea.input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .input:focus, textarea.input:focus { border-color: var(--accent); }
    .input-sm { background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 4px 8px; font-size: 12.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .input-sm:focus { border-color: var(--accent); }
    .input-sm.num { text-align: right; }
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
    .form-actions { display: flex; align-items: center; justify-content: space-between; }
    .actions-right { display: flex; align-items: center; gap: .75rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .btn-ghost-sm { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .btn-ghost-sm:hover { color: var(--accent); border-color: var(--accent); }
    .btn-nfe {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--bg3); border: 1px dashed var(--border); color: var(--text2);
      border-radius: 8px; padding: .5rem 1rem; font-size: 13px; cursor: not-allowed; opacity: .5;
    }
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

  itens = signal<PedidoItemInput[]>([]);

  form = { destinatarioId: '', observacoes: '' };

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

  private _carregarPedido(p: PedidoDto): void {
    this.form = { destinatarioId: p.destinatarioId, observacoes: p.observacoes ?? '' };
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

  calcTotal(_i: number): void { /* triggers computed */ }

  itemTotal(item: PedidoItemInput): number {
    return Math.max(0, (+item.quantidade * +item.precoUnitario) - +item.desconto);
  }

  salvar(): void {
    if (this.salvando()) return;
    if (!this.form.destinatarioId) { this.erro.set('Selecione um destinatário.'); return; }
    if (this.itens().length === 0) { this.erro.set('Adicione pelo menos um item.'); return; }

    this.salvando.set(true);
    this.erro.set(null);

    if (this.isNew()) {
      const req: CreatePedidoRequest = {
        clienteId: this.clienteId,
        destinatarioId: this.form.destinatarioId,
        observacoes: this.form.observacoes || undefined,
        itens: this.itens(),
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
      }).subscribe({
        next: () => { this.salvando.set(false); this.goBack(); },
        error: (err) => { this.salvando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao atualizar pedido.')); },
      });
    }
  }
}
