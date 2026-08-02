import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DocumentoService } from '@veloxml/services';
import { DocumentoDto } from '@veloxml/models';

@Component({
  selector: 'app-documento-danfe',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="no-print loading-state">Carregando...</div>
    } @else if (!doc()) {
      <div class="no-print loading-state">Não foi possível carregar o documento.</div>
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
            <div class="doc-title">DANFE</div>
            <div class="sub">Documento Auxiliar da Nota Fiscal Eletrônica</div>
            <div class="sub sub-small">Representação simplificada gerada a partir do XML importado — não substitui a DANFE oficial (sem código de barras/QR Code).</div>
          </div>
          <div class="doc-info">
            <div class="doc-num">Nº {{ doc()!.numero }}{{ doc()!.danfe?.serie ? ' — Série ' + doc()!.danfe!.serie : '' }}</div>
            <div class="sub">Emissão: {{ doc()!.dataEmissao | date:'dd/MM/yyyy HH:mm' }}</div>
            @if (doc()!.danfe?.protocoloAutorizacao) {
              <div class="sub">Protocolo: {{ doc()!.danfe!.protocoloAutorizacao }}</div>
            }
          </div>
        </header>

        @if (doc()!.chaveAcesso) {
          <section class="block chave-block">
            <span class="info-label">Chave de Acesso</span>
            <div class="chave-valor mono">{{ chaveFormatada() }}</div>
          </section>
        }

        <div class="party-grid">
          <section class="block party-box">
            <h2>Emitente</h2>
            <div class="party-name">{{ doc()!.nomeEmitente || '—' }}</div>
            <div class="sub">CNPJ: {{ formatCnpj(doc()!.cnpjEmitente) }}</div>
            @if (doc()!.danfe?.inscricaoEstadualEmitente) { <div class="sub">IE: {{ doc()!.danfe!.inscricaoEstadualEmitente }}</div> }
            @if (enderecoTexto(doc()!.danfe?.enderecoEmitente); as end) { <div class="sub">{{ end }}</div> }
          </section>
          <section class="block party-box">
            <h2>Destinatário</h2>
            <div class="party-name">{{ doc()!.nomeDestinatario || '—' }}</div>
            <div class="sub">CNPJ/CPF: {{ formatCnpj(doc()!.cnpjDestinatario) }}</div>
            @if (doc()!.danfe?.inscricaoEstadualDestinatario) { <div class="sub">IE: {{ doc()!.danfe!.inscricaoEstadualDestinatario }}</div> }
            @if (enderecoTexto(doc()!.danfe?.enderecoDestinatario); as end) { <div class="sub">{{ end }}</div> }
          </section>
        </div>

        @if (doc()!.danfe?.naturezaOperacao) {
          <section class="block">
            <span class="info-label">Natureza da Operação</span>
            <div class="sub">{{ doc()!.danfe!.naturezaOperacao }}</div>
          </section>
        }

        <section class="block">
          <h2>Itens</h2>
          @if (doc()!.itens.length === 0) {
            <div class="sub">Nenhum item detalhado disponível pra este documento.</div>
          } @else {
            <table class="table">
              <thead>
                <tr><th>Código</th><th>Descrição</th><th>NCM</th><th>CFOP</th><th>Qtd</th><th>Un.</th><th>Vlr. Unit.</th><th>Total</th></tr>
              </thead>
              <tbody>
                @for (i of doc()!.itens; track $index) {
                  <tr>
                    <td class="mono">{{ i.codigoProduto || '—' }}</td>
                    <td>{{ i.descricao }}</td>
                    <td class="mono">{{ i.ncm || '—' }}</td>
                    <td class="mono">{{ i.cfop || '—' }}</td>
                    <td class="num">{{ i.quantidade }}</td>
                    <td>{{ i.unidade }}</td>
                    <td class="num">{{ i.valorUnitario | currency:'BRL':'symbol':'1.2-2' }}</td>
                    <td class="num">{{ i.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>

        <section class="block">
          <h2>Totais</h2>
          <div class="info-grid">
            @if (doc()!.impostos.valorProdutos != null) { <div><span class="info-label">Produtos</span>{{ doc()!.impostos.valorProdutos | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorFrete != null) { <div><span class="info-label">Frete</span>{{ doc()!.impostos.valorFrete | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorSeguro != null) { <div><span class="info-label">Seguro</span>{{ doc()!.impostos.valorSeguro | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorDesconto != null) { <div><span class="info-label">Desconto</span>{{ doc()!.impostos.valorDesconto | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorIcms != null) { <div><span class="info-label">ICMS</span>{{ doc()!.impostos.valorIcms | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorIpi != null) { <div><span class="info-label">IPI</span>{{ doc()!.impostos.valorIpi | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorPis != null) { <div><span class="info-label">PIS</span>{{ doc()!.impostos.valorPis | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorCofins != null) { <div><span class="info-label">COFINS</span>{{ doc()!.impostos.valorCofins | currency:'BRL':'symbol':'1.2-2' }}</div> }
            @if (doc()!.impostos.valorAproxTributos != null) { <div><span class="info-label">Valor Aprox. Tributos*</span>{{ doc()!.impostos.valorAproxTributos | currency:'BRL':'symbol':'1.2-2' }}</div> }
          </div>
          <div class="total-row">
            <span class="total-label">Valor Total da Nota</span>
            <span class="total-value">{{ doc()!.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          @if (doc()!.impostos.valorAproxTributos != null) {
            <p class="sub sub-small">* Conforme Lei 12.741/2012 (Lei da Transparência) — valor aproximado informado pelo emissor da nota.</p>
          }
        </section>

        <footer class="sheet-footer">Documento gerado pelo FiscalDoc a partir do XML importado — não é um documento fiscal válido, apenas uma representação visual pra conferência.</footer>
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
    .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 1rem; margin-bottom: 1.5rem; gap: 1.5rem; }
    .sub { font-size: 12.5px; color: #555; margin-top: 2px; }
    .sub-small { font-size: 10.5px; color: #888; }
    .doc-info { text-align: right; flex-shrink: 0; }
    .doc-title { font-size: 1.3rem; font-weight: 800; letter-spacing: .04em; }
    .doc-num { font-size: 1.05rem; font-weight: 700; }

    .chave-block { text-align: center; background: #f7f7f8; border: 1px solid #ddd; border-radius: 6px; padding: .75rem 1rem; }
    .chave-valor { font-size: 13px; letter-spacing: .06em; margin-top: 4px; }

    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .party-box { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: .875rem 1rem; margin-bottom: 0; }
    .party-name { font-size: 13px; font-weight: 700; margin-top: 2px; }

    .block { margin-bottom: 1.5rem; }
    .block h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #777; margin: 0 0 .5rem; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem 1.5rem; font-size: 13px; }
    .info-label { display: block; font-size: 10.5px; text-transform: uppercase; color: #888; letter-spacing: .04em; }

    .table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .table th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #333; font-size: 10px; text-transform: uppercase; color: #555; }
    .table td { padding: 6px 8px; border-bottom: 1px solid #eee; }
    .table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .mono { font-family: monospace; }

    .total-row { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #111; margin-top: .75rem; padding-top: .5rem; }
    .total-label { font-weight: 700; font-size: 13px; }
    .total-value { font-weight: 800; font-size: 1.1rem; }

    .sheet-footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; text-align: center; font-size: 10.5px; color: #999; }

    @media print {
      .no-print { display: none !important; }
      :host { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { box-shadow: none; margin: 0; max-width: none; }
    }
  `],
})
export class DocumentoDanfeComponent implements OnInit {
  private readonly _docSvc = inject(DocumentoService);
  private readonly _route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly doc = signal<DocumentoDto | null>(null);

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._docSvc.getById(id).subscribe({
      next: d => {
        this.doc.set(d);
        this.loading.set(false);
        setTimeout(() => this.print(), 300);
      },
      error: () => this.loading.set(false),
    });
  }

  chaveFormatada(): string {
    const chave = this.doc()?.chaveAcesso ?? '';
    return chave.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  enderecoTexto(end?: { logradouro?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; cep?: string }): string | null {
    if (!end) return null;
    const partes = [
      [end.logradouro, end.numero].filter(Boolean).join(', '),
      end.complemento,
      end.bairro,
      [end.cidade, end.uf].filter(Boolean).join('/'),
      end.cep,
    ].filter(Boolean);
    return partes.length > 0 ? partes.join(' — ') : null;
  }

  formatCnpj(cnpj?: string): string {
    if (!cnpj) return '—';
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return cnpj;
  }

  print(): void { window.print(); }
  fechar(): void { window.close(); }
}
