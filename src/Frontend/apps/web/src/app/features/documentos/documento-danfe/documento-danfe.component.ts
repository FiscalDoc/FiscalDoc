import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DocumentoService } from '@veloxml/services';
import { DocumentoDto } from '@veloxml/models';
import { code128CModules, modulesToBars } from './code128';

const MODALIDADE_FRETE: Record<string, string> = {
  '0': 'Contratação do Frete por conta do Remetente (CIF)',
  '1': 'Contratação do Frete por conta do Destinatário (FOB)',
  '2': 'Contratação do Frete por conta de Terceiros',
  '3': 'Transporte Próprio por conta do Remetente',
  '4': 'Transporte Próprio por conta do Destinatário',
  '9': 'Sem Ocorrência de Transporte',
};

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
        @if (!doc()!.danfe?.protocoloAutorizacao) {
          <span class="toolbar-note toolbar-note--alerta">Este XML não tem protocolo de autorização — este DANFE não pode ser considerado válido para trânsito.</span>
        } @else {
          <span class="toolbar-note">DANFE gerado a partir do XML autorizado importado no FiscalDoc.</span>
        }
        <div class="toolbar-actions">
          <button class="btn-ghost" (click)="fechar()">Fechar</button>
          <button class="btn-primary" (click)="print()">Imprimir novamente</button>
        </div>
      </div>

      <div class="sheet">

        <!-- Canhoto do emitente -->
        <section class="dx-canhoto">
          <div class="dx-canhoto-texto">
            RECEBEMOS DE <strong>{{ doc()!.nomeEmitente || '—' }}</strong> OS PRODUTOS E/OU NOTAS FISCAIS INDICADOS
            E CONSTANTES NA NOTA FISCAL INDICADA AO LADO
          </div>
          <div class="dx-canhoto-grid">
            <div class="dx-box">
              <span class="dx-label">Data de Recebimento</span>
              <span class="dx-value">&nbsp;</span>
            </div>
            <div class="dx-box dx-box-grow">
              <span class="dx-label">Identificação e Assinatura do Recebedor</span>
              <span class="dx-value">&nbsp;</span>
            </div>
          </div>
          <div class="dx-canhoto-nf">
            NF-e Nº {{ doc()!.numero }}{{ doc()!.danfe?.serie ? ' SÉRIE ' + doc()!.danfe!.serie : '' }}
          </div>
        </section>

        <div class="dx-corte">
          <span></span> CORTE NA LINHA PONTILHADA <span></span>
        </div>

        <!-- Cabeçalho: emitente / DANFE / chave de acesso -->
        <section class="dx-row dx-header-row">
          <div class="dx-box dx-emit-box">
            <div class="dx-emit-nome">{{ doc()!.nomeEmitente || '—' }}</div>
            @if (enderecoTexto(doc()!.danfe?.enderecoEmitente); as end) { <div class="dx-emit-end">{{ end }}</div> }
            <div class="dx-emit-end">CNPJ: {{ formatCnpj(doc()!.cnpjEmitente) }}
              @if (doc()!.danfe?.inscricaoEstadualEmitente) { &nbsp;·&nbsp;IE: {{ doc()!.danfe!.inscricaoEstadualEmitente }} }
              @if (doc()!.danfe?.enderecoEmitente?.fone) { &nbsp;·&nbsp;Fone: {{ doc()!.danfe!.enderecoEmitente!.fone }} }
            </div>
          </div>

          <div class="dx-box dx-danfe-box">
            <div class="dx-danfe-title">DANFE</div>
            <div class="dx-danfe-sub">Documento Auxiliar da<br>Nota Fiscal Eletrônica</div>
            <div class="dx-entrada-saida">
              <span>0 — Entrada</span>
              <span class="dx-checkbox">1</span>
              <span>Saída</span>
            </div>
            <div class="dx-danfe-num">Nº {{ doc()!.numero }}</div>
            <div class="dx-danfe-serie">Série {{ doc()!.danfe?.serie || '—' }}</div>
          </div>

          <div class="dx-box dx-chave-box">
            @if (barcodeBars(); as bars) {
              <svg class="dx-barcode" [attr.viewBox]="'0 0 ' + barcodeWidth() + ' 40'" preserveAspectRatio="none">
                <rect x="0" y="0" [attr.width]="barcodeWidth()" height="40" fill="#fff"/>
                @for (b of bars; track $index) {
                  <rect [attr.x]="b.x" y="2" [attr.width]="b.width" height="32" fill="#000"/>
                }
              </svg>
            }
            <span class="dx-label">Chave de Acesso</span>
            <span class="dx-value mono dx-chave-valor">{{ chaveFormatada() }}</span>
            <div class="dx-chave-nota">Consulte a autenticidade no portal nacional da NF-e com a chave acima.</div>
          </div>
        </section>

        <section class="dx-row">
          <div class="dx-box dx-box-grow">
            <span class="dx-label">Natureza da Operação</span>
            <span class="dx-value">{{ doc()!.danfe?.naturezaOperacao || '—' }}</span>
          </div>
          <div class="dx-box dx-box-grow">
            <span class="dx-label">Protocolo de Autorização de Uso</span>
            <span class="dx-value">
              {{ doc()!.danfe?.protocoloAutorizacao || '—' }}
              @if (doc()!.danfe?.dataAutorizacao) { — {{ doc()!.danfe!.dataAutorizacao | date:'dd/MM/yyyy HH:mm:ss' }} }
            </span>
          </div>
        </section>

        <!-- Destinatário -->
        <div class="dx-section-title">Destinatário / Remetente</div>
        <section class="dx-row">
          <div class="dx-box dx-box-grow-3">
            <span class="dx-label">Nome / Razão Social</span>
            <span class="dx-value">{{ doc()!.nomeDestinatario || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">CNPJ / CPF</span>
            <span class="dx-value mono">{{ formatCnpj(doc()!.cnpjDestinatario) }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Data de Emissão</span>
            <span class="dx-value">{{ doc()!.dataEmissao | date:'dd/MM/yyyy' }}</span>
          </div>
        </section>
        <section class="dx-row">
          <div class="dx-box dx-box-grow-3">
            <span class="dx-label">Endereço</span>
            <span class="dx-value">{{ enderecoLogradouro(doc()!.danfe?.enderecoDestinatario) || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Bairro / Distrito</span>
            <span class="dx-value">{{ doc()!.danfe?.enderecoDestinatario?.bairro || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">CEP</span>
            <span class="dx-value">{{ doc()!.danfe?.enderecoDestinatario?.cep || '—' }}</span>
          </div>
        </section>
        <section class="dx-row">
          <div class="dx-box dx-box-grow-3">
            <span class="dx-label">Município</span>
            <span class="dx-value">{{ doc()!.danfe?.enderecoDestinatario?.cidade || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Fone/Fax</span>
            <span class="dx-value">{{ doc()!.danfe?.enderecoDestinatario?.fone || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">UF</span>
            <span class="dx-value">{{ doc()!.danfe?.enderecoDestinatario?.uf || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Inscrição Estadual</span>
            <span class="dx-value">{{ doc()!.danfe?.inscricaoEstadualDestinatario || '—' }}</span>
          </div>
        </section>

        <!-- Cálculo do imposto -->
        <div class="dx-section-title">Cálculo do Imposto</div>
        <section class="dx-row">
          <div class="dx-box">
            <span class="dx-label">Base de Cálc. do ICMS</span>
            <span class="dx-value">{{ doc()!.impostos.valorBaseCalculoIcms | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Valor do ICMS</span>
            <span class="dx-value">{{ doc()!.impostos.valorIcms | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Valor do IPI</span>
            <span class="dx-value">{{ doc()!.impostos.valorIpi | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Valor Total dos Produtos</span>
            <span class="dx-value">{{ doc()!.impostos.valorProdutos | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
        </section>
        <section class="dx-row">
          <div class="dx-box">
            <span class="dx-label">Valor do Frete</span>
            <span class="dx-value">{{ doc()!.impostos.valorFrete | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Valor do Seguro</span>
            <span class="dx-value">{{ doc()!.impostos.valorSeguro | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Desconto</span>
            <span class="dx-value">{{ doc()!.impostos.valorDesconto | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Outras Desp. Acessórias</span>
            <span class="dx-value">{{ doc()!.impostos.valorOutrasDespesas | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box dx-box-destaque">
            <span class="dx-label">Valor Total da Nota</span>
            <span class="dx-value dx-value-destaque">{{ doc()!.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
        </section>
        @if (doc()!.impostos.valorAproxTributos != null) {
          <p class="dx-tributos-nota">Valor aprox. dos tributos: {{ doc()!.impostos.valorAproxTributos | currency:'BRL':'symbol':'1.2-2' }} (Lei 12.741/2012).</p>
        }

        <!-- Transportador / Volumes -->
        <div class="dx-section-title">Transportador / Volumes Transportados</div>
        <section class="dx-row">
          <div class="dx-box dx-box-grow-3">
            <span class="dx-label">Nome / Razão Social</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.nome || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Frete por Conta</span>
            <span class="dx-value dx-value-small">{{ modalidadeFrete() || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">CNPJ / CPF</span>
            <span class="dx-value mono">{{ formatCnpj(doc()!.danfe?.transportador?.cnpjCpf) }}</span>
          </div>
        </section>
        <section class="dx-row">
          <div class="dx-box dx-box-grow-3">
            <span class="dx-label">Município</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.municipio || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">UF</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.uf || '—' }}</span>
          </div>
        </section>
        <section class="dx-row">
          <div class="dx-box">
            <span class="dx-label">Qtde. Volumes</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.volume?.quantidade || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Espécie</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.volume?.especie || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Marca</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.volume?.marca || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Numeração</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.volume?.numeracao || '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Peso Bruto</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.volume?.pesoBruto != null ? (doc()!.danfe!.transportador!.volume!.pesoBruto + ' kg') : '—' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Peso Líquido</span>
            <span class="dx-value">{{ doc()!.danfe?.transportador?.volume?.pesoLiquido != null ? (doc()!.danfe!.transportador!.volume!.pesoLiquido + ' kg') : '—' }}</span>
          </div>
        </section>

        <!-- Dados do produto/serviço -->
        <div class="dx-section-title">Dados do Produto / Serviço</div>
        @if (doc()!.itens.length === 0) {
          <div class="dx-box"><span class="dx-value">Nenhum item detalhado disponível para este documento.</span></div>
        } @else {
          <table class="dx-table">
            <thead>
              <tr>
                <th>Código</th><th>Descrição</th><th>NCM/SH</th><th>CST</th><th>CFOP</th><th>Unid.</th>
                <th>Quant.</th><th>Valor Unit.</th><th>Valor Total</th><th>B.Cálc ICMS</th>
                <th>Valor ICMS</th><th>Valor IPI</th><th>Alíq ICMS</th><th>Alíq IPI</th>
              </tr>
            </thead>
            <tbody>
              @for (i of doc()!.itens; track $index) {
                <tr>
                  <td class="mono">{{ i.codigoProduto || '—' }}</td>
                  <td>{{ i.descricao }}</td>
                  <td class="mono">{{ i.ncm || '—' }}</td>
                  <td class="mono">{{ i.cst || '—' }}</td>
                  <td class="mono">{{ i.cfop || '—' }}</td>
                  <td>{{ i.unidade }}</td>
                  <td class="num">{{ i.quantidade }}</td>
                  <td class="num">{{ i.valorUnitario | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="num">{{ i.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="num">{{ i.valorBaseCalculoIcms != null ? (i.valorBaseCalculoIcms | currency:'BRL':'symbol':'1.2-2') : '—' }}</td>
                  <td class="num">{{ i.valorIcms != null ? (i.valorIcms | currency:'BRL':'symbol':'1.2-2') : '—' }}</td>
                  <td class="num">{{ i.valorIpi != null ? (i.valorIpi | currency:'BRL':'symbol':'1.2-2') : '—' }}</td>
                  <td class="num">{{ i.aliquotaIcms != null ? (i.aliquotaIcms + '%') : '—' }}</td>
                  <td class="num">{{ i.aliquotaIpi != null ? (i.aliquotaIpi + '%') : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }

        <!-- Cálculo do ISSQN -->
        <div class="dx-section-title">Cálculo do ISSQN</div>
        <section class="dx-row">
          <div class="dx-box">
            <span class="dx-label">Inscrição Municipal</span>
            <span class="dx-value">—</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Valor Total dos Serviços</span>
            <span class="dx-value">{{ 0 | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Base de Cálculo do ISSQN</span>
            <span class="dx-value">{{ 0 | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Valor do ISSQN</span>
            <span class="dx-value">{{ 0 | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
        </section>

        <!-- Dados adicionais -->
        <div class="dx-section-title">Dados Adicionais</div>
        <section class="dx-row">
          <div class="dx-box dx-box-grow-3">
            <span class="dx-label">Informações Complementares</span>
            <span class="dx-value dx-value-small">{{ doc()!.danfe?.informacoesComplementares || 'Nenhuma informação complementar informada pelo emitente.' }}</span>
          </div>
          <div class="dx-box">
            <span class="dx-label">Reservado ao Fisco</span>
            <span class="dx-value">&nbsp;</span>
          </div>
        </section>

        <footer class="sheet-footer">
          DANFE gerado pelo FiscalDoc a partir do XML da NF-e importado — reprodução dos dados autorizados pela SEFAZ, sem qualquer alteração no conteúdo fiscal.
        </footer>
      </div>
    }
  `,
  styles: [`
    :host { display: block; background: #dfe1e6; min-height: 100vh; color: #111; font-family: 'DM Sans', system-ui, sans-serif; }
    .loading-state { padding: 3rem; text-align: center; color: #666; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: 1rem 1.5rem; background: #fff; border-bottom: 1px solid #e2e2e2; position: sticky; top: 0; }
    .toolbar-note { font-size: 12px; color: #888; }
    .toolbar-note--alerta { color: #b45309; font-weight: 600; }
    .toolbar-actions { display: flex; gap: .75rem; }
    .btn-primary { background: #0d0f14; color: #fff; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-ghost { background: none; border: 1px solid #ccc; color: #333; border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }

    .sheet { max-width: 900px; margin: 1.5rem auto; background: #fff; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.12); font-size: 11px; }

    /* Canhoto */
    .dx-canhoto-texto { font-size: 9.5px; text-transform: uppercase; letter-spacing: .01em; margin-bottom: 4px; }
    .dx-canhoto-grid { display: flex; gap: 0; }
    .dx-canhoto-nf { text-align: right; font-size: 11px; font-weight: 700; margin-top: 4px; }
    .dx-corte { display: flex; align-items: center; gap: .5rem; justify-content: center; font-size: 9px; color: #888; letter-spacing: .05em; margin: .6rem 0; }
    .dx-corte span { flex: 1; border-top: 1px dashed #999; }

    /* Boxes: bordered cell, label above value — mimics classic DANFE grid look */
    .dx-row { display: flex; gap: 0; margin-top: -1px; }
    .dx-box { flex: 1; border: 1px solid #333; padding: 3px 6px 4px; display: flex; flex-direction: column; margin-left: -1px; min-width: 0; }
    .dx-box:first-child { margin-left: 0; }
    .dx-box-grow { flex: 2; }
    .dx-box-grow-3 { flex: 3; }
    .dx-label { font-size: 7.5px; text-transform: uppercase; letter-spacing: .03em; color: #555; }
    .dx-value { font-size: 11px; margin-top: 1px; word-break: break-word; }
    .dx-value-small { font-size: 9.5px; color: #333; }
    .dx-value-destaque { font-weight: 800; font-size: 12.5px; }
    .dx-box-destaque { background: #f5f5f5; }
    .mono { font-family: 'Courier New', monospace; }

    /* Header row: emitente / DANFE / chave */
    .dx-header-row { align-items: stretch; }
    .dx-emit-box { flex: 2.4; justify-content: center; }
    .dx-emit-nome { font-size: 13px; font-weight: 800; }
    .dx-emit-end { font-size: 9.5px; color: #444; margin-top: 2px; }

    .dx-danfe-box { flex: 1.2; align-items: center; text-align: center; justify-content: center; }
    .dx-danfe-title { font-size: 20px; font-weight: 900; letter-spacing: .08em; }
    .dx-danfe-sub { font-size: 8px; color: #444; margin: 2px 0 4px; line-height: 1.25; }
    .dx-entrada-saida { display: flex; align-items: center; gap: 4px; font-size: 8px; color: #333; margin-bottom: 4px; }
    .dx-checkbox { border: 1px solid #333; padding: 0 4px; font-weight: 700; }
    .dx-danfe-num { font-size: 11px; font-weight: 700; }
    .dx-danfe-serie { font-size: 9.5px; color: #444; }

    .dx-chave-box { flex: 2; align-items: center; text-align: center; justify-content: center; gap: 2px; }
    .dx-barcode { width: 100%; height: 34px; margin-bottom: 2px; }
    .dx-chave-valor { letter-spacing: .05em; font-size: 10.5px; }
    .dx-chave-nota { font-size: 7.5px; color: #777; margin-top: 3px; }

    .dx-section-title { background: #1a1e28; color: #fff; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 3px 8px; margin-top: 8px; }

    .dx-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: -1px; }
    .dx-table th { text-align: left; padding: 4px 5px; background: #1a1e28; color: #fff; font-size: 7.5px; text-transform: uppercase; font-weight: 600; }
    .dx-table td { padding: 3px 5px; border: 1px solid #ccc; }
    .dx-table .num { text-align: right; font-variant-numeric: tabular-nums; }

    .dx-tributos-nota { font-size: 8.5px; color: #888; margin: 3px 0 0; }

    .sheet-footer { margin-top: 1.25rem; padding-top: .75rem; border-top: 1px solid #ddd; text-align: center; font-size: 9px; color: #999; }

    @media print {
      .no-print { display: none !important; }
      :host { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { box-shadow: none; margin: 0; max-width: none; padding: 0; }
    }
  `],
})
export class DocumentoDanfeComponent implements OnInit {
  private readonly _docSvc = inject(DocumentoService);
  private readonly _route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly doc = signal<DocumentoDto | null>(null);

  private readonly _moduleWidth = 2;

  readonly barcodeModules = computed(() => {
    const chave = this.doc()?.chaveAcesso?.replace(/\D/g, '');
    if (!chave || chave.length !== 44) return null;
    try {
      return code128CModules(chave);
    } catch {
      return null;
    }
  });

  readonly barcodeBars = computed(() => {
    const modules = this.barcodeModules();
    return modules ? modulesToBars(modules, this._moduleWidth) : null;
  });

  readonly barcodeWidth = computed(() => (this.barcodeModules()?.length ?? 0) * this._moduleWidth);

  readonly modalidadeFrete = computed(() => {
    const cod = this.doc()?.danfe?.transportador?.modalidadeFrete;
    return cod != null ? (MODALIDADE_FRETE[cod] ?? cod) : null;
  });

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
    if (!chave) return '—';
    return chave.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  enderecoLogradouro(end?: { logradouro?: string; numero?: string; complemento?: string }): string | null {
    if (!end) return null;
    const partes = [[end.logradouro, end.numero].filter(Boolean).join(', '), end.complemento].filter(Boolean);
    return partes.length > 0 ? partes.join(' — ') : null;
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
    return cnpj || '—';
  }

  print(): void { window.print(); }
  fechar(): void { window.close(); }
}
