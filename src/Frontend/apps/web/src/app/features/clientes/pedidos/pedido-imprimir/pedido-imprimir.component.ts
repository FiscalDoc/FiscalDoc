import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PedidoService, ClienteService } from '@veloxml/services';
import { PedidoDto, ClienteDto } from '@veloxml/models';

const FORMA_PAGAMENTO_LABEL: Record<string, string> = { AVista: 'À vista', APrazo: 'A prazo' };
const MEIO_PAGAMENTO_LABEL: Record<string, string> = { Dinheiro: 'Dinheiro', Cartao: 'Cartão', Pix: 'PIX', Boleto: 'Boleto', Outros: 'Outros' };

@Component({
  selector: 'app-pedido-imprimir',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="no-print loading-state">Carregando...</div>
    } @else if (!pedido() || !cliente()) {
      <div class="no-print loading-state">Não foi possível carregar o pedido.</div>
    } @else {
      <div class="toolbar no-print">
        <button class="btn-ghost" (click)="fechar()">Fechar</button>
        <button class="btn-primary" (click)="print()">Imprimir novamente</button>
      </div>

      <div class="sheet">
        <div class="print-brand">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="6" y="4" width="20" height="24" rx="3" fill="#1a1e28" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
            <path d="M10 9h12M10 13h12M10 17h8" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round"/>
            <rect x="4" y="2" width="12" height="12" rx="3" fill="#0d0f14" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
            <path d="M10 5v6M7 8h6" stroke="#00c98d" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="print-brand-name"><strong>Fiscal</strong>Doc</span>
        </div>

        <header class="sheet-header">
          <div>
            <h1>{{ cliente()!.razaoSocial }}</h1>
            @if (cliente()!.nomeFantasia) { <div class="sub">{{ cliente()!.nomeFantasia }}</div> }
            <div class="sub">CNPJ: {{ formatCnpj(cliente()!.cnpj) }}</div>
            @if (cliente()!.telefone) { <div class="sub">Tel: {{ cliente()!.telefone }}</div> }
          </div>
          <div class="doc-info">
            <div class="doc-title">Pedido</div>
            <div class="doc-num">{{ pedido()!.numero }}</div>
            <div class="sub">{{ pedido()!.createdAt | date:'dd/MM/yyyy' }}</div>
            <div class="status">{{ pedido()!.status }}</div>
          </div>
        </header>

        <section class="block">
          <h2>Destinatário</h2>
          <div class="sub">{{ pedido()!.destinatarioNome }}</div>
        </section>

        <section class="block">
          <h2>Dados da Operação</h2>
          <div class="info-grid">
            <div><span class="info-label">Natureza da Operação</span>{{ pedido()!.naturezaOperacao }}</div>
            @if (pedido()!.dataSaida) {
              <div><span class="info-label">Data de Saída</span>{{ pedido()!.dataSaida | date:'dd/MM/yyyy' }}</div>
            }
            @if (pedido()!.formaPagamento) {
              <div><span class="info-label">Forma de Pagamento</span>{{ formaPagamentoLabel() }}</div>
            }
            @if (pedido()!.meioPagamento) {
              <div><span class="info-label">Meio de Pagamento</span>{{ meioPagamentoLabel() }}</div>
            }
          </div>
        </section>

        <section class="block">
          <h2>Itens</h2>
          <table class="table">
            <thead>
              <tr><th>Cód.</th><th>Descrição</th><th>Qtd</th><th>Unid.</th><th>Preço Unit.</th><th>Desconto</th><th>Total</th></tr>
            </thead>
            <tbody>
              @for (i of pedido()!.itens; track i.id) {
                <tr>
                  <td class="mono">{{ i.ncm || '-' }}</td>
                  <td>{{ i.descricao }}</td>
                  <td class="num">{{ i.quantidade }}</td>
                  <td>{{ i.unidade }}</td>
                  <td class="num">{{ i.precoUnitario | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="num">{{ i.desconto | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="num">{{ i.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr><td colspan="6" class="total-label">Total do Pedido</td><td class="num total-value">{{ pedido()!.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td></tr>
            </tfoot>
          </table>
        </section>

        @if (pedido()!.informacoesComplementares) {
          <section class="block">
            <h2>Informações Complementares</h2>
            <div class="sub">{{ pedido()!.informacoesComplementares }}</div>
          </section>
        }

        <footer class="sheet-footer">Documento gerado pelo FiscalDoc — não é um documento fiscal válido.</footer>
      </div>
    }
  `,
  styles: [`
    :host { display: block; background: #f4f5f7; min-height: 100vh; color: #111; font-family: 'DM Sans', system-ui, sans-serif; }
    .loading-state { padding: 3rem; text-align: center; color: #666; }
    .toolbar { display: flex; justify-content: flex-end; gap: .75rem; padding: 1rem 1.5rem; background: #fff; border-bottom: 1px solid #e2e2e2; position: sticky; top: 0; }
    .btn-primary { background: #0d0f14; color: #fff; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-ghost { background: none; border: 1px solid #ccc; color: #333; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }

    .sheet { max-width: 820px; margin: 1.5rem auto; background: #fff; padding: 2.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .print-brand { display: flex; align-items: center; gap: 6px; margin-bottom: 1rem; }
    .print-brand-name { font-size: 13px; color: #555; letter-spacing: .01em; }
    .print-brand-name strong { color: #111; }
    .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .sheet-header h1 { margin: 0; font-size: 1.3rem; }
    .sub { font-size: 12.5px; color: #555; margin-top: 2px; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #777; }
    .doc-num { font-size: 1.1rem; font-weight: 700; }
    .status { display: inline-block; margin-top: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border: 1px solid #999; border-radius: 4px; }

    .block { margin-bottom: 1.5rem; }
    .block h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #777; margin: 0 0 .5rem; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .5rem 1.5rem; font-size: 13px; }
    .info-label { display: block; font-size: 10.5px; text-transform: uppercase; color: #888; letter-spacing: .04em; }

    .table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .table th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #333; font-size: 10.5px; text-transform: uppercase; color: #555; }
    .table td { padding: 6px 8px; border-bottom: 1px solid #eee; }
    .table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .mono { font-family: monospace; }
    .total-label { text-align: right; font-weight: 700; }
    .total-value { font-weight: 700; font-size: 14px; }

    .sheet-footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; text-align: center; font-size: 10.5px; color: #999; }

    @media print {
      .no-print { display: none !important; }
      :host { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { box-shadow: none; margin: 0; max-width: none; }
    }

    /* ── Mobile: só a barra de ações fora da folha impressa (não mexe no layout de impressão/DANFE) ── */
    @media (max-width: 640px) {
      .toolbar { flex-direction: column; align-items: stretch; }
    }
  `],
})
export class PedidoImprimirComponent implements OnInit {
  private readonly _pedidoSvc = inject(PedidoService);
  private readonly _clienteSvc = inject(ClienteService);
  private readonly _route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly pedido  = signal<PedidoDto | null>(null);
  readonly cliente = signal<ClienteDto | null>(null);

  ngOnInit(): void {
    const clienteId = this._route.snapshot.paramMap.get('id')!;
    const pedidoId  = this._route.snapshot.paramMap.get('pedidoId')!;

    this._clienteSvc.getById(clienteId).subscribe({ next: c => this.cliente.set(c) });
    this._pedidoSvc.getById(clienteId, pedidoId).subscribe({
      next: p => {
        this.pedido.set(p);
        this.loading.set(false);
        setTimeout(() => this.print(), 300);
      },
      error: () => this.loading.set(false),
    });
  }

  formaPagamentoLabel(): string {
    const fp = this.pedido()?.formaPagamento;
    return fp ? (FORMA_PAGAMENTO_LABEL[fp] ?? fp) : '';
  }

  meioPagamentoLabel(): string {
    const mp = this.pedido()?.meioPagamento;
    return mp ? (MEIO_PAGAMENTO_LABEL[mp] ?? mp) : '';
  }

  formatCnpj(cnpj: string): string {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  print(): void { window.print(); }
  fechar(): void { window.close(); }
}
