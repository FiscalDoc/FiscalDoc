import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { from, concatMap, catchError, of } from 'rxjs';
import { AuthService, DocumentoService, ClienteService, extractErrorMessage, extractBlobErrorMessage } from '@veloxml/services';
import { DocumentoDto, ClienteDto } from '@veloxml/models';

interface UploadItem { file: File; tipo: string; }

@Component({
  selector: 'app-documentos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <!-- Header -->
      <header class="page-header">
        <h2 class="font-heading">Documentos</h2>
        <button class="btn-refresh" (click)="load()" title="Atualizar lista">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
        <button class="btn-ghost-sm" (click)="toggleLoteForm()" title="Download em lote">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Lote
        </button>
        <button class="btn-primary" (click)="triggerUpload()">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Upload
        </button>
        <input #fileInput type="file" multiple style="display:none" (change)="onFileSelected($event)" accept=".xml,.pdf,.png,.jpg,.jpeg" />
      </header>

      <!-- Toolbar: busca + filtros -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            class="search-input"
            type="text"
            placeholder="Buscar por número, emitente ou CNPJ..."
            [value]="termo()"
            (input)="onSearch($event)"
          />
        </div>
        <select class="filter-select" [(ngModel)]="filters.clienteId" (ngModelChange)="onFilter()">
          <option value="">Todos os clientes</option>
          @for (c of clientes(); track c.id) {
            <option [value]="c.id">{{ c.razaoSocial }}</option>
          }
        </select>
        <select class="filter-select" [(ngModel)]="filters.tipo" (ngModelChange)="onFilter()">
          <option value="">Todos os tipos</option>
          <option value="NFe">NF-e</option>
          <option value="CTe">CT-e</option>
          <option value="MDFe">MDF-e</option>
          <option value="NFSe">NFS-e</option>
          <option value="PDF">PDF</option>
          <option value="Imagem">Imagem</option>
          <option value="XML">XML</option>
        </select>
        <select class="filter-select" [(ngModel)]="filters.status" (ngModelChange)="onFilter()">
          <option value="">Todos os status</option>
          <option value="Pendente">Pendente</option>
          <option value="Valido">Válido</option>
          <option value="Alerta">Alerta</option>
          <option value="Duplicado">Duplicado</option>
        </select>
        <select class="filter-select" [(ngModel)]="filters.origem" (ngModelChange)="onFilter()">
          <option value="">Todas as origens</option>
          <option value="Manual">Manual</option>
          <option value="ImportacaoEmail">E-mail</option>
          <option value="ApiIngest">API</option>
        </select>
        @if (filters.tipo || filters.status || filters.origem || filters.clienteId || termo()) {
          <button class="btn-ghost-sm" (click)="clearFilters()">Limpar</button>
        }
      </div>

      <!-- Form download em lote -->
      @if (showLoteForm()) {
        <div class="upload-card">
          <div class="lote-header">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>Download em Lote — selecione o cliente e o período</span>
          </div>
          <div class="upload-controls">
            <select class="filter-select" [(ngModel)]="loteClienteId" style="min-width:200px">
              <option value="">Selecione o cliente...</option>
              @for (c of clientes(); track c.id) {
                <option [value]="c.id">{{ c.razaoSocial }}</option>
              }
            </select>
            <select class="filter-select" [(ngModel)]="loteMes">
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">Março</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
            <select class="filter-select" [(ngModel)]="loteAno">
              @for (a of anos; track a) {
                <option [value]="a">{{ a }}</option>
              }
            </select>
            <button class="btn-primary" [disabled]="!loteClienteId || loteLoading()" (click)="doLoteDownload()">
              {{ loteLoading() ? 'Gerando ZIP...' : 'Baixar ZIP' }}
            </button>
            <button class="btn-ghost-sm" (click)="showLoteForm.set(false)">Cancelar</button>
          </div>
          @if (loteError()) {
            <p style="margin:0;font-size:12px;color:var(--red)">{{ loteError() }}</p>
          }
        </div>
      }

      <!-- Upload status -->
      @if (uploadStatus()) {
        <div class="alert-banner" [class.alert-error]="uploadStatus()?.startsWith('Erro')">
          {{ uploadStatus() }}
        </div>
      }

      <!-- Upload form -->
      @if (showUploadForm()) {
        <div class="upload-card">
          <span class="upload-file-label">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ uploadItems().length }} arquivo(s) selecionado(s)
          </span>
          <div class="upload-file-list">
            @for (item of uploadItems(); track item.file.name + $index) {
              <div class="upload-file-row">
                <span class="upload-file-name">{{ item.file.name }}</span>
                <select class="filter-select" [(ngModel)]="item.tipo">
                  <option value="NFe">NF-e</option>
                  <option value="CTe">CT-e</option>
                  <option value="MDFe">MDF-e</option>
                  <option value="NFSe">NFS-e</option>
                  <option value="PDF">PDF</option>
                  <option value="Imagem">Imagem</option>
                  <option value="XML">XML</option>
                </select>
              </div>
            }
          </div>
          <div class="upload-controls">
            @if (!isCliente()) {
              <select class="filter-select" [(ngModel)]="uploadClienteId">
                <option value="">Detectar automaticamente pelo CNPJ (NF-e) ou selecione...</option>
                @for (c of clientes(); track c.id) {
                  <option [value]="c.id">{{ c.razaoSocial }}</option>
                }
              </select>
            }
            <button class="btn-primary" [disabled]="!uploadItems().length || uploading()" (click)="doUpload()">
              {{ uploading() ? 'Enviando...' : 'Enviar' }}
            </button>
            <button class="btn-ghost-sm" (click)="cancelUpload()">Cancelar</button>
          </div>
        </div>
      }

      <!-- Table -->
      @if (loading()) {
        <div class="empty-state">Carregando...</div>
      } @else {
        @if (selecionados().size > 0) {
          <div class="bulk-bar">
            <span>{{ selecionados().size }} selecionado(s)</span>
            <button class="btn-ghost-sm" (click)="limparSelecao()">Limpar seleção</button>
            <button class="btn-danger-sm" (click)="excluirSelecionados()">Excluir selecionados</button>
          </div>
        }
        <div class="card">
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th class="col-check"><input type="checkbox" [checked]="todosSelecionados()" (change)="toggleSelecionarTodos($event)"/></th>
                <th>Tipo</th>
                <th>Número</th>
                <th>Cliente</th>
                <th>Emitente</th>
                <th>Emissão</th>
                <th>Valor</th>
                <th>
                  <span class="th-status-wrap">
                    Status
                    <button class="info-btn" (click)="$event.stopPropagation(); toggleStatusLegend()" title="O que significa cada status?">?</button>
                  </span>
                  @if (showStatusLegend()) {
                    <div class="status-legend" (click)="$event.stopPropagation()">
                      <div class="legend-item"><span class="badge badge-Pendente">Pendente</span><span>Importado, aguardando processamento</span></div>
                      <div class="legend-item"><span class="badge badge-Valido">Válido</span><span>Processado sem pendências</span></div>
                      <div class="legend-item"><span class="badge badge-Alerta">Alerta</span><span>Requer atenção (ex: dados incompletos)</span></div>
                      <div class="legend-item"><span class="badge badge-Duplicado">Duplicado</span><span>Chave de acesso já importada anteriormente</span></div>
                    </div>
                  }
                </th>
                <th>Origem</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (d of documentos(); track d.id) {
                <tr (click)="openDetail(d)" class="row-clickable">
                  <td (click)="$event.stopPropagation()"><input type="checkbox" [checked]="selecionados().has(d.id)" (change)="toggleSelecionado(d.id)"/></td>
                  <td><span class="badge badge-tipo">{{ tipoLabel(d.tipo) }}</span></td>
                  <td class="mono">{{ d.numero || '—' }}</td>
                  <td>{{ d.nomeCliente }}</td>
                  <td class="cell-muted">{{ d.nomeEmitente ?? '—' }}</td>
                  <td class="cell-muted">{{ d.dataEmissao | date:'dd/MM/yyyy' }}</td>
                  <td>{{ d.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                  <td><span class="badge" [ngClass]="statusClass(d.status)">{{ statusLabel(d.status) }}</span></td>
                  <td><span class="badge" [ngClass]="origemClass(d.origemImportacao)">{{ origemLabel(d.origemImportacao) }}</span></td>
                  <td class="actions" (click)="$event.stopPropagation()">
                    <button class="icon-btn" title="Visualizar DANFE" (click)="visualizarDanfe(d.id, d.origemImportacao)">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                      </svg>
                    </button>
                    <button class="icon-btn" title="Baixar arquivo" (click)="download(d)">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                    </button>
                    <button class="icon-btn icon-btn-red" title="Excluir nota fiscal" (click)="excluirDocumento(d)">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              }
              @if (!documentos().length) {
                <tr><td colspan="10" class="empty-state">Nenhum documento encontrado.</td></tr>
              }
            </tbody>
          </table>
          </div>

          @if (totalPages() > 1) {
            <div class="pagination">
              <button class="page-btn" [disabled]="page() <= 1" (click)="prevPage()">‹ Anterior</button>
              <span class="page-info">Pág. {{ page() }} / {{ totalPages() }}</span>
              <button class="page-btn" [disabled]="page() >= totalPages()" (click)="nextPage()">Próxima ›</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal de detalhes -->
    @if (detail()) {
      <div class="overlay" (click)="closeDetail()">
        <div class="modal" (click)="$event.stopPropagation()">

          <!-- Cabeçalho -->
          <header class="modal-header">
            <div class="modal-header-left">
              <span class="badge badge-tipo">{{ tipoLabel(detail()!.tipo) }}</span>
              <h3 class="modal-title font-heading">{{ tipoLabel(detail()!.tipo) }} {{ detail()!.numero || '—' }}</h3>
            </div>
            <div class="modal-header-actions">
              <button class="btn-ghost btn-sm" (click)="visualizarDanfe(detail()!.id, detail()!.origemImportacao)">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
                Visualizar DANFE
              </button>
              <button class="btn-primary btn-sm" (click)="download(detail()!)" [disabled]="downloading()">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                {{ downloading() ? 'Aguarde...' : 'Baixar' }}
              </button>
              <button class="btn-danger btn-sm" (click)="excluirDocumento(detail()!)">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Excluir
              </button>
              <button class="modal-close" (click)="closeDetail()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </header>

          <!-- Hero strip: métricas principais -->
          <div class="modal-hero">
            <div class="hero-stat hero-stat--valor">
              <span class="hero-label">Valor Total</span>
              <span class="hero-value hero-value--accent">{{ detail()!.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-label">Emissão</span>
              <span class="hero-value">{{ detail()!.dataEmissao | date:'dd/MM/yyyy' }}</span>
              <span class="hero-sub">{{ detail()!.dataEmissao | date:'HH:mm' }}</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-label">Número</span>
              <span class="hero-value mono">{{ detail()!.numero || '—' }}</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-label">Status</span>
              <span class="badge" [ngClass]="statusClass(detail()!.status)" style="margin-top:4px">{{ statusLabel(detail()!.status) }}</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-label">Origem</span>
              <span class="badge" [ngClass]="origemClass(detail()!.origemImportacao)" style="margin-top:4px">{{ origemLabel(detail()!.origemImportacao) }}</span>
            </div>
          </div>

          @if (temImpostos(detail()!)) {
            <div class="accordion" [class.accordion--aberto]="impostosAbertos()">
              <button type="button" class="accordion-header" (click)="impostosAbertos.set(!impostosAbertos())">
                <span>Impostos</span>
                <svg class="accordion-chevron" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              @if (impostosAbertos()) {
                <div class="accordion-body">
                  <div class="impostos-grid">
                    @if (detail()!.impostos.valorProdutos != null) {
                      <div class="imposto-item"><span class="footer-label">Valor dos Produtos</span><span class="footer-value">{{ detail()!.impostos.valorProdutos | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorFrete != null) {
                      <div class="imposto-item"><span class="footer-label">Frete</span><span class="footer-value">{{ detail()!.impostos.valorFrete | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorSeguro != null) {
                      <div class="imposto-item"><span class="footer-label">Seguro</span><span class="footer-value">{{ detail()!.impostos.valorSeguro | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorDesconto != null) {
                      <div class="imposto-item"><span class="footer-label">Desconto</span><span class="footer-value">{{ detail()!.impostos.valorDesconto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorIcms != null) {
                      <div class="imposto-item"><span class="footer-label">ICMS</span><span class="footer-value">{{ detail()!.impostos.valorIcms | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorIpi != null) {
                      <div class="imposto-item"><span class="footer-label">IPI</span><span class="footer-value">{{ detail()!.impostos.valorIpi | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorPis != null) {
                      <div class="imposto-item"><span class="footer-label">PIS</span><span class="footer-value">{{ detail()!.impostos.valorPis | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorCofins != null) {
                      <div class="imposto-item"><span class="footer-label">COFINS</span><span class="footer-value">{{ detail()!.impostos.valorCofins | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorOutrasDespesas != null) {
                      <div class="imposto-item"><span class="footer-label">Outras Despesas</span><span class="footer-value">{{ detail()!.impostos.valorOutrasDespesas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                    @if (detail()!.impostos.valorAproxTributos != null) {
                      <div class="imposto-item imposto-item--destaque"><span class="footer-label">Valor Aprox. dos Tributos*</span><span class="footer-value">{{ detail()!.impostos.valorAproxTributos | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span></div>
                    }
                  </div>
                  <p class="impostos-nota">* Conforme Lei 12.741/2012 (Lei da Transparência) — valor aproximado informado pelo emissor da nota.</p>
                </div>
              }
            </div>
          }

          <nav class="detail-tabs">
            <button class="detail-tab-btn" [class.active]="detailTab() === 'geral'" (click)="detailTab.set('geral')">Detalhes</button>
            <button class="detail-tab-btn" [class.active]="detailTab() === 'itens'" (click)="detailTab.set('itens')">Itens ({{ detail()!.itens.length }})</button>
          </nav>

          <div class="modal-body">

          @if (detailTab() === 'geral') {
            <!-- Emitente + Destinatário -->
            <div class="party-grid">
              <div class="party-card">
                <p class="section-label">Emitente</p>
                <p class="party-name">{{ detail()!.nomeEmitente || '—' }}</p>
                <p class="party-cnpj mono">{{ formatCnpj(detail()!.cnpjEmitente) }}</p>
              </div>
              <div class="party-arrow">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              <div class="party-card">
                <p class="section-label">Destinatário</p>
                <p class="party-name">{{ detail()!.nomeDestinatario || '—' }}</p>
                <p class="party-cnpj mono">{{ formatCnpj(detail()!.cnpjDestinatario) }}</p>
              </div>
            </div>

            <!-- Chave de Acesso -->
            @if (detail()!.chaveAcesso) {
              <div class="chave-block">
                <p class="section-label">Chave de Acesso</p>
                <div class="chave-box">
                  <span class="chave-text mono">{{ detail()!.chaveAcesso }}</span>
                  <button class="copy-btn" title="Copiar chave" (click)="copyChave(detail()!.chaveAcesso!)">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            }

            <!-- Info rodapé -->
            <div class="footer-grid">
              <div class="footer-item">
                <span class="footer-label">Cliente vinculado</span>
                <span class="footer-value">{{ detail()!.nomeCliente }}</span>
              </div>
              <div class="footer-item">
                <span class="footer-label">Arquivos</span>
                <span class="footer-value">{{ detail()!.totalArquivos }}</span>
              </div>
              <div class="footer-item">
                <span class="footer-label">Alertas</span>
                <span class="footer-value" [class.text-red]="detail()!.totalAlertas > 0">{{ detail()!.totalAlertas }}</span>
              </div>
              <div class="footer-item">
                <span class="footer-label">Cadastrado em</span>
                <span class="footer-value">{{ detail()!.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>
          }

          @if (detailTab() === 'itens') {
            @if (detail()!.itens.length === 0) {
              <div class="empty-state" style="padding:2rem 0">Nenhum item detalhado disponível pra este documento.</div>
            } @else {
              <div class="table-scroll">
              <table class="itens-table">
                <thead>
                  <tr><th>Código</th><th>Descrição</th><th>NCM</th><th>CFOP</th><th>Qtd</th><th>Un.</th><th>Vlr. Unit.</th><th>Total</th></tr>
                </thead>
                <tbody>
                  @for (item of detail()!.itens; track $index) {
                    <tr>
                      <td class="mono">{{ item.codigoProduto || '—' }}</td>
                      <td>{{ item.descricao }}</td>
                      <td class="mono">{{ item.ncm || '—' }}</td>
                      <td class="mono">{{ item.cfop || '—' }}</td>
                      <td class="num">{{ item.quantidade }}</td>
                      <td>{{ item.unidade }}</td>
                      <td class="num">{{ item.valorUnitario | currency:'BRL':'symbol':'1.3-3':'pt-BR' }}</td>
                      <td class="num">{{ item.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
              </div>
            }
          }

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Layout ── */
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: center; gap: 0.75rem; }
    .page-header h2 { font-size: 1.5rem; margin: 0; flex: 1; }

    /* ── Buttons ── */
    .btn-refresh {
      background: var(--bg2); border: 1px solid var(--border);
      color: var(--text2); border-radius: 8px;
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: color 120ms, background 120ms; flex-shrink: 0;
    }
    .btn-refresh:hover { color: var(--accent); background: var(--bg3); }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #0d0f14;
      border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600;
      cursor: pointer; transition: opacity 120ms; white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; color: var(--text2); border: 1px solid var(--border); border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600; cursor: pointer; text-decoration: none;
      transition: color 120ms, border-color 120ms; white-space: nowrap;
    }
    .btn-ghost:hover { color: var(--accent); border-color: var(--accent); }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 12.5px; }
    .bulk-bar { display: flex; align-items: center; gap: 10px; background: var(--bg2); border: 1px solid var(--accent); border-radius: 8px; padding: 8px 12px; font-size: 13px; color: var(--text); }
    .btn-danger-sm { background: none; border: 1px solid rgba(255,77,109,.4); color: var(--red); border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; margin-left: auto; }
    .btn-danger-sm:hover { background: rgba(255,77,109,.1); }
    .col-check { width: 32px; }
    .btn-ghost-sm {
      background: transparent; color: var(--text2);
      border: 1px solid var(--border); border-radius: 8px;
      padding: 0.375rem 0.75rem; font-size: 13px; cursor: pointer;
      transition: background 120ms, color 120ms;
    }
    .btn-ghost-sm:hover { background: var(--bg3); color: var(--text); }

    /* ── Toolbar ── */
    .toolbar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 420px; }
    .search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: var(--text2); pointer-events: none;
    }
    .search-input {
      width: 100%; box-sizing: border-box;
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text);
      padding: 0.45rem 0.75rem 0.45rem 2rem;
      font-size: 13px; outline: none; transition: border-color 120ms;
    }
    .search-input:focus { border-color: var(--accent); }
    .filter-select {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text);
      padding: 0.45rem 0.625rem; font-size: 13px; outline: none; cursor: pointer;
    }
    .filter-select:focus { border-color: var(--accent); }

    /* ── Alerts ── */
    .alert-banner {
      padding: 10px 14px; border-radius: 8px; font-size: 13px;
      background: rgba(0,229,160,0.1); color: var(--accent);
      border: 1px solid rgba(0,229,160,0.2);
    }
    .alert-error { background: rgba(255,77,109,0.1); color: var(--red); border-color: rgba(255,77,109,0.2); }

    /* ── Upload card ── */
    .upload-card {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 1rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .upload-file-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text2);
    }
    .upload-file-list {
      display: flex; flex-direction: column; gap: 6px;
      max-height: 220px; overflow-y: auto;
    }
    .upload-file-row {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
      padding: 6px 10px;
    }
    .upload-file-name {
      font-size: 12.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; flex: 1;
    }
    .upload-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

    /* ── Table ── */
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th {
      padding: 0.75rem 1rem; text-align: left;
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text2);
      border-bottom: 1px solid var(--border); background: var(--bg3);
    }
    .table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); }
    .table tr:last-child td { border-bottom: none; }
    .row-clickable { cursor: pointer; }
    .row-clickable:hover td { background: var(--bg3); }
    .mono { font-family: monospace; font-size: 12px; }
    .cell-muted { color: var(--text2); }
    .actions { width: 70px; display: flex; gap: 2px; }
    .icon-btn {
      background: none; border: none; color: var(--text2);
      cursor: pointer; padding: 4px 6px; border-radius: 6px;
      display: flex; align-items: center;
      transition: color 120ms, background 120ms;
    }
    .icon-btn:hover { color: var(--accent); background: var(--accent-dim); }
    .icon-btn-red:hover { color: var(--red); background: rgba(255,77,109,0.1); }

    .btn-danger {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--red); color: #fff;
      border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 13.5px; font-weight: 600;
      cursor: pointer; transition: opacity 120ms; white-space: nowrap;
    }
    .btn-danger:hover { opacity: 0.88; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-tipo    { background: var(--bg3); color: var(--text2); }
    .badge-Pendente { background: rgba(255,209,102,0.15); color: var(--yellow); }
    .badge-Valido  { background: rgba(0,229,160,0.12); color: var(--accent); }
    .badge-Alerta  { background: rgba(255,209,102,0.15); color: var(--yellow); }
    .badge-Duplicado { background: rgba(255,77,109,0.12); color: var(--red); }
    .badge-origem-Manual { background: var(--bg3); color: var(--text2); }
    .badge-origem-ImportacaoEmail { background: rgba(77,148,255,0.12); color: #4d94ff; }
    .badge-origem-ApiIngest { background: rgba(0,229,160,0.12); color: var(--accent); }
    .badge-origem-FocusNfe { background: rgba(0,229,160,0.12); color: var(--accent); }

    .empty-state { padding: 3rem; text-align: center; color: var(--text2); font-size: 14px; }
    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 0.875rem 1rem; border-top: 1px solid var(--border);
    }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 12px; font-size: 13px; cursor: pointer; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 13px; color: var(--text2); }

    /* ── Modal ── */
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: var(--radius); width: 100%; max-width: 720px;
      max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.125rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem;
      flex-shrink: 0;
    }
    .modal-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .modal-title { margin: 0; font-size: 1.05rem; }
    .modal-header-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .modal-close {
      background: none; border: none; color: var(--text2);
      cursor: pointer; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; transition: color 120ms;
    }
    .modal-close:hover { color: var(--text); }

    /* ── Hero strip ── */
    .modal-hero {
      display: flex; align-items: stretch;
      background: var(--bg3); border-bottom: 1px solid var(--border);
      padding: 0; flex-shrink: 0;
    }
    .hero-stat {
      display: flex; flex-direction: column; justify-content: center;
      padding: 1rem 1.5rem; gap: 3px; flex: 1;
    }
    .hero-stat--valor { flex: 1.4; }
    .hero-divider { width: 1px; background: var(--border); flex-shrink: 0; }
    .hero-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text2); }
    .hero-value { font-size: 1.2rem; font-weight: 700; color: var(--text); line-height: 1.2; }
    .hero-value--accent { color: var(--accent); font-size: 1.4rem; }
    .hero-sub { font-size: 11px; color: var(--text2); }

    /* ── Modal body ── */
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

    /* ── Abas do modal de detalhe ── */
    .detail-tabs { display: flex; gap: 4px; padding: 0 1.5rem; border-bottom: 1px solid var(--border); }
    .detail-tab-btn {
      background: none; border: none; padding: 8px 12px; font-size: 12.5px; color: var(--text2);
      cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
    }
    .detail-tab-btn:hover { color: var(--text); }
    .detail-tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

    /* ── Aba Itens ── */
    .itens-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .itens-table th { text-align: left; color: var(--text2); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .itens-table td { padding: 7px 8px; border-bottom: 1px solid var(--border); color: var(--text); }
    .itens-table tr:last-child td { border-bottom: none; }
    .itens-table td.num, .itens-table th:nth-last-child(-n+3) { text-align: right; }

    /* ── Accordion (Impostos) ── */
    .accordion { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .accordion-header {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      padding: .75rem 1rem; background: var(--bg3); border: none; cursor: pointer;
      font-size: 13px; font-weight: 600; color: var(--text); font-family: inherit;
    }
    .accordion--aberto .accordion-header { border-bottom: 1px solid var(--border); }
    .accordion-chevron { transition: transform .18s ease; flex-shrink: 0; color: var(--text2); }
    .accordion--aberto .accordion-chevron { transform: rotate(180deg); }
    .accordion-body { padding: 1rem; display: flex; flex-direction: column; gap: .75rem; }

    .impostos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .imposto-item { display: flex; flex-direction: column; gap: 4px; padding: .875rem 1rem; background: var(--bg3); }
    .imposto-item--destaque { background: var(--bg2); grid-column: span 3; }
    .imposto-item--destaque .footer-value { color: var(--accent); font-size: 1.1rem; }
    .impostos-nota { font-size: 11px; color: var(--text2); margin: 0; font-style: italic; }

    /* ── Party grid (emitente / destinatário) ── */
    .party-grid {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--bg3); border-radius: 10px; padding: 1rem 1.25rem;
    }
    .party-card { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .party-arrow { color: var(--text2); flex-shrink: 0; }
    .section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text2); margin: 0 0 6px; }
    .party-name { font-size: 13px; font-weight: 600; color: var(--text); margin: 0; line-height: 1.3; }
    .party-cnpj { font-size: 12px; color: var(--text2); margin: 2px 0 0; }

    /* ── Chave de acesso ── */
    .chave-block { display: flex; flex-direction: column; gap: 8px; }
    .chave-box {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--bg3); border: 1px solid var(--border);
      border-radius: 8px; padding: 0.75rem 1rem;
    }
    .chave-text { font-family: monospace; font-size: 11.5px; color: var(--text2); flex: 1; word-break: break-all; letter-spacing: 0.04em; line-height: 1.5; }
    .copy-btn {
      background: none; border: none; color: var(--text2);
      cursor: pointer; padding: 4px; border-radius: 5px; flex-shrink: 0;
      display: flex; align-items: center; transition: color 120ms, background 120ms;
    }
    .copy-btn:hover { color: var(--accent); background: var(--accent-dim); }

    /* ── Footer info ── */
    .footer-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 1px; background: var(--border);
      border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
    }
    .footer-item {
      display: flex; flex-direction: column; gap: 4px;
      padding: 0.875rem 1rem; background: var(--bg3);
    }
    .footer-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text2); }
    .footer-value { font-size: 13px; color: var(--text); font-weight: 500; }
    .text-red { color: var(--red); }

    /* ── Lote form ── */
    .lote-header { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text2); }

    /* ── Status legend ── */
    .th-status-wrap { display: flex; align-items: center; gap: 6px; position: relative; }
    .info-btn {
      width: 16px; height: 16px; border-radius: 50%;
      background: var(--bg2); border: 1px solid var(--border);
      color: var(--text2); font-size: 10px; font-weight: 700;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
      line-height: 1; flex-shrink: 0;
    }
    .info-btn:hover { background: var(--bg3); color: var(--text); }
    .status-legend {
      position: absolute; top: 100%; left: 0; z-index: 50;
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.75rem; min-width: 300px;
      display: flex; flex-direction: column; gap: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      margin-top: 6px;
    }
    .legend-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text2); font-weight: normal; text-transform: none; letter-spacing: 0; }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 900px; }
    .itens-table { min-width: 640px; }

    @media (max-width: 1024px) {
      .footer-grid { grid-template-columns: repeat(2, 1fr); }
      .impostos-grid { grid-template-columns: repeat(2, 1fr); }
      .imposto-item--destaque { grid-column: span 2; }
    }

    @media (max-width: 640px) {
      .page-header { flex-wrap: wrap; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-wrap { max-width: none; }
      .upload-controls { flex-direction: column; align-items: stretch; }
      .modal-header { flex-direction: column; align-items: stretch; }
      .modal-header-actions { flex-wrap: wrap; }
      .modal-hero { flex-wrap: wrap; }
      .hero-divider { display: none; }
      .hero-stat { flex: 1 1 45%; padding: .75rem 1rem; }
      .party-grid { flex-direction: column; align-items: stretch; }
      .party-arrow { align-self: center; transform: rotate(90deg); }
      .footer-grid { grid-template-columns: 1fr; }
      .impostos-grid { grid-template-columns: 1fr; }
      .imposto-item--destaque { grid-column: span 1; }
    }
  `],
})
export class DocumentosListComponent implements OnInit {
  private readonly _docSvc = inject(DocumentoService);
  private readonly _cliSvc = inject(ClienteService);
  private readonly _auth   = inject(AuthService);
  private readonly _route  = inject(ActivatedRoute);

  // Perfil Cliente só importa pro próprio cliente — não faz sentido escolher outro, então
  // a seleção nem aparece (o backend também ignora qualquer ClienteId enviado nesse caso).
  readonly isCliente = computed(() => this._auth.currentUser()?.perfil === 'Cliente');

  readonly documentos       = signal<DocumentoDto[]>([]);
  readonly clientes         = signal<ClienteDto[]>([]);
  readonly loading          = signal(true);
  readonly page             = signal(1);
  readonly totalPages       = signal(1);
  readonly termo            = signal('');
  readonly detail           = signal<DocumentoDto | null>(null);
  readonly detailTab        = signal<'geral' | 'itens'>('geral');
  readonly impostosAbertos  = signal(false);
  readonly downloading      = signal(false);
  readonly showStatusLegend = signal(false);
  readonly selecionados     = signal<Set<string>>(new Set());

  filters = { tipo: '', status: '', origem: '', clienteId: '' };

  readonly showUploadForm = signal(false);
  readonly uploadItems    = signal<UploadItem[]>([]);
  uploadClienteId = '';
  readonly uploading    = signal(false);
  readonly uploadStatus = signal<string | null>(null);

  // Lote download
  readonly showLoteForm = signal(false);
  readonly loteLoading  = signal(false);
  readonly loteError    = signal<string | null>(null);
  loteClienteId = '';
  loteMes = new Date().getMonth() + 1;
  loteAno = new Date().getFullYear();
  readonly anos = [this.loteAno, this.loteAno - 1, this.loteAno - 2];

  private _searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
    this._cliSvc.getAll({ pageSize: 200 }).subscribe(r => this.clientes.set(r.items));

    const id = this._route.snapshot.queryParamMap.get('id');
    if (id) {
      this._docSvc.getById(id).subscribe(d => this.detail.set(d));
    }
  }

  load(): void {
    this.loading.set(true);
    this._docSvc.getAll({
      page: this.page(), pageSize: 20,
      termo:     this.termo()             || undefined,
      tipo:      this.filters.tipo        || undefined,
      status:    this.filters.status      || undefined,
      origem:    this.filters.origem      || undefined,
      clienteId: this.filters.clienteId   || undefined,
    }).subscribe({
      next: (r) => {
        this.documentos.set(r.items);
        this.totalPages.set(Math.max(1, Math.ceil(r.totalCount / 20)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(e: Event): void {
    this.termo.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.load(), 350);
  }

  onFilter(): void { this.page.set(1); this.load(); }

  clearFilters(): void {
    this.termo.set('');
    this.filters = { tipo: '', status: '', origem: '', clienteId: '' };
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => p - 1); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openDetail(d: DocumentoDto): void { this.detail.set(d); this.detailTab.set('geral'); this.impostosAbertos.set(false); }

  temImpostos(d: DocumentoDto): boolean {
    const i = d.impostos;
    return !!i && Object.values(i).some(v => v != null);
  }
  closeDetail(): void { this.detail.set(null); }

  // Documento emitido pelo FiscalDoc (via Focus NFe) tem o PDF oficial gerado pela SEFAZ
  // guardado — usa ele direto (via link pré-assinado). Documento importado de outro sistema
  // nunca tem esse PDF (ou a emissão é anterior a essa funcionalidade), então cai no
  // renderizador HTML próprio (montado a partir do XML).
  visualizarDanfe(id: string, origem?: string): void {
    if (origem !== 'FocusNfe') { window.open(`/imprimir/danfe/${id}`, '_blank'); return; }
    this._docSvc.getDanfePdfLink(id).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => window.open(`/imprimir/danfe/${id}`, '_blank'),
    });
  }

  download(doc: DocumentoDto): void {
    // Navega direto pro link (em vez de baixar bytes via JS e montar um blob: URL) — isso é
    // o que fazia o Chrome marcar o arquivo como "pode danificar seu dispositivo" (aviso
    // específico de downloads via blob:, não de uma navegação normal pra uma URL real).
    this.downloading.set(true);
    this._docSvc.getLinkDownload(doc.id).subscribe({
      next: ({ url }) => { window.open(url, '_blank'); this.downloading.set(false); },
      error: () => this.downloading.set(false),
    });
  }

  excluirDocumento(doc: DocumentoDto): void {
    if (!confirm(`Excluir a nota fiscal "${doc.numero || doc.id}"? Esta ação não pode ser desfeita.`)) return;
    this._docSvc.delete(doc.id).subscribe({
      next: () => { this.closeDetail(); this.load(); },
      error: (err) => alert(extractErrorMessage(err, 'Erro ao excluir documento.')),
    });
  }

  toggleSelecionado(id: string): void {
    this.selecionados.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  todosSelecionados(): boolean {
    const docs = this.documentos();
    return docs.length > 0 && docs.every(d => this.selecionados().has(d.id));
  }

  toggleSelecionarTodos(e: Event): void {
    const marcar = (e.target as HTMLInputElement).checked;
    this.selecionados.set(marcar ? new Set(this.documentos().map(d => d.id)) : new Set());
  }

  limparSelecao(): void { this.selecionados.set(new Set()); }

  excluirSelecionados(): void {
    const ids = [...this.selecionados()];
    if (ids.length === 0) return;
    if (!confirm(`Excluir ${ids.length} nota(s) fiscal(is) selecionada(s)? Esta ação não pode ser desfeita.`)) return;
    this._docSvc.deleteLote(ids).subscribe({
      next: () => { this.limparSelecao(); this.load(); },
      error: (err) => alert(extractErrorMessage(err, 'Erro ao excluir documentos selecionados.')),
    });
  }

  private _triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  toggleLoteForm(): void {
    this.showLoteForm.update(v => !v);
    this.loteError.set(null);
  }

  doLoteDownload(): void {
    if (!this.loteClienteId) return;
    this.loteLoading.set(true);
    this.loteError.set(null);
    const cliente = this.clientes().find(c => c.id === this.loteClienteId);
    const nomeCliente = cliente?.razaoSocial ?? 'documentos';
    this._docSvc.downloadLote(this.loteClienteId, +this.loteMes, +this.loteAno).subscribe({
      next: (blob) => {
        const mes = String(this.loteMes).padStart(2, '0');
        this._triggerDownload(blob, `${nomeCliente}_${mes}_${this.loteAno}.zip`);
        this.loteLoading.set(false);
      },
      error: (err) => {
        extractBlobErrorMessage(err, 'Erro ao gerar o ZIP.').then(msg => this.loteError.set(msg));
        this.loteLoading.set(false);
      },
    });
  }

  toggleStatusLegend(): void { this.showStatusLegend.update(v => !v); }

  triggerUpload(): void { document.querySelector<HTMLInputElement>('input[type="file"]')?.click(); }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    this.uploadItems.set(Array.from(files).map(file => ({ file, tipo: this._detectarTipo(file) })));
    this.showUploadForm.set(true);
    this.uploadStatus.set(null);
  }

  private _detectarTipo(file: File): string {
    if (file.name.match(/NFe|NF-e/i))            return 'NFe';
    if (file.name.match(/CTe|CT-e/i))             return 'CTe';
    if (file.name.match(/MDF/i))                  return 'MDFe';
    if (file.name.match(/NFS/i))                  return 'NFSe';
    if (file.name.endsWith('.pdf'))               return 'PDF';
    if (file.name.match(/\.(png|jpe?g)$/i))       return 'Imagem';
    return 'XML';
  }

  doUpload(): void {
    const items = this.uploadItems();
    if (!items.length) return;
    this.uploading.set(true);
    this.uploadStatus.set(null);

    let sucesso = 0;
    const falhas: string[] = [];

    from(items).pipe(
      concatMap(item =>
        this._docSvc.upload({ clienteId: this.uploadClienteId || undefined, tipo: item.tipo, arquivo: item.file }).pipe(
          catchError(err => {
            falhas.push(`${item.file.name}: ${extractErrorMessage(err, 'erro desconhecido')}`);
            return of(null);
          })
        )
      )
    ).subscribe({
      next: (result) => { if (result) sucesso++; },
      complete: () => {
        this.uploading.set(false);
        const total = items.length;
        if (falhas.length === 0) {
          this.uploadStatus.set(total === 1 ? 'Documento enviado com sucesso!' : `${sucesso} de ${total} notas importadas com sucesso!`);
          this.cancelUpload();
        } else {
          this.uploadStatus.set(`${sucesso} de ${total} importado(s). Falhas: ${falhas.join(' | ')}`);
        }
        this.load();
      },
    });
  }

  cancelUpload(): void { this.showUploadForm.set(false); this.uploadItems.set([]); this.uploadClienteId = ''; }

  tipoLabel(tipo: string): string {
    const map: Record<string, string> = { NFe:'NF-e', CTe:'CT-e', MDFe:'MDF-e', NFSe:'NFS-e', PDF:'PDF', Imagem:'Imagem', XML:'XML' };
    return map[tipo] ?? tipo;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { Pendente:'Pendente', Valido:'Válido', Alerta:'Alerta', Duplicado:'Duplicado' };
    return map[status] ?? status;
  }

  statusClass(status: string): Record<string, boolean> {
    return {
      [`badge-${status}`]: true,
    };
  }

  origemLabel(origem: string): string {
    const map: Record<string, string> = { Manual: 'Manual', ImportacaoEmail: 'E-mail', ApiIngest: 'API', FocusNfe: 'FiscalDoc' };
    return map[origem] ?? origem;
  }

  origemClass(origem: string): Record<string, boolean> {
    return { [`badge-origem-${origem}`]: true };
  }

  copyChave(chave: string): void {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(chave);
    } else {
      const el = document.createElement('textarea');
      el.value = chave;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }

  formatCnpj(cnpj?: string): string {
    if (!cnpj) return '—';
    const d = cnpj.replace(/\D/g, '');
    return d.length === 14
      ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      : cnpj;
  }
}
