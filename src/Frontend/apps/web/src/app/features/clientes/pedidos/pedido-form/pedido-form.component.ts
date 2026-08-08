import { Component, HostListener, inject, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PedidoService, ProdutoService, DestinatarioService, TransportadoraService, DocumentoService, ClienteService, ToastService, extractErrorMessage, extractFieldErrors } from '@veloxml/services';
import { PedidoDto, ProdutoDto, DestinatarioDto, TransportadoraDto, PedidoItemInput, CreatePedidoRequest, DocumentoDto, PedidoHistoricoDto, NfeEmissaoDto, ClienteDto } from '@veloxml/models';
import { DecimalInputDirective } from '../../../../shared/decimal-input.directive';

interface DocumentoVinculadoInfo {
  id: string;
  numero: string;
  serie?: string;
  chaveAcesso?: string;
  origem?: string;
  status?: string;
  dataEmissao?: string;
  protocoloAutorizacao?: string;
  dataAutorizacao?: string;
  motivoCancelamento?: string;
  protocoloCancelamento?: string;
  dataCancelamento?: string;
}

interface ConfirmState {
  titulo: string;
  mensagem: string;
  danger: boolean;
  onConfirm: () => void;
}

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalInputDirective],
  template: `
    <div class="page" [class.page-loading]="carregandoPedido()">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Pedidos
        </button>
        <div class="header-top">
          <div class="title-row">
            @if (carregandoPedido()) {
              <h2 class="page-title">Carregando...</h2>
            } @else {
              <h2 class="page-title">{{ isNew() ? 'Novo Pedido' : 'Pedido ' + numero() }}</h2>
            }
            @if (!isNew() && !carregandoPedido()) {
              <span class="badge" [class]="statusClass()">{{ pedidoStatus() }}</span>
            }
            @if (!isNew() && vizinhoTotal()) {
              <div class="nav-vizinhos">
                <button
                  type="button" class="nav-btn" [disabled]="!vizinhoProximoId() || carregandoPedido()" (click)="irParaProximo()"
                  [title]="vizinhoProximoNumero() ? 'Pedido nº ' + vizinhoProximoNumero() : 'Sem próximo pedido'"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Próximo
                </button>
                <span class="nav-posicao">{{ carregandoPedido() ? '···' : vizinhoPosicao() }} de {{ vizinhoTotal() }}</span>
                <button
                  type="button" class="nav-btn" [disabled]="!vizinhoAnteriorId() || carregandoPedido()" (click)="irParaAnterior()"
                  [title]="vizinhoAnteriorNumero() ? 'Pedido nº ' + vizinhoAnteriorNumero() : 'Sem pedido anterior'"
                >
                  Anterior
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            }
            @if (autoSalvando()) {
              <span class="autosave-note">Salvando...</span>
            } @else if (autoSalvo()) {
              <span class="autosave-note">Salvo automaticamente</span>
            }
          </div>
          <div class="header-actions">
            @if (!readonly()) {
              <button class="icon-btn primary" [disabled]="salvando() || salvandoEEmitindo()" (click)="salvar()" title="Salvar Pedido">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-8H7v8"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 3v5h8"/>
                </svg>
                <span>{{ salvando() ? 'Salvando...' : 'Salvar' }}</span>
              </button>
              <button class="icon-btn" [disabled]="salvando() || salvandoEEmitindo()" (click)="salvarEEmitir()" [title]="focusNfeDisponivel() ? 'Salvar e emitir a NF-e em um passo' : 'Salvar e emitir em um passo'">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                <span>{{ salvandoEEmitindo() ? 'Emitindo...' : (focusNfeDisponivel() ? 'Salvar e Emitir NF-e' : 'Salvar e Emitir') }}</span>
              </button>
            }
            @if (!isNew()) {
              @if (!documentoVinculado()) {
                <button class="icon-btn" (click)="imprimir()" title="Imprimir Pedido">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 14h12v8H6z"/>
                  </svg>
                  <span>Imprimir</span>
                </button>
              }
              @if (focusNfeDisponivel() && pedidoStatus() === 'Rascunho' && !documentoVinculado()) {
                <button
                  class="icon-btn"
                  [disabled]="emitindoNfeFocus() || nfeEmissao()?.status === 'Processando'"
                  (click)="emitirNfeFocus()"
                  title="Emitir NF-e"
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                  <span>{{ emitindoNfeFocus() || nfeEmissao()?.status === 'Processando' ? 'Emitindo...' : 'Emitir NF-e' }}</span>
                </button>
              }
              <button class="icon-btn" [disabled]="duplicando()" (click)="duplicar()" title="Duplicar Pedido">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="12" height="12" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <span>{{ duplicando() ? 'Duplicando...' : 'Duplicar' }}</span>
              </button>
              @if (pedidoStatus() === 'Rascunho') {
                @if (!focusNfeDisponivel()) {
                  <button class="icon-btn" [disabled]="emitindo()" (click)="emitir()" title="Emitir Pedido">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    <span>{{ emitindo() ? 'Emitindo...' : 'Emitir' }}</span>
                  </button>
                }
                <button class="icon-btn danger" [disabled]="excluindo()" (click)="excluir()" title="Excluir Pedido">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  <span>{{ excluindo() ? 'Excluindo...' : 'Excluir' }}</span>
                </button>
              }
              @if (pedidoStatus() !== 'Cancelado' && !documentoVinculado()) {
                <button class="icon-btn danger" [disabled]="cancelando()" (click)="cancelar()" title="Cancelar Pedido">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-6 6M9 9l6 6"/>
                  </svg>
                  <span>{{ cancelando() ? 'Cancelando...' : 'Cancelar' }}</span>
                </button>
              }
            }
          </div>
        </div>
      </div>

      @if (readonly()) {
        <div class="alert-info">Este pedido está com status "{{ pedidoStatus() }}" e não pode mais ser editado.</div>
      }

      @if (!isNew()) {
        @if (documentoVinculado(); as doc) {
          <div class="card section nfe-card-wrap">
            <div class="nfe-card-row">
              <div class="nfe-card-info">
                <span class="nfe-status-icon" [class.rejeitado]="doc.status === 'Cancelado'">
                  @if (doc.status === 'Cancelado') {
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  } @else {
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  }
                </span>
                <div>
                  <p class="nfe-card-title">Nota Fiscal: {{ doc.numero }}{{ doc.serie ? '  Série: ' + doc.serie : '' }}</p>
                  <div class="nfe-card-badges">
                    @if (doc.status === 'Cancelado') {
                      <span class="badge badge-rejeitado">NF-e cancelada</span>
                    } @else {
                      <span class="badge badge-emitido">{{ doc.origem === 'FocusNfe' ? 'Autorizado pelo SEFAZ' : 'Emitido externamente' }}</span>
                    }
                    @if (doc.dataEmissao) { <span class="nfe-card-date">Emitida em {{ doc.dataEmissao | date:'dd/MM/yyyy HH:mm' }}</span> }
                  </div>
                </div>
              </div>
              <div class="nfe-card-actions">
                <button class="btn-ghost-sm" (click)="visualizarDanfe(doc.id, doc.origem)">Visualizar DANFE</button>
                <a class="btn-ghost-sm" [routerLink]="['/documentos']" [queryParams]="{ id: doc.id }">Ver documento</a>
                @if (doc.status !== 'Cancelado') {
                  <button class="btn-ghost-sm" [disabled]="desvinculando()" (click)="desvincularDocumento()">
                    {{ desvinculando() ? 'Removendo...' : 'Desvincular' }}
                  </button>
                  @if (doc.origem === 'FocusNfe') {
                    <button class="btn-ghost-sm" (click)="abrirCartaCorrecao()">Carta de Correção</button>
                    <button class="btn-ghost-sm danger" (click)="abrirCancelarNfe()">Cancelar NF-e</button>
                  }
                }
              </div>
            </div>
            <div class="nfe-fields">
              <div class="nfe-field">
                <span class="nfe-field-label">Chave de acesso</span>
                <span class="nfe-field-value-row">
                  <span class="nfe-field-value mono">{{ chaveFormatada(doc.chaveAcesso) }}</span>
                  <button type="button" class="copy-btn" (click)="copiarChave(doc.chaveAcesso)" title="Copiar chave de acesso">
                    @if (chaveCopiada()) {
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/></svg>
                    } @else {
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    }
                  </button>
                </span>
              </div>
              <div class="nfe-fields-grid">
                @if (doc.protocoloAutorizacao) {
                  <div class="nfe-field">
                    <span class="nfe-field-label">Protocolo de autorização</span>
                    <span class="nfe-field-value">
                      <span class="mono">{{ doc.protocoloAutorizacao }}</span>
                      @if (doc.dataAutorizacao) { <span class="nfe-field-data">{{ doc.dataAutorizacao | date:'dd/MM/yyyy HH:mm:ss' }}</span> }
                    </span>
                  </div>
                }
                @if (doc.status === 'Cancelado' && doc.protocoloCancelamento) {
                  <div class="nfe-field nfe-field--alerta">
                    <span class="nfe-field-label">Protocolo de cancelamento</span>
                    <span class="nfe-field-value">
                      <span class="mono">{{ doc.protocoloCancelamento }}</span>
                      @if (doc.dataCancelamento) { <span class="nfe-field-data">{{ doc.dataCancelamento | date:'dd/MM/yyyy HH:mm:ss' }}</span> }
                    </span>
                  </div>
                }
              </div>
              @if (doc.status === 'Cancelado' && doc.motivoCancelamento) {
                <div class="nfe-field nfe-field--alerta">
                  <span class="nfe-field-label">Motivo do cancelamento</span>
                  <span class="nfe-field-value">
                    {{ doc.motivoCancelamento }}
                    @if (!doc.protocoloCancelamento && doc.dataCancelamento) { <span class="nfe-field-data">{{ doc.dataCancelamento | date:'dd/MM/yyyy HH:mm:ss' }}</span> }
                  </span>
                </div>
              }
            </div>
          </div>
        } @else if (focusNfeDisponivel() && nfeEmissao()?.status === 'Processando') {
          <div class="card section nfe-card">
            <div class="nfe-card-info">
              <span class="badge badge-processando">Processando na SEFAZ...</span>
              <span class="field-hint">Ainda estamos autorizando essa nota na SEFAZ — a página atualiza sozinha.</span>
            </div>
          </div>
        } @else if (focusNfeDisponivel() && (nfeEmissao()?.status === 'Rejeitada' || nfeEmissao()?.status === 'Erro')) {
          <div class="card section nfe-card">
            <div class="nfe-card-info">
              <span class="badge badge-rejeitado">{{ nfeEmissao()?.status === 'Rejeitada' ? 'NF-e rejeitada' : 'Erro na emissão' }}</span>
              <span class="field-hint">{{ nfeEmissao()?.mensagemErro || 'Não foi possível emitir a NF-e.' }}</span>
            </div>
            <div class="nfe-card-actions">
              <button class="btn-ghost-sm" (click)="showErroNfeModal.set(true)">Ver detalhes e como corrigir</button>
              <button class="btn-ghost-sm" [disabled]="emitindoNfeFocus()" (click)="emitirNfeFocus()">
                {{ emitindoNfeFocus() ? 'Tentando...' : 'Tentar novamente' }}
              </button>
              <button class="btn-ghost-sm" (click)="abrirVincularDocumento()">Vincular NF-e importada</button>
            </div>
          </div>
        } @else {
          <div class="card section nfe-card">
            <div class="nfe-card-info">
              @if (focusNfeDisponivel()) {
                <span class="field-hint">Esse pedido ainda não tem uma NF-e real vinculada. Emita a NF-e direto por aqui ou, se ela já foi emitida em outro sistema, vincule o XML importado aqui.</span>
              } @else {
                <span class="field-hint">Esse pedido ainda não tem uma NF-e real vinculada. Se ela já foi emitida em outro sistema, vincule o XML importado aqui.</span>
              }
            </div>
            <div class="nfe-card-actions">
              <button class="btn-ghost-sm" (click)="abrirVincularDocumento()">Vincular NF-e importada</button>
            </div>
          </div>
        }
      }

      <div class="card section header-section">
        <div class="section-title-row">
          <h4 class="section-title">Cabeçalho Pedido/Nota Fiscal</h4>
          <span class="badge-tipo" [class.badge-tipo--nf]="!!documentoVinculado()">
            {{ documentoVinculado() ? 'Nota Fiscal' : 'Pedido' }}
          </span>
        </div>
        <div class="form-grid">
          <div class="field col-2 combo-field">
            <label class="label">Destinatário *</label>
            <div class="combo-row">
              <input
                class="input" [disabled]="readonly()"
                [ngModel]="destinatarioSearch"
                (ngModelChange)="onDestinatarioInput($event)"
                (focus)="destinatarioDropdownOpen.set(true)"
                (blur)="onDestinatarioBlur()"
                (keydown)="onDestinatarioKeydown($event)"
                placeholder="Buscar destinatário por nome..."
              />
              @if (form.destinatarioId) {
                <a class="btn-inline" [routerLink]="['/clientes', clienteId, 'cadastros', 'destinatarios', form.destinatarioId]" target="_blank" title="Abrir cadastro do destinatário em nova aba">Editar</a>
              }
              @if (!readonly()) {
                <button type="button" class="btn-inline" (click)="abrirNovoDestinatario()">+ Novo</button>
              }
            </div>
            @if (destinatarioDropdownOpen() && !readonly()) {
              <div class="combo-dropdown">
                @for (d of destinatarioResults(); track d.id; let idx = $index) {
                  <div class="combo-item" [class.combo-item-active]="destinatarioHighlight() === idx" (mousedown)="selecionarDestinatario(d)" (mouseenter)="destinatarioHighlight.set(idx)">
                    {{ d.razaoSocial }}{{ d.nomeFantasia ? ' — ' + d.nomeFantasia : '' }}
                  </div>
                }
                @if (destinatarioSearch.trim().length > 0) {
                  <div class="combo-item combo-item-create" (mousedown)="abrirNovoDestinatario()">
                    + Cadastrar destinatário "{{ destinatarioSearch }}"
                  </div>
                }
                @if (destinatarioResults().length === 0 && destinatarioSearch.trim().length === 0) {
                  <div class="combo-item combo-item-hint">Digite para buscar...</div>
                }
              </div>
            }
          </div>
          <div class="field col-2">
            <label class="label">Natureza da Operação *</label>
            <input class="input" [disabled]="readonly()" [ngModel]="form.naturezaOperacao" (ngModelChange)="form.naturezaOperacao = $event; marcarSujo()" placeholder="Venda de mercadoria"/>
          </div>
        </div>

        <div class="form-subheading">Indicadores da Operação</div>
        <div class="form-grid">
          <div class="field">
            <label class="label">Finalidade de Emissão</label>
            <select class="input" [disabled]="readonly()" [ngModel]="form.finalidadeEmissao" (ngModelChange)="form.finalidadeEmissao = $event; marcarSujo()">
              <option value="Normal">Normal</option>
              <option value="Complementar">Complementar</option>
              <option value="Ajuste">Ajuste</option>
              <option value="Devolucao">Devolução</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Tipo de Frete</label>
            <select class="input" [disabled]="readonly()" [ngModel]="form.modalidadeFrete" (ngModelChange)="onModalidadeFreteChange($event)">
              <option value="SemFrete">Sem frete</option>
              <option value="EmitenteContaFrete">Por conta do emitente</option>
              <option value="DestinatarioContaFrete">Por conta do destinatário</option>
              <option value="Terceiros">Por conta de terceiros</option>
            </select>
          </div>
          <div class="field col-2 combo-field">
            <label class="label">Transportadora</label>
            <div class="combo-row">
              <input
                class="input" [disabled]="readonly() || form.modalidadeFrete === 'SemFrete'"
                [ngModel]="transportadoraSearch"
                (ngModelChange)="onTransportadoraInput($event)"
                (focus)="transportadoraDropdownOpen.set(true)"
                (blur)="onTransportadoraBlur()"
                (keydown)="onTransportadoraKeydown($event)"
                placeholder="Buscar transportadora (opcional)..."
              />
              @if (form.transportadoraId) {
                <a class="btn-inline" [routerLink]="['/clientes', clienteId, 'cadastros', 'transportadoras', form.transportadoraId]" target="_blank" title="Abrir cadastro da transportadora em nova aba">Editar</a>
              }
              @if (!readonly() && form.transportadoraId) {
                <button type="button" class="btn-inline" (click)="limparTransportadora()">Limpar</button>
              }
            </div>
            @if (form.modalidadeFrete === 'SemFrete') {
              <span class="field-hint">Selecione um tipo de frete diferente de "Sem frete" para escolher uma transportadora.</span>
            }
            @if (transportadoraDropdownOpen() && !readonly()) {
              <div class="combo-dropdown">
                @for (t of transportadoraResults(); track t.id; let idx = $index) {
                  <div class="combo-item" [class.combo-item-active]="transportadoraHighlight() === idx" (mousedown)="selecionarTransportadora(t)" (mouseenter)="transportadoraHighlight.set(idx)">
                    {{ t.razaoSocial }}{{ t.nomeFantasia ? ' — ' + t.nomeFantasia : '' }}
                  </div>
                }
                @if (transportadoraResults().length === 0) {
                  <div class="combo-item combo-item-hint">
                    {{ transportadoraSearch.trim().length === 0 ? 'Digite para buscar...' : 'Nenhuma transportadora encontrada.' }}
                  </div>
                }
              </div>
            }
          </div>
          <div class="field">
            <label class="label">Presença do Comprador *</label>
            <select class="input" [disabled]="readonly()" [ngModel]="form.presencaComprador" (ngModelChange)="form.presencaComprador = $event; marcarSujo()">
              <option [ngValue]="1">Operação presencial</option>
              <option [ngValue]="2">Não presencial, internet</option>
              <option [ngValue]="3">Não presencial, teleatendimento</option>
              <option [ngValue]="5">Presencial, fora do estabelecimento</option>
              <option [ngValue]="9">Não presencial, outros</option>
            </select>
          </div>
          <div class="field" style="justify-content:flex-end;padding-bottom:2px;">
            <label class="label">Consumidor Final *</label>
            <label class="toggle-row">
              <input type="checkbox" [disabled]="readonly()" [ngModel]="form.consumidorFinal" (ngModelChange)="form.consumidorFinal = $event; marcarSujo()" style="width:16px;height:16px;accent-color:var(--accent);"/>
              Venda para consumidor final
            </label>
          </div>
        </div>

        <div class="form-subheading">Valores Adicionais</div>
        <div class="form-grid">
          <div class="field">
            <label class="label">Valor do Frete (R$)</label>
            <input class="input" type="text" appDecimalInput [disabled]="readonly()" [ngModel]="form.valorFrete" (ngModelChange)="form.valorFrete = $event; marcarSujo()"/>
          </div>
          <div class="field">
            <label class="label">Valor do Seguro (R$)</label>
            <input class="input" type="text" appDecimalInput [disabled]="readonly()" [ngModel]="form.valorSeguro" (ngModelChange)="form.valorSeguro = $event; marcarSujo()"/>
          </div>
          <div class="field">
            <label class="label">Outras Despesas (R$)</label>
            <input class="input" type="text" appDecimalInput [disabled]="readonly()" [ngModel]="form.valorOutrasDespesas" (ngModelChange)="form.valorOutrasDespesas = $event; marcarSujo()"/>
          </div>
          <div class="field">
            <label class="label">Data de Saída</label>
            <input class="input" type="date" [disabled]="readonly()" [ngModel]="form.dataSaida" (ngModelChange)="form.dataSaida = $event; marcarSujo()"/>
          </div>
        </div>

        <div class="form-subheading">Pagamento e Complemento</div>
        <div class="form-grid">
          <div class="field">
            <label class="label">Forma de Pagamento</label>
            <select class="input" [disabled]="readonly()" [ngModel]="form.formaPagamento" (ngModelChange)="form.formaPagamento = $event; marcarSujo()">
              <option value="">Não informado</option>
              <option value="AVista">À vista</option>
              <option value="APrazo">A prazo</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Meio de Pagamento</label>
            <select class="input" [disabled]="readonly()" [ngModel]="form.meioPagamento" (ngModelChange)="form.meioPagamento = $event; marcarSujo()">
              <option value="">Não informado</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartao">Cartão</option>
              <option value="Pix">PIX</option>
              <option value="Boleto">Boleto</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="field col-2">
            <label class="label">Observações (interno)</label>
            <textarea class="input" [disabled]="readonly()" [ngModel]="form.observacoes" (ngModelChange)="form.observacoes = $event; marcarSujo()" rows="1" placeholder="Opcional"></textarea>
          </div>
          <div class="field col-4">
            <label class="label">Informações Complementares (nota fiscal)</label>
            <textarea class="input" [disabled]="readonly()" [ngModel]="form.informacoesComplementares" (ngModelChange)="form.informacoesComplementares = $event; marcarSujo()" rows="1" placeholder="Texto que vai para a nota fiscal (opcional)"></textarea>
          </div>
        </div>
      </div>

      @if (documentoImpostos(); as imp) {
        <div class="accordion" [class.accordion--aberto]="impostosAbertos()">
          <button type="button" class="accordion-header" (click)="impostosAbertos.set(!impostosAbertos())">
            <span>Totais da Nota Fiscal</span>
            <svg class="accordion-chevron" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          @if (impostosAbertos()) {
            <div class="accordion-body">
              <div class="form-grid impostos-form-grid">
                <div class="field"><label class="label">Produtos</label><input class="input-sm" disabled [value]="imp.valorProdutos ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">Base Cálc. ICMS</label><input class="input-sm" disabled [value]="imp.valorBaseCalculoIcms ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">ICMS</label><input class="input-sm" disabled [value]="imp.valorIcms ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">IPI</label><input class="input-sm" disabled [value]="imp.valorIpi ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">PIS</label><input class="input-sm" disabled [value]="imp.valorPis ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">COFINS</label><input class="input-sm" disabled [value]="imp.valorCofins ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">IBS</label><input class="input-sm" disabled [value]="imp.valorIbs ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">CBS</label><input class="input-sm" disabled [value]="imp.valorCbs ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">Frete</label><input class="input-sm" disabled [value]="imp.valorFrete ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">Seguro</label><input class="input-sm" disabled [value]="imp.valorSeguro ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">Desconto</label><input class="input-sm" disabled [value]="imp.valorDesconto ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">Outras Despesas</label><input class="input-sm" disabled [value]="imp.valorOutrasDespesas ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
                <div class="field"><label class="label">Aprox. Tributos*</label><input class="input-sm imposto-destaque" disabled [value]="imp.valorAproxTributos ?? 0 | currency:'BRL':'symbol':'1.2-2'"/></div>
              </div>
            </div>
          }
        </div>
      }

      <div class="card section">
        <div class="list-header">
          <h4 class="section-title">Itens</h4>
          @if (!readonly()) {
            <button class="btn-ghost-sm" (click)="adicionarItem()">+ Adicionar item</button>
          }
        </div>

        @if (!readonly() && produtosFrequentes().length > 0) {
          <div class="frequentes-row">
            <span class="frequentes-label">Adicionar novamente:</span>
            @for (p of produtosFrequentes(); track p.id) {
              <button type="button" class="chip" (click)="adicionarProdutoFrequente(p)">{{ p.codigo }} — {{ p.descricao }}</button>
            }
          </div>
        }

        @if (itens().length === 0) {
          <div class="empty">Nenhum item adicionado.</div>
        } @else {
          <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Desconto</th><th>Total</th>
                @if (!readonly()) { <th></th> }
              </tr>
            </thead>
            <tbody>
              @for (item of itens(); track $index; let i = $index) {
                <tr>
                  <td>
                    <button type="button" class="expand-btn" (click)="toggleExpand(i)" [title]="expandedRows().has(i) ? 'Ocultar detalhes' : 'CFOP / NCM / descrição'">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        @if (expandedRows().has(i)) {
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        } @else {
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        }
                      </svg>
                    </button>
                  </td>
                  <td class="combo-field">
                    <input
                      class="input-sm" [class.error]="rowErrors().has(i)" [disabled]="readonly()"
                      [ngModel]="produtoBusca[i] ?? ''"
                      (ngModelChange)="onProdutoInput(i, $event)"
                      (focus)="produtoDropdownIndex.set(i)"
                      (blur)="onProdutoBlur()"
                      (keydown)="onProdutoKeydown(i, $event)"
                      placeholder="Buscar produto..."
                    />
                    @if (produtoDropdownIndex() === i && !readonly()) {
                      <div class="combo-dropdown">
                        @for (p of produtoResults(); track p.id; let idx = $index) {
                          <div class="combo-item" [class.combo-item-active]="produtoHighlight() === idx" (mousedown)="selecionarProduto(i, p)" (mouseenter)="produtoHighlight.set(idx)">
                            {{ p.codigo }} — {{ p.descricao }}
                            @if (!p.ncm || !p.cfop) {
                              <span class="combo-item-badge" title="Cadastro fiscal incompleto — falta NCM e/ou CFOP">⚠ incompleto</span>
                            }
                          </div>
                        }
                        @if ((produtoBusca[i] ?? '').trim().length > 0) {
                          <div class="combo-item combo-item-create" (mousedown)="abrirNovoProduto(i)">
                            + Cadastrar produto "{{ produtoBusca[i] }}"
                          </div>
                        }
                        @if (produtoResults().length === 0 && (produtoBusca[i] ?? '').trim().length === 0) {
                          <div class="combo-item combo-item-hint">Digite para buscar...</div>
                        }
                      </div>
                    }
                  </td>
                  <td><input class="input-sm num" [class.error]="rowErrors().has(i)" [disabled]="readonly()" type="number" [(ngModel)]="item.quantidade" (input)="calcTotal(i)" min="0.001" step="0.001"/></td>
                  <td><input class="input-sm num" [class.error]="rowErrors().has(i)" [disabled]="readonly()" type="text" appDecimalInput [(ngModel)]="item.precoUnitario" (input)="calcTotal(i)"/></td>
                  <td><input class="input-sm num" [class.error]="rowErrors().has(i)" [disabled]="readonly()" type="text" appDecimalInput [(ngModel)]="item.desconto" (input)="calcTotal(i)"/></td>
                  <td class="total-cell">
                    <div>{{ itemTotal(item) | currency:'BRL':'symbol':'1.2-2' }}</div>
                    @if (itemImpostos(item) > 0) {
                      <div class="tax-hint">impostos (est.): {{ itemImpostos(item) | currency:'BRL':'symbol':'1.2-2' }}</div>
                    }
                  </td>
                  @if (!readonly()) {
                    <td><button class="row-btn danger" (click)="removerItem(i)">✕</button></td>
                  }
                </tr>
                @if (expandedRows().has(i)) {
                  <tr class="detail-row">
                    <td></td>
                    <td [attr.colspan]="readonly() ? 5 : 6">
                      <div class="detail-grid">
                        <div class="field">
                          <label class="label">Descrição</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.descricao" (ngModelChange)="item.descricao = $event; marcarSujo()"/>
                        </div>
                        @if (item.produtoId) {
                          <div class="field">
                            <label class="label">Cadastro do produto</label>
                            <a class="btn-inline" [routerLink]="['/clientes', clienteId, 'cadastros', 'produtos', item.produtoId]" target="_blank" title="Abrir cadastro do produto em nova aba">Editar produto ↗</a>
                          </div>
                        }
                        <div class="field">
                          <label class="label">CFOP</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.cfop" (ngModelChange)="item.cfop = $event; marcarSujo()"/>
                        </div>
                        <div class="field">
                          <label class="label">NCM</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.ncm" (ngModelChange)="item.ncm = $event; marcarSujo()"/>
                        </div>
                        <div class="field">
                          <label class="label">CST/CSOSN ICMS</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.cstIcms" (ngModelChange)="item.cstIcms = $event; marcarSujo()"/>
                        </div>
                        <div class="field">
                          <label class="label">CST PIS</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.cstPis" (ngModelChange)="item.cstPis = $event; marcarSujo()"/>
                        </div>
                        <div class="field">
                          <label class="label">CST COFINS</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.cstCofins" (ngModelChange)="item.cstCofins = $event; marcarSujo()"/>
                        </div>
                        <div class="field">
                          <label class="label">CST IBS/CBS</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.ibsCbsCst" (ngModelChange)="item.ibsCbsCst = $event; marcarSujo()"/>
                        </div>
                        <div class="field">
                          <label class="label">Classif. IBS/CBS</label>
                          <input class="input-sm" [disabled]="readonly()" [ngModel]="item.ibsCbsClassificacaoTributaria" (ngModelChange)="item.ibsCbsClassificacaoTributaria = $event; marcarSujo()"/>
                        </div>
                        @if (!readonly() && itens().length > 1) {
                          <div class="field field-full">
                            <button type="button" class="btn-inline" (click)="aplicarFiscalATodosOsItens(i)" title="Copia CFOP, CST ICMS/PIS/COFINS e IBS/CBS deste item para todos os outros — não mexe em NCM, descrição, preço nem quantidade">
                              Aplicar CFOP/CST deste item a todos os itens
                            </button>
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
            <tfoot>
              @if (totalImpostos() > 0) {
                <tr>
                  <td [attr.colspan]="readonly() ? 4 : 5" class="total-label">Impostos estimados (ICMS + PIS + COFINS)</td>
                  <td class="total-value-sm" [attr.colspan]="readonly() ? 1 : 2">{{ totalImpostos() | currency:'BRL':'symbol':'1.2-2' }}</td>
                </tr>
              }
              <tr>
                <td [attr.colspan]="readonly() ? 4 : 5" class="total-label">Total do Pedido</td>
                <td class="total-value" [attr.colspan]="readonly() ? 1 : 2">{{ valorTotal() | currency:'BRL':'symbol':'1.2-2' }}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        }
      </div>

      @if (!isNew() && historico().length > 0) {
        <div class="card section historico-section">
          <h4 class="section-title">Histórico</h4>
          <div class="timeline">
            @for (h of historico(); track h.id) {
              <div class="timeline-item">
                <span class="timeline-dot" [class]="'timeline-dot--' + h.tipo.toLowerCase()"></span>
                <div class="timeline-content">
                  <p class="timeline-desc">{{ h.descricao }}</p>
                  <p class="timeline-meta">
                    {{ h.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    @if (h.usuarioNome) { · {{ h.usuarioNome }} }
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (erro()) { <div class="alert-error">{{ erro() }}</div> }

      <div class="form-actions">
        <button class="btn-ghost" (click)="goBack()">{{ readonly() ? 'Voltar' : 'Cancelar' }}</button>
      </div>
    </div>

    @if (confirmState(); as c) {
      <div class="overlay" (click)="fecharConfirm()">
        <div class="modal-confirm" (click)="$event.stopPropagation()">
          <h3 class="confirm-title">{{ c.titulo }}</h3>
          <p class="confirm-msg">{{ c.mensagem }}</p>
          <div class="confirm-actions">
            <button class="btn-ghost" (click)="fecharConfirm()">Voltar</button>
            <button class="btn-primary" [class.danger]="c.danger" (click)="confirmarAcao()">Confirmar</button>
          </div>
        </div>
      </div>
    }

    @if (showNovoDestinatario()) {
      <div class="overlay" (click)="fecharNovoDestinatario()">
        <div class="modal-quick" (click)="$event.stopPropagation()">
          <h3 class="confirm-title">Novo Destinatário</h3>
          <p class="quick-hint">Cadastro rápido — complete os demais dados depois em Cadastros &gt; Destinatários, se precisar.</p>
          <div class="field">
            <label class="label">Razão Social *</label>
            <input class="input" [(ngModel)]="novoDestinatarioForm.razaoSocial" placeholder="Nome do destinatário"/>
          </div>
          <div class="field">
            <label class="label">CPF/CNPJ</label>
            <input class="input" [(ngModel)]="novoDestinatarioForm.cpfCnpj" placeholder="Opcional"/>
          </div>
          @if (erroNovoDestinatario()) { <div class="alert-error">{{ erroNovoDestinatario() }}</div> }
          <div class="confirm-actions">
            <button class="btn-ghost" (click)="fecharNovoDestinatario()">Cancelar</button>
            <button class="btn-primary" [disabled]="salvandoNovoDestinatario()" (click)="salvarNovoDestinatario()">
              {{ salvandoNovoDestinatario() ? 'Salvando...' : 'Salvar e usar' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showNovoProduto()) {
      <div class="overlay" (click)="fecharNovoProduto()">
        <div class="modal-quick" (click)="$event.stopPropagation()">
          <h3 class="confirm-title">Novo Produto</h3>
          <p class="quick-hint">Cadastro rápido — complete NCM, CFOP e alíquotas depois em Cadastros &gt; Produtos, se precisar.</p>
          <div class="field">
            <label class="label">Descrição *</label>
            <input class="input" [(ngModel)]="novoProdutoForm.descricao" placeholder="Descrição do produto/serviço"/>
          </div>
          <div class="field">
            <label class="label">Preço Unitário *</label>
            <input class="input" type="text" appDecimalInput [(ngModel)]="novoProdutoForm.precoUnitario"/>
          </div>
          @if (erroNovoProduto()) { <div class="alert-error">{{ erroNovoProduto() }}</div> }
          <div class="confirm-actions">
            <button class="btn-ghost" (click)="fecharNovoProduto()">Cancelar</button>
            <button class="btn-primary" [disabled]="salvandoNovoProduto()" (click)="salvarNovoProduto()">
              {{ salvandoNovoProduto() ? 'Salvando...' : 'Salvar e usar' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showVincularDocumento()) {
      <div class="overlay" (click)="fecharVincularDocumento()">
        <div class="modal-quick" (click)="$event.stopPropagation()">
          <h3 class="confirm-title">Vincular NF-e importada</h3>
          <p class="quick-hint">Busque pelo número ou chave de acesso do XML já importado pra este cliente.</p>
          <div class="field">
            <input class="input" [ngModel]="documentoBusca" (ngModelChange)="onDocumentoBuscaInput($event)" placeholder="Número ou chave de acesso..." autofocus/>
          </div>
          @if (documentoResults().length > 0) {
            <div class="documento-results">
              @for (doc of documentoResults(); track doc.id) {
                <div class="documento-result-item" (click)="selecionarDocumentoVinculo(doc)">
                  <span class="nfe-card-title">NF-e nº {{ doc.numero }} — {{ doc.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</span>
                  <span class="nfe-card-chave mono">{{ doc.chaveAcesso || '—' }}</span>
                </div>
              }
            </div>
          } @else if (documentoBusca.trim().length > 0) {
            <p class="quick-hint">Nenhum documento encontrado.</p>
          }
          @if (erroVincularDocumento()) { <div class="alert-error">{{ erroVincularDocumento() }}</div> }
          <div class="confirm-actions">
            <button class="btn-ghost" (click)="fecharVincularDocumento()">Cancelar</button>
          </div>
        </div>
      </div>
    }

    @if (showErroNfeModal()) {
      <div class="overlay" (click)="showErroNfeModal.set(false)">
        <div class="modal-quick modal-erro-nfe" (click)="$event.stopPropagation()">
          <h3 class="confirm-title">Por que a NF-e foi rejeitada</h3>
          <p class="quick-hint">A SEFAZ recusou a emissão pelos motivos abaixo. Corrija cada um e clique em "Tentar novamente".</p>
          <div class="erro-nfe-lista">
            @for (e of erroNfeDetalhes(); track e.titulo + e.explicacao) {
              <div class="erro-nfe-item">
                <p class="erro-nfe-titulo">{{ e.titulo }}</p>
                <p class="erro-nfe-explicacao">{{ e.explicacao }}</p>
                @if (e.acaoLabel && e.acaoLink) {
                  <a class="btn-ghost-sm" [routerLink]="e.acaoLink" (click)="showErroNfeModal.set(false)">{{ e.acaoLabel }}</a>
                }
              </div>
            }
          </div>
          <div class="confirm-actions">
            <button class="btn-ghost" (click)="showErroNfeModal.set(false)">Fechar</button>
            <button class="btn-primary" [disabled]="emitindoNfeFocus()" (click)="showErroNfeModal.set(false); emitirNfeFocus()">
              {{ emitindoNfeFocus() ? 'Tentando...' : 'Tentar novamente' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showCancelarNfeModal()) {
      <div class="overlay" (click)="fecharCancelarNfe()">
        <div class="modal-quick" (click)="$event.stopPropagation()">
          <h3 class="confirm-title">Cancelar NF-e</h3>
          <p class="quick-hint">Isso cancela a nota fiscal de verdade na SEFAZ — não dá pra desfazer. A justificativa precisa ter entre 15 e 255 caracteres.</p>
          <div class="field">
            <label class="label">Justificativa *</label>
            <textarea class="input" [(ngModel)]="justificativaCancelamento" rows="3" placeholder="Motivo do cancelamento (mín. 15 caracteres)" maxlength="255"></textarea>
            <span class="field-hint">{{ justificativaCancelamento.trim().length }}/255</span>
          </div>
          @if (erroCancelarNfe()) { <div class="alert-error">{{ erroCancelarNfe() }}</div> }
          <div class="confirm-actions">
            <button class="btn-ghost" (click)="fecharCancelarNfe()">Voltar</button>
            <button class="btn-primary danger" [disabled]="cancelandoNfe() || justificativaCancelamento.trim().length < 15" (click)="confirmarCancelarNfe()">
              {{ cancelandoNfe() ? 'Cancelando...' : 'Cancelar NF-e' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showCartaCorrecaoModal()) {
      <div class="overlay" (click)="fecharCartaCorrecao()">
        <div class="modal-quick" (click)="$event.stopPropagation()">
          <h3 class="confirm-title">Carta de Correção</h3>
          <p class="quick-hint">Corrige informações da NF-e já autorizada, sem cancelá-la — não pode alterar valores, impostos, datas ou os dados de emitente/destinatário. O texto precisa ter entre 15 e 1000 caracteres.</p>
          <div class="field">
            <label class="label">Correção *</label>
            <textarea class="input" [(ngModel)]="textoCartaCorrecao" rows="4" placeholder="Descreva a correção (mín. 15 caracteres)" maxlength="1000"></textarea>
            <span class="field-hint">{{ textoCartaCorrecao.trim().length }}/1000</span>
          </div>
          @if (erroCartaCorrecao()) { <div class="alert-error">{{ erroCartaCorrecao() }}</div> }
          @if (sucessoCartaCorrecao()) { <div class="alert-ok">Carta de correção enviada e autorizada pela SEFAZ.</div> }
          <div class="confirm-actions">
            <button class="btn-ghost" (click)="fecharCartaCorrecao()">Voltar</button>
            <button class="btn-primary" [disabled]="enviandoCartaCorrecao() || textoCartaCorrecao.trim().length < 15" (click)="confirmarCartaCorrecao()">
              {{ enviandoCartaCorrecao() ? 'Enviando...' : 'Enviar Carta de Correção' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; transition: opacity 120ms ease; }
    .page-loading { opacity: .55; pointer-events: none; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; align-self: flex-start; }
    .back-btn:hover { color: var(--accent); }
    .header-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; }
    .title-row { display: flex; align-items: center; gap: .75rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .header-actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .nav-vizinhos { display: flex; align-items: center; gap: 8px; }
    .nav-btn {
      display: flex; align-items: center; gap: 4px; height: 26px; border: 1px solid var(--border); border-radius: 6px;
      background: var(--bg2); color: var(--text2); cursor: pointer; padding: 0 8px; font-size: 12px; white-space: nowrap;
    }
    .nav-btn:hover:not(:disabled) { color: var(--text); border-color: var(--accent); }
    .nav-btn:disabled { opacity: .35; cursor: not-allowed; }
    .nav-posicao { font-size: 11.5px; color: var(--text2); white-space: nowrap; }
    .autosave-note { font-size: 11.5px; color: var(--text2); font-style: italic; }
    .icon-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--bg2); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem .75rem; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .icon-btn:hover:not(:disabled) { border-color: var(--text2); color: var(--text); }
    .icon-btn:disabled { opacity: .4; cursor: not-allowed; }
    .icon-btn.primary { background: var(--accent); color: #0d0f14; border-color: var(--accent); }
    .icon-btn.primary:hover:not(:disabled) { opacity: .88; color: #0d0f14; }
    .icon-btn.danger { color: var(--red); border-color: rgba(255,77,109,.35); }
    .icon-btn.danger:hover:not(:disabled) { background: rgba(255,77,109,.1); border-color: var(--red); color: var(--red); }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-rascunho { background: rgba(124,130,153,.15); color: var(--text2); }
    .badge-emitido  { background: var(--green-dim); color: var(--green); }
    .badge-cancelado { background: rgba(255,77,109,.12); color: var(--red); }
    .badge-processando { background: rgba(255,193,7,.12); color: #ffc107; }
    .badge-rejeitado { background: rgba(255,77,109,.12); color: var(--red); }
    .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .header-section { padding: 1.125rem 1.5rem; gap: .625rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .section-title-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
    .form-subheading { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text2); border-top: 1px solid var(--border); padding-top: .75rem; margin-top: .125rem; }
    .badge-tipo { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; background: rgba(124,130,153,.15); color: var(--text2); }
    .badge-tipo--nf { background: oklch(0.62 0.17 254 / .12); color: var(--accent); }
    .list-header { display: flex; align-items: center; justify-content: space-between; }
    .frequentes-row { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .frequentes-label { font-size: 12px; color: var(--text2); flex-shrink: 0; }
    .chip { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 999px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
    .chip:hover { border-color: var(--accent); color: var(--accent); }
    .header-section .form-grid { grid-template-columns: repeat(4, 1fr); gap: .625rem; }
    .col-2 { grid-column: span 2; }
    .col-4 { grid-column: span 4; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .field { display: flex; flex-direction: column; gap: 3px; }
    .toggle-row { display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--text); }
    .header-section .label { font-size: 10px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input, textarea.input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .header-section .input, .header-section textarea.input { padding: .375rem .625rem; font-size: 13px; }
    .header-section textarea.input { min-height: 32px; resize: vertical; }
    .input:focus, textarea.input:focus { border-color: var(--accent); }
    .input:disabled, textarea.input:disabled {
      opacity: .6; cursor: not-allowed;
      background: var(--bg3); color: var(--text); -webkit-text-fill-color: var(--text);
      -webkit-appearance: none; appearance: none;
    }
    .input-sm { background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 4px 8px; font-size: 12.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .input-sm:focus { border-color: var(--accent); }
    .input-sm:disabled {
      opacity: .6; cursor: not-allowed;
      background: var(--bg3); color: var(--text); -webkit-text-fill-color: var(--text);
      -webkit-appearance: none; appearance: none;
    }
    .input-sm.num { text-align: right; }
    .input-sm.error, select.input-sm.error { border-color: var(--red); }
    .impostos-form-grid { grid-template-columns: repeat(4, 1fr); gap: .75rem .875rem; }
    .imposto-destaque:disabled {
      color: var(--accent); -webkit-text-fill-color: var(--accent); font-weight: 700; opacity: 1;
      background: var(--accent-dim); border-color: oklch(0.62 0.17 254 / .35);
    }
    .empty { text-align: center; color: var(--text2); font-size: 13px; padding: 1.5rem; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; color: var(--text2); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; padding: 6px 8px; border-bottom: 1px solid var(--border); }
    .table td { padding: 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .table tfoot td { border-top: 1px solid var(--border); border-bottom: none; padding: 8px 8px; }
    .total-cell { text-align: right; font-variant-numeric: tabular-nums; }
    .tax-hint { font-size: 10.5px; color: var(--text2); margin-top: 2px; }
    .total-label { text-align: right; font-weight: 600; color: var(--text2); font-size: 12px; }
    .total-value { text-align: right; font-weight: 700; color: var(--accent); font-size: 14px; }
    .total-value-sm { text-align: right; font-weight: 600; color: var(--text2); font-size: 12.5px; }
    .row-btn { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer; }
    .row-btn.danger:hover { color: var(--red); border-color: var(--red); }
    .expand-btn { background: none; border: none; color: var(--text2); cursor: pointer; padding: 2px; display: flex; }
    .expand-btn:hover { color: var(--accent); }
    .detail-row td { background: var(--bg3); }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .625rem; padding: 4px 0; }
    .detail-grid .field-full { grid-column: 1 / -1; padding-top: 2px; border-top: 1px dashed var(--border); margin-top: 4px; }
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-ok { background: rgba(0,196,140,.1); border: 1px solid rgba(0,196,140,.3); color: var(--green); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-info { background: rgba(124,130,153,.1); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .nfe-card, .nfe-card-wrap { flex-direction: row; align-items: center; justify-content: space-between; padding: 1.125rem 1.25rem; gap: 1rem; flex-wrap: wrap; }
    .nfe-card-wrap { flex-direction: column; align-items: stretch; }
    .nfe-card-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .nfe-card-info { display: flex; align-items: center; gap: 14px; }
    .nfe-status-icon {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 38px; height: 38px; border-radius: 50%;
      background: var(--green-dim); color: var(--green);
    }
    .nfe-status-icon.rejeitado { background: rgba(255,77,109,.12); color: var(--red); }
    .nfe-card-title { margin: 0 0 4px; font-size: 14.5px; font-weight: 700; color: var(--text); }
    .nfe-card-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .nfe-card-date { font-size: 11.5px; color: var(--text2); }
    .nfe-card-chave { margin: 2px 0 0; font-size: 11px; color: var(--text2); word-break: break-all; }
    .nfe-card-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
    .btn-ghost-sm.danger { color: var(--red); border-color: rgba(255,77,109,.3); }
    .btn-ghost-sm.danger:hover { color: var(--red); border-color: var(--red); background: rgba(255,77,109,.08); }
    .nfe-fields { display: flex; flex-direction: column; gap: 10px; margin-top: 1.125rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .nfe-fields-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
    .nfe-field { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
    .nfe-field-label { flex-shrink: 0; min-width: 160px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text2); }
    .nfe-field-value { font-size: 12.5px; color: var(--text); word-break: break-all; }
    .nfe-field-value-row { display: flex; align-items: center; gap: 8px; }
    .copy-btn {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--border);
      background: none; color: var(--text2); cursor: pointer; transition: color 120ms, border-color 120ms;
    }
    .copy-btn:hover { color: var(--accent); border-color: var(--accent); }
    .nfe-field-data { margin-left: 8px; color: var(--text2); font-size: 11.5px; }
    .nfe-field--alerta .nfe-field-label, .nfe-field--alerta .nfe-field-value { color: var(--red); }
    .nfe-field--alerta .nfe-field-data { color: var(--red); opacity: .75; }
    .nfe-impostos-grid { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .nfe-imposto-item { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--text); }
    .nfe-imposto-item--destaque span:last-child { color: var(--accent); font-weight: 700; }
    .nfe-imposto-item .footer-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text2); }

    /* ── Accordion (Impostos da nota) ── */
    .accordion { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg2); }
    .accordion-header {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      padding: .625rem .875rem; background: var(--bg3); border: none; cursor: pointer;
      font-size: 13px; font-weight: 600; color: var(--text); font-family: inherit;
    }
    .accordion--aberto .accordion-header { border-bottom: 1px solid var(--border); }
    .accordion-chevron { transition: transform .18s ease; flex-shrink: 0; color: var(--text2); }
    .accordion--aberto .accordion-chevron { transform: rotate(180deg); }
    .accordion-body { padding: .875rem; }
    .documento-results { display: flex; flex-direction: column; gap: 2px; max-height: 240px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; }
    .documento-result-item { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; cursor: pointer; border-bottom: 1px solid var(--border); }
    .documento-result-item:last-child { border-bottom: none; }
    .documento-result-item:hover { background: var(--bg3); }
    .form-actions { display: flex; align-items: center; justify-content: flex-start; }

    /* ── Histórico / timeline ── */
    .timeline { display: flex; flex-direction: column; }
    .timeline-item { display: flex; gap: 12px; position: relative; padding-bottom: 1.25rem; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-item:not(:last-child)::before {
      content: ''; position: absolute; left: 5px; top: 14px; bottom: 0; width: 1px; background: var(--border);
    }
    .timeline-dot { flex-shrink: 0; width: 11px; height: 11px; border-radius: 50%; margin-top: 3px; background: var(--text2); }
    /* Verde: a ação foi concluída com sucesso (criação, emissão, cancelamento de NF-e feito de propósito). */
    .timeline-dot--criado, .timeline-dot--emitido, .timeline-dot--emitidonfefocus, .timeline-dot--nfecancelada { background: var(--green); }
    .timeline-dot--nfeprocessando { background: #ffc107; }
    /* Vermelho: só quando algo deu errado de fato (rejeição da SEFAZ, falha ao emitir). */
    .timeline-dot--nferejeitada, .timeline-dot--erroemissaonfe { background: var(--red); }
    /* Cinza: ações administrativas/neutras — pedido cancelado não é um erro, é uma decisão. */
    .timeline-dot--cancelado, .timeline-dot--vinculonfe, .timeline-dot--desvinculonfe { background: #7c8299; }
    .timeline-desc { margin: 0; font-size: 13px; color: var(--text); }
    .timeline-meta { margin: 2px 0 0; font-size: 11px; color: var(--text2); }
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .btn-ghost-sm {
      background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 6px;
      padding: 4px 10px; font-size: 12px; cursor: pointer; text-decoration: none; display: inline-block;
    }
    .btn-ghost-sm:hover { color: var(--accent); border-color: var(--accent); text-decoration: none; }

    .combo-field { position: relative; }
    .combo-row { display: flex; gap: 6px; }
    .combo-row .input { flex: 1; }
    .btn-inline { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: 0 .625rem; font-size: 12px; cursor: pointer; white-space: nowrap; }
    .btn-inline:hover { color: var(--accent); border-color: var(--accent); }
    .combo-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20;
      background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,.25); max-height: 220px; overflow-y: auto;
    }
    .combo-item { padding: 7px 10px; font-size: 12.5px; color: var(--text); cursor: pointer; display: flex; align-items: center; gap: 6px; justify-content: space-between; }
    .combo-item:hover { background: var(--bg3); }
    .combo-item-active { background: var(--bg3); }
    .combo-item-create { color: var(--accent); border-top: 1px solid var(--border); font-weight: 600; }
    .combo-item-hint { color: var(--text2); cursor: default; font-style: italic; }
    .combo-item-hint:hover { background: none; }
    .combo-item-badge {
      font-size: 10.5px; color: var(--red); background: rgba(255,77,109,.12);
      border-radius: 4px; padding: 1px 6px; white-space: nowrap; flex-shrink: 0;
    }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
    .modal-confirm, .modal-quick {
      background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
      max-width: 420px; width: 100%; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
    }
    .confirm-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); }
    .confirm-msg { margin: 0; font-size: 13.5px; color: var(--text2); }
    .quick-hint { margin: 0; font-size: 12px; color: var(--text2); }
    .modal-erro-nfe { max-width: 480px; }
    .erro-nfe-lista { display: flex; flex-direction: column; gap: .625rem; max-height: 340px; overflow-y: auto; }
    .erro-nfe-item { display: flex; flex-direction: column; gap: 4px; padding: .625rem .75rem; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; }
    .erro-nfe-titulo { margin: 0; font-size: 13px; font-weight: 700; color: var(--red); }
    .erro-nfe-explicacao { margin: 0; font-size: 12.5px; color: var(--text2); }
    .erro-nfe-item .btn-ghost-sm { align-self: flex-start; margin-top: 2px; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary.danger { background: var(--red); }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 720px; }

    /* ── Tablet (iPad) e mobile ── */
    @media (max-width: 1024px) {
      .header-section .form-grid { grid-template-columns: 1fr 1fr; }
      .impostos-form-grid { grid-template-columns: repeat(2, 1fr); }
      .detail-grid { grid-template-columns: repeat(2, 1fr); }
      .nfe-field-label { min-width: 130px; }
    }

    @media (max-width: 640px) {
      .form-grid, .header-section .form-grid, .impostos-form-grid, .detail-grid {
        grid-template-columns: 1fr;
      }
      .col-2, .col-4 { grid-column: span 1; }
      .header-top { flex-direction: column; align-items: stretch; }
      .section-title-row { flex-direction: column; align-items: flex-start; gap: .375rem; }
      .list-header { flex-direction: column; align-items: stretch; gap: .5rem; }
      .nfe-card-row, .nfe-card-actions { flex-direction: column; align-items: stretch; }
      .nfe-card-actions { gap: 6px; }
      .nfe-field { flex-direction: column; gap: 2px; }
      .nfe-field-label { min-width: 0; }
      .confirm-actions { flex-direction: column-reverse; }
      .confirm-actions button { width: 100%; }
    }
  `],
})
export class PedidoFormComponent implements OnInit, OnDestroy {
  private readonly _pedidoSvc = inject(PedidoService);
  private readonly _clienteSvc = inject(ClienteService);
  private readonly _prodSvc   = inject(ProdutoService);
  private readonly _destSvc   = inject(DestinatarioService);
  private readonly _transSvc  = inject(TransportadoraService);
  private readonly _docSvc    = inject(DocumentoService);
  private readonly _route     = inject(ActivatedRoute);
  private readonly _router    = inject(Router);
  private readonly _toast     = inject(ToastService);

  private clienteId = '';
  private pedidoId  = '';

  readonly isNew    = signal(true);
  // Só fica true durante a busca do pedido disparada pelo paramMap (carga inicial ou troca via
  // Anterior/Próximo) — não durante recargas pontuais depois de uma ação (emitir, vincular
  // documento etc.), que já têm seus próprios spinners locais nos botões.
  readonly carregandoPedido = signal(false);
  readonly salvando = signal(false);
  readonly salvandoEEmitindo = signal(false);
  readonly erro     = signal<string | null>(null);
  readonly pedidoStatus   = signal<string>('Rascunho');
  readonly numero         = signal<number | null>(null);
  readonly emitindo       = signal(false);
  readonly cancelando     = signal(false);
  readonly duplicando     = signal(false);
  readonly excluindo      = signal(false);

  readonly documentoVinculado = signal<DocumentoVinculadoInfo | null>(null);
  readonly nfeEmissao = signal<NfeEmissaoDto | null>(null);
  readonly emitindoNfeFocus = signal(false);
  readonly showErroNfeModal = signal(false);
  // Preenchido quando a EMISSÃO nem chega a ser tentada na Focus — a checagem prévia do
  // próprio backend (NCM/CFOP/CST ausente ou inválido) já barra na hora, sem gastar uma
  // chamada com a SEFAZ. Usa o mesmo modal/link de "erro de rejeição" pra não duplicar UI.
  readonly preflightErroNfe = signal<{ campo?: string; mensagem: string } | null>(null);
  readonly showCancelarNfeModal = signal(false);
  readonly cancelandoNfe = signal(false);
  readonly erroCancelarNfe = signal<string | null>(null);
  justificativaCancelamento = '';

  readonly showCartaCorrecaoModal = signal(false);
  readonly enviandoCartaCorrecao = signal(false);
  readonly erroCartaCorrecao = signal<string | null>(null);
  readonly sucessoCartaCorrecao = signal(false);
  textoCartaCorrecao = '';
  private _nfeEmissaoPollTimer: ReturnType<typeof setTimeout> | null = null;

  // Traduz cada {campo, mensagem} que a Focus devolveu numa explicação em português e, quando
  // dá pra identificar onde corrigir (item de um produto, destinatário, dados fiscais da
  // empresa), aponta um link direto — em vez de só repetir o texto cru da API terceira.
  readonly erroNfeDetalhes = computed(() => {
    const preflight = this.preflightErroNfe();
    if (preflight) return [this._explicarErroNfe(preflight.campo, preflight.mensagem)];

    const ne = this.nfeEmissao();
    if (!ne) return [];
    const erros = ne.errosDetalhados;
    if (erros && erros.length > 0) return erros.map(e => this._explicarErroNfe(e.campo, e.mensagem));
    return [{ titulo: 'Erro na emissão', explicacao: ne.mensagemErro || 'Não foi possível emitir a NF-e.' }];
  });

  private _explicarErroNfe(campo: string | undefined, mensagem: string): { titulo: string; explicacao: string; acaoLabel?: string; acaoLink?: unknown[] } {
    if (!campo) return { titulo: 'Erro de validação', explicacao: mensagem };

    if (campo === 'modalidade_frete') {
      return { titulo: 'Tipo de Frete não preenchido', explicacao: 'Escolha o Tipo de Frete no cabeçalho deste pedido (logo abaixo) e tente novamente.' };
    }
    if (campo === 'natureza_operacao') {
      return { titulo: 'Natureza da Operação não preenchida', explicacao: 'Preencha a Natureza da Operação no cabeçalho deste pedido e tente novamente.' };
    }

    const itemMatch = /^itens\.(\d+)\.(.+)$/.exec(campo);
    if (itemMatch) {
      const idx = Number(itemMatch[1]) - 1;
      const subcampo = itemMatch[2];
      const item = this.itens()[idx];
      const nomeItem = item?.descricao ? `"${item.descricao}"` : `item ${idx + 1}`;
      const campoLabel = subcampo === 'codigo_ncm' ? 'NCM' : subcampo === 'cfop' ? 'CFOP' : subcampo;
      return {
        titulo: `${campoLabel} do produto ${nomeItem} está incorreto`,
        explicacao: `${mensagem} — corrija o cadastro desse produto.`,
        acaoLabel: item?.produtoId ? 'Editar produto' : undefined,
        acaoLink: item?.produtoId ? ['/clientes', this.clienteId, 'cadastros', 'produtos', item.produtoId] : undefined,
      };
    }

    if (campo.endsWith('_destinatario')) {
      return {
        titulo: 'Dado do destinatário incompleto',
        explicacao: `${mensagem} — corrija o cadastro do destinatário deste pedido.`,
        acaoLabel: 'Editar destinatário',
        acaoLink: this.form.destinatarioId ? ['/clientes', this.clienteId, 'cadastros', 'destinatarios', this.form.destinatarioId] : undefined,
      };
    }

    if (campo.endsWith('_emitente') || campo.includes('regime') || campo.includes('inscricao')) {
      return {
        titulo: 'Dado fiscal da empresa incompleto',
        explicacao: `${mensagem} — corrija na tela Empresa.`,
        acaoLabel: 'Ir para Empresa',
        acaoLink: ['/clientes', this.clienteId, 'empresa'],
      };
    }

    return { titulo: campo, explicacao: mensagem };
  }

  readonly cliente = signal<ClienteDto | null>(null);
  // Emissão via Focus NFe só aparece pro cliente que o Administrador habilitou E que já tem
  // certificado registrado na Focus — sem isso, a tela continua exatamente como era antes
  // (só a opção de vincular uma NF-e importada de outro sistema).
  readonly focusNfeDisponivel = computed(() =>
    !!this.cliente()?.nfeHabilitado && this.cliente()?.focusNfeStatus === 'Registrada');
  readonly documentoImpostos = signal<PedidoDto['documentoImpostos'] | null>(null);
  readonly historico = signal<PedidoHistoricoDto[]>([]);
  readonly impostosAbertos = signal(false);
  readonly desvinculando = signal(false);
  readonly showVincularDocumento = signal(false);
  readonly documentoResults = signal<DocumentoDto[]>([]);
  readonly erroVincularDocumento = signal<string | null>(null);
  documentoBusca = '';
  private _docSearchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly vizinhoAnteriorId = signal<string | null>(null);
  readonly vizinhoAnteriorNumero = signal<number | null>(null);
  readonly vizinhoProximoId = signal<string | null>(null);
  readonly vizinhoProximoNumero = signal<number | null>(null);
  readonly vizinhoPosicao = signal<number | null>(null);
  readonly vizinhoTotal = signal<number | null>(null);

  readonly autoSalvando = signal(false);
  readonly autoSalvo = signal(false);
  private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private _autoSalvoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly readonly = computed(() => !this.isNew() && this.pedidoStatus() !== 'Rascunho');

  itens = signal<PedidoItemInput[]>([]);
  readonly rowErrors = signal<Set<number>>(new Set());
  readonly expandedRows = signal<Set<number>>(new Set());

  form = this._emptyForm();

  // Destinatário: busca server-side em vez de carregar tudo de uma vez.
  destinatarioSearch = '';
  readonly destinatarioResults = signal<DestinatarioDto[]>([]);
  readonly destinatarioDropdownOpen = signal(false);
  // Índice destacado pra navegação por teclado (seta cima/baixo + Enter) — -1 é "nenhum".
  readonly destinatarioHighlight = signal(-1);
  private _destSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // Transportadora: opcional, mesmo padrão de busca do Destinatário.
  transportadoraSearch = '';
  readonly transportadoraResults = signal<TransportadoraDto[]>([]);
  readonly transportadoraDropdownOpen = signal(false);
  readonly transportadoraHighlight = signal(-1);
  private _transSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // Produto por linha: mesmo padrão de busca, um dropdown por vez — por isso um único
  // highlight serve (só a linha em produtoDropdownIndex tem dropdown aberto).
  produtoBusca: string[] = [];
  readonly produtoHighlight = signal(-1);
  readonly produtoResults = signal<ProdutoDto[]>([]);
  readonly produtoDropdownIndex = signal<number | null>(null);
  private _prodSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // Sugestão "adicionar novamente": produtos que esse destinatário mais comprou.
  readonly produtosFrequentes = signal<ProdutoDto[]>([]);

  readonly confirmState = signal<ConfirmState | null>(null);

  readonly showNovoDestinatario = signal(false);
  novoDestinatarioForm = { razaoSocial: '', cpfCnpj: '' };
  readonly salvandoNovoDestinatario = signal(false);
  readonly erroNovoDestinatario = signal<string | null>(null);

  readonly showNovoProduto = signal(false);
  novoProdutoForm = { descricao: '', precoUnitario: 0 };
  private _novoProdutoRowIndex: number | null = null;
  readonly salvandoNovoProduto = signal(false);
  readonly erroNovoProduto = signal<string | null>(null);

  readonly valorItens = computed(() =>
    this.itens().reduce((sum, i) => sum + this.itemTotal(i), 0)
  );

  // Método comum (não computed) porque soma campos do `form` (frete/seguro/outras despesas),
  // que não é um signal — um computed() só reavalia quando um signal-dependência muda
  // (itens()), então editar só o frete sem mexer nos itens deixaria o total exibido
  // desatualizado até a próxima mudança nos itens.
  valorTotal(): number {
    return this.valorItens() + (+this.form.valorFrete || 0) + (+this.form.valorSeguro || 0) + (+this.form.valorOutrasDespesas || 0);
  }

  readonly totalImpostos = computed(() =>
    this.itens().reduce((sum, i) => sum + this.itemImpostos(i), 0)
  );

  // Toast flutuante no topo, além do texto inline — sem isso a mensagem só aparecia lá embaixo
  // na tela, exigindo rolar pra ver se salvou ou deu erro.
  private _erro(mensagem: string): void {
    this.erro.set(mensagem);
    this._toast.error(mensagem);
  }

  ngOnInit(): void {
    // Assina paramMap (em vez de ler o snapshot uma vez só) porque "Anterior/Próximo" navega
    // pra outro :pedidoId dentro da MESMA rota — o Angular reaproveita esta instância do
    // componente nesse caso, então um ngOnInit que só rodasse uma vez nunca pegaria a troca.
    this._route.paramMap.subscribe(params => {
      this.clienteId = params.get('id')!;
      this.pedidoId  = params.get('pedidoId') ?? '';
      this.isNew.set(!this.pedidoId || this.pedidoId === 'novo');
      this._resetState();

      this._clienteSvc.getById(this.clienteId).subscribe({ next: c => this.cliente.set(c) });

      if (!this.isNew()) {
        this.carregandoPedido.set(true);
        this._pedidoSvc.getById(this.clienteId, this.pedidoId).subscribe({
          next: p => { this._carregarPedido(p); this._carregarVizinhos(); this.carregandoPedido.set(false); },
          error: () => this.carregandoPedido.set(false),
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this._nfeEmissaoPollTimer) clearTimeout(this._nfeEmissaoPollTimer);
  }

  private _resetState(): void {
    this.erro.set(null);
    this.pedidoStatus.set('Rascunho');
    this.numero.set(null);
    this.documentoVinculado.set(null);
    this.nfeEmissao.set(null);
    this.cliente.set(null);
    if (this._nfeEmissaoPollTimer) { clearTimeout(this._nfeEmissaoPollTimer); this._nfeEmissaoPollTimer = null; }
    this.documentoImpostos.set(null);
    this.impostosAbertos.set(false);
    this.vizinhoAnteriorId.set(null);
    this.vizinhoAnteriorNumero.set(null);
    this.vizinhoProximoId.set(null);
    this.vizinhoProximoNumero.set(null);
    this.vizinhoPosicao.set(null);
    this.vizinhoTotal.set(null);
    this.autoSalvando.set(false);
    this.autoSalvo.set(false);
    this.rowErrors.set(new Set());
    this.expandedRows.set(new Set());
    this.form = this._emptyForm();
    this.destinatarioSearch = '';
    this.transportadoraSearch = '';
    this.itens.set([]);
    this.produtoBusca = [];
    this.produtosFrequentes.set([]);
    this.historico.set([]);
    this._dirty = false;
  }

  private _carregarHistorico(): void {
    if (!this.pedidoId) { this.historico.set([]); return; }
    this._pedidoSvc.getHistorico(this.clienteId, this.pedidoId).subscribe({
      next: h => this.historico.set(h),
      error: () => this.historico.set([]),
    });
  }

  private _carregarVizinhos(): void {
    this._pedidoSvc.getVizinhos(this.clienteId, this.pedidoId).subscribe({
      next: v => {
        this.vizinhoAnteriorId.set(v.anteriorId ?? null);
        this.vizinhoAnteriorNumero.set(v.anteriorNumero ?? null);
        this.vizinhoProximoId.set(v.proximoId ?? null);
        this.vizinhoProximoNumero.set(v.proximoNumero ?? null);
        this.vizinhoPosicao.set(v.posicao);
        this.vizinhoTotal.set(v.total);
      },
    });
  }

  irParaAnterior(): void {
    const id = this.vizinhoAnteriorId();
    if (!id) return;
    this._confirmarSaidaSeSujo(() => this._router.navigate(['/clientes', this.clienteId, 'pedidos', id]));
  }

  irParaProximo(): void {
    const id = this.vizinhoProximoId();
    if (!id) return;
    this._confirmarSaidaSeSujo(() => this._router.navigate(['/clientes', this.clienteId, 'pedidos', id]));
  }

  // ── Aviso de alterações não salvas ──────────────────────────────────────
  // Rastreado manualmente (em vez de comparar snapshots) porque form/itens são mutados
  // diretamente pelo ngModel, sem passar por um signal que dispararia um computed sozinho.
  private _dirty = false;

  marcarSujo(): void { this._dirty = true; }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this._dirty && !this.readonly()) {
      event.preventDefault();
      event.returnValue = true;
    }
  }

  private _confirmarSaidaSeSujo(acao: () => void): void {
    if (!this._dirty) { acao(); return; }
    this.abrirConfirm(
      'Sair sem salvar?',
      'Este pedido tem alterações que ainda não foram salvas. Se você sair agora, elas serão perdidas.',
      () => { this._dirty = false; acao(); },
      true,
    );
  }

  private _emptyForm() {
    // Data de Saída por padrão é a própria data de emissão do pedido (hoje) — usuário troca
    // só quando a mercadoria sai em outro dia.
    const hoje = new Date();
    const dataSaidaPadrao = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    return {
      destinatarioId: '', transportadoraId: '', observacoes: '', naturezaOperacao: 'Venda de mercadoria', finalidadeEmissao: 'Normal',
      modalidadeFrete: 'SemFrete',
      dataSaida: dataSaidaPadrao, formaPagamento: '', meioPagamento: '', informacoesComplementares: '',
      consumidorFinal: true, presencaComprador: 9,
      valorFrete: 0, valorSeguro: 0, valorOutrasDespesas: 0,
    };
  }

  private _carregarPedido(p: PedidoDto): void {
    this.pedidoStatus.set(p.status);
    this.numero.set(p.numero);
    this.documentoVinculado.set(p.documentoId
      ? {
          id: p.documentoId, numero: p.documentoNumero ?? '', serie: p.documentoSerie, chaveAcesso: p.documentoChaveAcesso, origem: p.documentoOrigem,
          status: p.documentoStatus, dataEmissao: p.documentoDataEmissao,
          protocoloAutorizacao: p.documentoProtocoloAutorizacao, dataAutorizacao: p.documentoDataAutorizacao,
          motivoCancelamento: p.documentoMotivoCancelamento, protocoloCancelamento: p.documentoProtocoloCancelamento,
          dataCancelamento: p.documentoDataCancelamento,
        }
      : null);
    this.documentoImpostos.set(p.documentoImpostos ?? null);
    this.form = {
      destinatarioId: p.destinatarioId, transportadoraId: p.transportadoraId ?? '', observacoes: p.observacoes ?? '',
      naturezaOperacao: p.naturezaOperacao || 'Venda de mercadoria',
      finalidadeEmissao: p.finalidadeEmissao || 'Normal',
      modalidadeFrete: p.modalidadeFrete || 'SemFrete',
      dataSaida: p.dataSaida ? p.dataSaida.slice(0, 10) : '',
      formaPagamento: p.formaPagamento ?? '', meioPagamento: p.meioPagamento ?? '',
      informacoesComplementares: p.informacoesComplementares ?? '',
      consumidorFinal: p.consumidorFinal ?? true,
      presencaComprador: p.presencaComprador ?? 9,
      valorFrete: p.valorFrete ?? 0,
      valorSeguro: p.valorSeguro ?? 0,
      valorOutrasDespesas: p.valorOutrasDespesas ?? 0,
    };
    this.destinatarioSearch = p.destinatarioNome;
    this.transportadoraSearch = p.transportadoraNome ?? '';
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
      cstIcms: i.cstIcms,
      cstPis: i.cstPis,
      cstCofins: i.cstCofins,
      icmsOrigem: i.icmsOrigem,
      ibsCbsCst: i.ibsCbsCst,
      ibsCbsClassificacaoTributaria: i.ibsCbsClassificacaoTributaria,
    })));
    this.produtoBusca = p.itens.map(i => i.descricao);
    this._dirty = false;
    this._carregarProdutosFrequentes(p.destinatarioId);
    this._carregarHistorico();
    if (!p.documentoId) this._carregarNfeEmissao();
  }

  private _carregarNfeEmissao(): void {
    if (!this.pedidoId) return;
    this._pedidoSvc.getNfeEmissao(this.clienteId, this.pedidoId).subscribe({
      next: ne => {
        this.nfeEmissao.set(ne);
        if (ne?.status === 'Processando') this._agendarPollNfeEmissao();
      },
    });
  }

  private _agendarPollNfeEmissao(): void {
    if (this._nfeEmissaoPollTimer) clearTimeout(this._nfeEmissaoPollTimer);
    this._nfeEmissaoPollTimer = setTimeout(() => {
      this._pedidoSvc.getNfeEmissao(this.clienteId, this.pedidoId).subscribe({
        next: ne => {
          this.nfeEmissao.set(ne);
          this._carregarHistorico();
          if (ne?.status === 'Processando') {
            this._agendarPollNfeEmissao();
          } else if (ne?.status === 'Autorizada') {
            this._pedidoSvc.getById(this.clienteId, this.pedidoId).subscribe({ next: p => this._carregarPedido(p) });
          }
        },
      });
    }, 5000);
  }

  emitirNfeFocus(): void {
    if (this.emitindoNfeFocus() || this.nfeEmissao()?.status === 'Processando') return;
    this.emitindoNfeFocus.set(true);
    this.erro.set(null);
    this.preflightErroNfe.set(null);
    this._pedidoSvc.emitirNfeFocus(this.clienteId, this.pedidoId).subscribe({
      next: ne => {
        this.emitindoNfeFocus.set(false);
        this.nfeEmissao.set(ne);
        this._carregarHistorico();
        if (ne.status === 'Processando') this._agendarPollNfeEmissao();
        else if (ne.status === 'Autorizada') this._pedidoSvc.getById(this.clienteId, this.pedidoId).subscribe({ next: p => this._carregarPedido(p) });
      },
      error: err => {
        this.emitindoNfeFocus.set(false);
        // Erro de pré-checagem (NCM/CFOP/CST ausente, transportadora x frete etc.) nem chega a
        // acionar a Focus — vem direto do nosso backend com {campo, mensagem}. Mostra no mesmo
        // modal com link pro cadastro, em vez de só um toast genérico.
        const campoErros = extractFieldErrors(err);
        const campo = campoErros ? Object.keys(campoErros)[0] : undefined;
        if (campo && campoErros) {
          this.preflightErroNfe.set({ campo, mensagem: campoErros[campo] });
          this.showErroNfeModal.set(true);
        } else {
          this._erro(extractErrorMessage(err, 'Erro ao emitir NF-e.'));
        }
      },
    });
  }

  abrirCancelarNfe(): void {
    this.justificativaCancelamento = '';
    this.erroCancelarNfe.set(null);
    this.showCancelarNfeModal.set(true);
  }

  fecharCancelarNfe(): void {
    this.showCancelarNfeModal.set(false);
  }

  confirmarCancelarNfe(): void {
    const justificativa = this.justificativaCancelamento.trim();
    if (justificativa.length < 15) return;
    this.cancelandoNfe.set(true);
    this.erroCancelarNfe.set(null);
    this._pedidoSvc.cancelarNfeFocus(this.clienteId, this.pedidoId, justificativa).subscribe({
      next: () => {
        this.cancelandoNfe.set(false);
        this.showCancelarNfeModal.set(false);
        this._carregarHistorico();
        this._pedidoSvc.getById(this.clienteId, this.pedidoId).subscribe({ next: p => this._carregarPedido(p) });
      },
      error: err => { this.cancelandoNfe.set(false); this.erroCancelarNfe.set(extractErrorMessage(err, 'Não foi possível cancelar a NF-e.')); },
    });
  }

  abrirCartaCorrecao(): void {
    this.textoCartaCorrecao = '';
    this.erroCartaCorrecao.set(null);
    this.sucessoCartaCorrecao.set(false);
    this.showCartaCorrecaoModal.set(true);
  }

  fecharCartaCorrecao(): void {
    this.showCartaCorrecaoModal.set(false);
  }

  confirmarCartaCorrecao(): void {
    const correcao = this.textoCartaCorrecao.trim();
    if (correcao.length < 15) return;
    this.enviandoCartaCorrecao.set(true);
    this.erroCartaCorrecao.set(null);
    this._pedidoSvc.corrigirNfeFocus(this.clienteId, this.pedidoId, correcao).subscribe({
      next: () => {
        this.enviandoCartaCorrecao.set(false);
        this.sucessoCartaCorrecao.set(true);
        this.textoCartaCorrecao = '';
        this._carregarHistorico();
        setTimeout(() => this.showCartaCorrecaoModal.set(false), 1500);
      },
      error: err => { this.enviandoCartaCorrecao.set(false); this.erroCartaCorrecao.set(extractErrorMessage(err, 'Não foi possível enviar a carta de correção.')); },
    });
  }

  private _carregarProdutosFrequentes(destinatarioId: string): void {
    if (!destinatarioId) { this.produtosFrequentes.set([]); return; }
    this._pedidoSvc.getProdutosFrequentes(this.clienteId, destinatarioId).subscribe({
      next: r => this.produtosFrequentes.set(r),
      error: () => this.produtosFrequentes.set([]),
    });
  }

  adicionarProdutoFrequente(prod: ProdutoDto): void {
    this.itens.update(l => [...l, {
      produtoId: prod.id,
      descricao: prod.descricao,
      unidade: prod.unidade,
      quantidade: 1,
      precoUnitario: prod.precoUnitario,
      desconto: 0,
      cfop: prod.cfop,
      ncm: prod.ncm,
      aliquotaIcms: prod.aliquotaIcms,
      aliquotaPis: prod.aliquotaPis,
      aliquotaCofins: prod.aliquotaCofins,
      cstIcms: prod.cstIcms,
      cstPis: prod.cstPis,
      cstCofins: prod.cstCofins,
      icmsOrigem: prod.icmsOrigem,
      ibsCbsCst: prod.ibsCbsCst,
      ibsCbsClassificacaoTributaria: prod.ibsCbsClassificacaoTributaria,
    }]);
    this.produtoBusca.push(`${prod.codigo} — ${prod.descricao}`);
    this.marcarSujo();
    this._agendarAutoSave();
  }

  goBack(): void {
    this._confirmarSaidaSeSujo(() => this._router.navigate(['/clientes', this.clienteId, 'pedidos']));
  }

  imprimir(): void {
    window.open(`/imprimir/pedidos/${this.clienteId}/${this.pedidoId}`, '_blank');
  }

  // Documento emitido pelo FiscalDoc (via Focus NFe) tem o PDF oficial gerado pela SEFAZ
  // guardado — usa ele direto (via link pré-assinado). Documento importado de outro sistema
  // nunca tem esse PDF (ou a emissão é anterior a essa funcionalidade), então cai no
  // renderizador HTML próprio (montado a partir do XML).
  visualizarDanfe(documentoId: string, origem?: string): void {
    if (origem !== 'FocusNfe') { window.open(`/imprimir/danfe/${documentoId}`, '_blank'); return; }
    this._docSvc.getDanfePdfLink(documentoId).subscribe({
      next: ({ url }) => window.open(url, '_blank'),
      error: () => window.open(`/imprimir/danfe/${documentoId}`, '_blank'),
    });
  }

  chaveFormatada(chave?: string): string {
    if (!chave) return '—';
    return chave.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  readonly chaveCopiada = signal(false);

  copiarChave(chave?: string): void {
    if (!chave) return;
    navigator.clipboard?.writeText(chave);
    this.chaveCopiada.set(true);
    setTimeout(() => this.chaveCopiada.set(false), 1800);
  }

  // ── Destinatário: busca + quick-create ──────────────────────────────────

  onDestinatarioInput(value: string): void {
    this.destinatarioSearch = value;
    this.form.destinatarioId = '';
    this.destinatarioDropdownOpen.set(true);
    this.destinatarioHighlight.set(-1);
    if (this._destSearchTimer) clearTimeout(this._destSearchTimer);
    if (!value.trim()) { this.destinatarioResults.set([]); return; }
    this._destSearchTimer = setTimeout(() => {
      this._destSvc.getAll(this.clienteId, { termo: value, pageSize: 20 }).subscribe({
        next: r => this.destinatarioResults.set(r.items),
      });
    }, 300);
  }

  onDestinatarioBlur(): void {
    setTimeout(() => this.destinatarioDropdownOpen.set(false), 150);
  }

  // Seta cima/baixo percorre os resultados da busca, Enter seleciona o destacado (ou o
  // primeiro, se nenhum foi destacado ainda) e Escape fecha sem escolher — evita depender só
  // do mouse pra quem prefere não tirar a mão do teclado.
  onDestinatarioKeydown(event: KeyboardEvent): void {
    const results = this.destinatarioResults();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.destinatarioDropdownOpen.set(true);
      this.destinatarioHighlight.update(h => Math.min(h + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.destinatarioHighlight.update(h => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      const idx = this.destinatarioHighlight() >= 0 ? this.destinatarioHighlight() : 0;
      const alvo = results[idx];
      if (alvo) { event.preventDefault(); this.selecionarDestinatario(alvo); }
    } else if (event.key === 'Escape') {
      this.destinatarioDropdownOpen.set(false);
    }
  }

  selecionarDestinatario(d: DestinatarioDto): void {
    this.form.destinatarioId = d.id;
    this.destinatarioSearch = d.razaoSocial;
    this.destinatarioDropdownOpen.set(false);
    this.marcarSujo();
    this._carregarProdutosFrequentes(d.id);
  }

  // ── Transportadora: busca (opcional) ────────────────────────────────────

  onTransportadoraInput(value: string): void {
    this.transportadoraSearch = value;
    this.form.transportadoraId = '';
    this.transportadoraDropdownOpen.set(true);
    this.transportadoraHighlight.set(-1);
    if (this._transSearchTimer) clearTimeout(this._transSearchTimer);
    if (!value.trim()) { this.transportadoraResults.set([]); return; }
    this._transSearchTimer = setTimeout(() => {
      this._transSvc.getAll(this.clienteId, { termo: value, pageSize: 20 }).subscribe({
        next: r => this.transportadoraResults.set(r.items),
      });
    }, 300);
  }

  onTransportadoraBlur(): void {
    setTimeout(() => this.transportadoraDropdownOpen.set(false), 150);
  }

  onTransportadoraKeydown(event: KeyboardEvent): void {
    const results = this.transportadoraResults();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.transportadoraDropdownOpen.set(true);
      this.transportadoraHighlight.update(h => Math.min(h + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.transportadoraHighlight.update(h => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      const idx = this.transportadoraHighlight() >= 0 ? this.transportadoraHighlight() : 0;
      const alvo = results[idx];
      if (alvo) { event.preventDefault(); this.selecionarTransportadora(alvo); }
    } else if (event.key === 'Escape') {
      this.transportadoraDropdownOpen.set(false);
    }
  }

  selecionarTransportadora(t: TransportadoraDto): void {
    this.form.transportadoraId = t.id;
    this.transportadoraSearch = t.razaoSocial;
    this.transportadoraDropdownOpen.set(false);
    this.marcarSujo();
  }

  limparTransportadora(): void {
    this.form.transportadoraId = '';
    this.transportadoraSearch = '';
    this.marcarSujo();
  }

  onModalidadeFreteChange(valor: string): void {
    this.form.modalidadeFrete = valor;
    if (valor === 'SemFrete' && this.form.transportadoraId) {
      this.limparTransportadora();
    }
    this.marcarSujo();
  }

  abrirNovoDestinatario(): void {
    this.novoDestinatarioForm = { razaoSocial: this.destinatarioSearch.trim(), cpfCnpj: '' };
    this.erroNovoDestinatario.set(null);
    this.showNovoDestinatario.set(true);
    this.destinatarioDropdownOpen.set(false);
  }

  fecharNovoDestinatario(): void { this.showNovoDestinatario.set(false); }

  salvarNovoDestinatario(): void {
    const razaoSocial = this.novoDestinatarioForm.razaoSocial.trim();
    if (!razaoSocial) { this.erroNovoDestinatario.set('Informe a razão social.'); return; }
    this.salvandoNovoDestinatario.set(true);
    this.erroNovoDestinatario.set(null);
    this._destSvc.create(this.clienteId, {
      razaoSocial,
      cpfCnpj: this.novoDestinatarioForm.cpfCnpj.trim() || undefined,
    }).subscribe({
      next: d => {
        this.salvandoNovoDestinatario.set(false);
        this.showNovoDestinatario.set(false);
        this.selecionarDestinatario(d);
      },
      error: err => {
        this.salvandoNovoDestinatario.set(false);
        this.erroNovoDestinatario.set(extractErrorMessage(err, 'Erro ao criar destinatário.'));
      },
    });
  }

  // ── Produto por linha: busca + quick-create ─────────────────────────────

  onProdutoInput(i: number, value: string): void {
    this.produtoBusca[i] = value;
    this.itens.update(l => l.map((it, idx) => idx !== i ? it : { ...it, produtoId: '' }));
    this.produtoDropdownIndex.set(i);
    this.produtoHighlight.set(-1);
    if (this._prodSearchTimer) clearTimeout(this._prodSearchTimer);
    if (!value.trim()) { this.produtoResults.set([]); return; }
    this._prodSearchTimer = setTimeout(() => {
      this._prodSvc.getAll(this.clienteId, { termo: value, pageSize: 20 }).subscribe({
        next: r => this.produtoResults.set(r.items),
      });
    }, 300);
  }

  onProdutoBlur(): void {
    setTimeout(() => this.produtoDropdownIndex.set(null), 150);
  }

  onProdutoKeydown(i: number, event: KeyboardEvent): void {
    const results = this.produtoResults();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.produtoDropdownIndex.set(i);
      this.produtoHighlight.update(h => Math.min(h + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.produtoHighlight.update(h => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      const idx = this.produtoHighlight() >= 0 ? this.produtoHighlight() : 0;
      const alvo = results[idx];
      if (alvo) { event.preventDefault(); this.selecionarProduto(i, alvo); }
    } else if (event.key === 'Escape') {
      this.produtoDropdownIndex.set(null);
    }
  }

  selecionarProduto(i: number, prod: ProdutoDto): void {
    this.produtoBusca[i] = `${prod.codigo} — ${prod.descricao}`;
    this.itens.update(l => l.map((it, idx) => idx !== i ? it : {
      ...it,
      produtoId: prod.id,
      descricao: prod.descricao,
      unidade: prod.unidade,
      precoUnitario: prod.precoUnitario,
      cfop: prod.cfop,
      ncm: prod.ncm,
      aliquotaIcms: prod.aliquotaIcms,
      aliquotaPis: prod.aliquotaPis,
      aliquotaCofins: prod.aliquotaCofins,
      cstIcms: prod.cstIcms,
      cstPis: prod.cstPis,
      cstCofins: prod.cstCofins,
      icmsOrigem: prod.icmsOrigem,
      ibsCbsCst: prod.ibsCbsCst,
      ibsCbsClassificacaoTributaria: prod.ibsCbsClassificacaoTributaria,
    }));
    this.produtoDropdownIndex.set(null);
  }

  abrirNovoProduto(i: number): void {
    this._novoProdutoRowIndex = i;
    this.novoProdutoForm = { descricao: (this.produtoBusca[i] ?? '').trim(), precoUnitario: 0 };
    this.erroNovoProduto.set(null);
    this.showNovoProduto.set(true);
    this.produtoDropdownIndex.set(null);
  }

  fecharNovoProduto(): void { this.showNovoProduto.set(false); }

  salvarNovoProduto(): void {
    const descricao = this.novoProdutoForm.descricao.trim();
    if (!descricao) { this.erroNovoProduto.set('Informe a descrição.'); return; }
    if (this.novoProdutoForm.precoUnitario < 0) { this.erroNovoProduto.set('Preço unitário não pode ser negativo.'); return; }
    this.salvandoNovoProduto.set(true);
    this.erroNovoProduto.set(null);
    const codigo = `AUTO-${Date.now().toString(36).toUpperCase()}`;
    this._prodSvc.create(this.clienteId, {
      codigo,
      descricao,
      unidade: 'UN',
      precoUnitario: +this.novoProdutoForm.precoUnitario,
      aliquotaIcms: 0,
      aliquotaPis: 0,
      aliquotaCofins: 0,
    }).subscribe({
      next: prod => {
        this.salvandoNovoProduto.set(false);
        this.showNovoProduto.set(false);
        if (this._novoProdutoRowIndex !== null) this.selecionarProduto(this._novoProdutoRowIndex, prod);
      },
      error: err => {
        this.salvandoNovoProduto.set(false);
        this.erroNovoProduto.set(extractErrorMessage(err, 'Erro ao criar produto.'));
      },
    });
  }

  // ── Confirmação genérica ────────────────────────────────────────────────

  abrirConfirm(titulo: string, mensagem: string, onConfirm: () => void, danger = false): void {
    this.confirmState.set({ titulo, mensagem, danger, onConfirm });
  }

  confirmarAcao(): void {
    const st = this.confirmState();
    this.confirmState.set(null);
    st?.onConfirm();
  }

  fecharConfirm(): void { this.confirmState.set(null); }

  // ── Ações do pedido ──────────────────────────────────────────────────────

  emitir(): void {
    if (this.emitindo()) return;
    this.abrirConfirm(
      'Emitir pedido',
      `Emitir o pedido ${this.numero()}? Depois de emitido ele não poderá mais ser editado.`,
      () => {
        this.emitindo.set(true);
        this.erro.set(null);
        this._pedidoSvc.emitir(this.clienteId, this.pedidoId).subscribe({
          next: p => { this.emitindo.set(false); this._carregarPedido(p); },
          error: err => { this.emitindo.set(false); this._erro(extractErrorMessage(err, 'Erro ao emitir pedido.')); },
        });
      },
    );
  }

  cancelar(): void {
    if (this.cancelando()) return;
    this.abrirConfirm(
      'Cancelar pedido',
      `Cancelar o pedido ${this.numero()}? Esta ação não pode ser desfeita.`,
      () => {
        this.cancelando.set(true);
        this.erro.set(null);
        this._pedidoSvc.cancelar(this.clienteId, this.pedidoId).subscribe({
          next: () => { this.cancelando.set(false); this.pedidoStatus.set('Cancelado'); this._carregarHistorico(); },
          error: err => { this.cancelando.set(false); this._erro(extractErrorMessage(err, 'Erro ao cancelar pedido.')); },
        });
      },
      true,
    );
  }

  duplicar(): void {
    if (this.duplicando()) return;
    this.duplicando.set(true);
    this.erro.set(null);
    this._pedidoSvc.duplicar(this.clienteId, this.pedidoId).subscribe({
      next: novo => { this.duplicando.set(false); this._router.navigate(['/clientes', this.clienteId, 'pedidos', novo.id]); },
      error: err => { this.duplicando.set(false); this._erro(extractErrorMessage(err, 'Erro ao duplicar pedido.')); },
    });
  }

  excluir(): void {
    if (this.excluindo()) return;
    this.abrirConfirm(
      'Excluir pedido',
      `Excluir o pedido ${this.numero()}? Esta ação não pode ser desfeita.`,
      () => {
        this.excluindo.set(true);
        this.erro.set(null);
        this._pedidoSvc.delete(this.clienteId, this.pedidoId).subscribe({
          next: () => { this.excluindo.set(false); this.goBack(); },
          error: err => { this.excluindo.set(false); this._erro(extractErrorMessage(err, 'Erro ao excluir pedido.')); },
        });
      },
      true,
    );
  }

  // ── Vínculo com NF-e importada (emitida externamente) ───────────────────

  abrirVincularDocumento(): void {
    this.documentoBusca = '';
    this.documentoResults.set([]);
    this.erroVincularDocumento.set(null);
    this.showVincularDocumento.set(true);
  }

  fecharVincularDocumento(): void { this.showVincularDocumento.set(false); }

  onDocumentoBuscaInput(value: string): void {
    this.documentoBusca = value;
    if (this._docSearchTimer) clearTimeout(this._docSearchTimer);
    if (!value.trim()) { this.documentoResults.set([]); return; }
    this._docSearchTimer = setTimeout(() => {
      this._docSvc.getAll({ clienteId: this.clienteId, termo: value, pageSize: 10 }).subscribe({
        next: r => this.documentoResults.set(r.items),
      });
    }, 300);
  }

  selecionarDocumentoVinculo(doc: DocumentoDto): void {
    this.erroVincularDocumento.set(null);
    this._pedidoSvc.vincularDocumento(this.clienteId, this.pedidoId, doc.id).subscribe({
      next: p => { this.showVincularDocumento.set(false); this._carregarPedido(p); },
      error: err => this.erroVincularDocumento.set(extractErrorMessage(err, 'Erro ao vincular documento.')),
    });
  }

  desvincularDocumento(): void {
    if (this.desvinculando()) return;
    this.desvinculando.set(true);
    this._pedidoSvc.desvincularDocumento(this.clienteId, this.pedidoId).subscribe({
      next: p => { this.desvinculando.set(false); this._carregarPedido(p); },
      error: err => { this.desvinculando.set(false); this._erro(extractErrorMessage(err, 'Erro ao desvincular documento.')); },
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
    this.produtoBusca.push('');
    this.marcarSujo();
    this._agendarAutoSave();
  }

  removerItem(i: number): void {
    this.itens.update(l => l.filter((_, idx) => idx !== i));
    this.produtoBusca.splice(i, 1);
    this.expandedRows.update(s => {
      const next = new Set<number>();
      for (const idx of s) {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      }
      return next;
    });
    this.marcarSujo();
    this._agendarAutoSave();
  }

  // Copia só os códigos fiscais que costumam ser iguais pra todo item de uma mesma NF-e
  // (CFOP, CST/CSOSN de ICMS/PIS/COFINS, IBS/CBS) do item "i" pros demais — NCM, descrição,
  // preço e quantidade ficam de fora porque são específicos de cada produto.
  aplicarFiscalATodosOsItens(i: number): void {
    const origem = this.itens()[i];
    if (!origem) return;
    this.itens.update(l => l.map((it, idx) => idx === i ? it : {
      ...it,
      cfop: origem.cfop,
      cstIcms: origem.cstIcms,
      cstPis: origem.cstPis,
      cstCofins: origem.cstCofins,
      icmsOrigem: origem.icmsOrigem,
      ibsCbsCst: origem.ibsCbsCst,
      ibsCbsClassificacaoTributaria: origem.ibsCbsClassificacaoTributaria,
    }));
    this._toast.success('Códigos fiscais aplicados aos demais itens.');
    this.marcarSujo();
    this._agendarAutoSave();
  }

  toggleExpand(i: number): void {
    this.expandedRows.update(s => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  calcTotal(_i: number): void {
    // ngModel muta o objeto do item diretamente (não passa por itens.set()),
    // então o signal "itens" nunca emite mudança sozinho. Recriar o array
    // força o computed valorTotal (e o total por linha) a recalcular na hora.
    this.itens.update(l => [...l]);
    this.marcarSujo();
    this._agendarAutoSave();
  }

  // ── Auto-save: dispara sozinho depois de mexer nos itens, pra não perder o pedido se o
  // usuário fechar a aba antes de clicar em "Salvar" manualmente. Só salva quando o cabeçalho
  // e todos os itens já têm o mínimo necessário — senão fica tentando (e falhando) a cada
  // tecla digitada num pedido ainda incompleto.
  private _agendarAutoSave(): void {
    if (this.readonly()) return;
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
    this._autoSaveTimer = setTimeout(() => this._autoSalvar(), 1000);
  }

  private _cancelarAutoSave(): void {
    if (this._autoSaveTimer) { clearTimeout(this._autoSaveTimer); this._autoSaveTimer = null; }
  }

  private _autoSalvar(): void {
    if (this.readonly() || this.salvando() || this.salvandoEEmitindo() || this.autoSalvando()) return;
    if (!this.form.destinatarioId || !this.form.naturezaOperacao.trim()) return;
    if (this.itens().length === 0) return;
    if (!this.itens().every(i => i.produtoId && i.quantidade > 0)) return;

    this.autoSalvando.set(true);
    this.autoSalvo.set(false);
    if (this._autoSalvoTimer) clearTimeout(this._autoSalvoTimer);

    const aoTerminar = () => {
      this.autoSalvando.set(false);
      this.autoSalvo.set(true);
      this._dirty = false;
      this._toast.success('Salvo automaticamente.', 2000);
      this._autoSalvoTimer = setTimeout(() => this.autoSalvo.set(false), 2500);
    };

    if (this.isNew()) {
      const req: CreatePedidoRequest = { clienteId: this.clienteId, ...this._montarRequest() };
      this._pedidoSvc.create(req).subscribe({
        next: p => { aoTerminar(); this._irParaPedidoCriado(p.id); },
        error: () => this.autoSalvando.set(false),
      });
    } else {
      this._pedidoSvc.update(this.clienteId, this.pedidoId, { id: this.pedidoId, ...this._montarRequest(), origem: 'auto' }).subscribe({
        next: () => aoTerminar(),
        error: () => this.autoSalvando.set(false),
      });
    }
  }

  private _irParaPedidoCriado(id: string): void {
    this.pedidoId = id;
    this.isNew.set(false);
    this._router.navigate(['/clientes', this.clienteId, 'pedidos', id], { replaceUrl: true });
  }

  itemTotal(item: PedidoItemInput): number {
    return Math.max(0, (+item.quantidade * +item.precoUnitario) - +item.desconto);
  }

  itemImpostos(item: PedidoItemInput): number {
    const base = this.itemTotal(item);
    const aliquota = (+item.aliquotaIcms || 0) + (+item.aliquotaPis || 0) + (+item.aliquotaCofins || 0);
    return base * aliquota / 100;
  }

  private _validarItens(): boolean {
    const invalidas = new Set<number>();
    let primeiraMensagem: string | null = null;

    this.itens().forEach((item, i) => {
      let msg: string | null = null;
      if (!item.produtoId) msg = `Selecione o produto do item ${i + 1}.`;
      else if (!item.quantidade || item.quantidade <= 0) msg = `Informe uma quantidade válida para o item ${i + 1}.`;
      else if (item.precoUnitario < 0) msg = `Preço unitário do item ${i + 1} não pode ser negativo.`;
      else if (item.desconto > item.quantidade * item.precoUnitario) msg = `Desconto do item ${i + 1} não pode ser maior que o valor do item.`;

      if (msg) {
        invalidas.add(i);
        primeiraMensagem ??= msg;
      }
    });

    this.rowErrors.set(invalidas);
    if (primeiraMensagem) { this._erro(primeiraMensagem); return false; }
    return true;
  }

  private _validarFormulario(): boolean {
    if (!this.form.destinatarioId) { this._erro('Selecione um destinatário.'); return false; }
    if (!this.form.naturezaOperacao.trim()) { this._erro('Informe a natureza da operação.'); return false; }
    if (this.itens().length === 0) { this._erro('Adicione pelo menos um item.'); return false; }
    return this._validarItens();
  }

  private _montarRequest() {
    return {
      observacoes: this.form.observacoes || undefined,
      itens: this.itens(),
      destinatarioId: this.form.destinatarioId,
      naturezaOperacao: this.form.naturezaOperacao,
      finalidadeEmissao: (this.form.finalidadeEmissao || undefined) as CreatePedidoRequest['finalidadeEmissao'],
      modalidadeFrete: (this.form.modalidadeFrete || undefined) as CreatePedidoRequest['modalidadeFrete'],
      dataSaida: this.form.dataSaida || undefined,
      formaPagamento: (this.form.formaPagamento || undefined) as CreatePedidoRequest['formaPagamento'],
      meioPagamento: (this.form.meioPagamento || undefined) as CreatePedidoRequest['meioPagamento'],
      informacoesComplementares: this.form.informacoesComplementares || undefined,
      consumidorFinal: this.form.consumidorFinal,
      presencaComprador: +this.form.presencaComprador,
      valorFrete: +this.form.valorFrete || 0,
      valorSeguro: +this.form.valorSeguro || 0,
      valorOutrasDespesas: +this.form.valorOutrasDespesas || 0,
      transportadoraId: this.form.transportadoraId || undefined,
    };
  }

  salvar(): void {
    if (this.salvando() || this.salvandoEEmitindo()) return;
    if (!this._validarFormulario()) return;

    this.salvando.set(true);
    this.erro.set(null);
    this._cancelarAutoSave();

    if (this.isNew()) {
      const req: CreatePedidoRequest = { clienteId: this.clienteId, ...this._montarRequest() };
      this._pedidoSvc.create(req).subscribe({
        next: p => { this.salvando.set(false); this._toast.success('Pedido criado com sucesso.'); this._irParaPedidoCriado(p.id); },
        error: (err) => { this.salvando.set(false); this._erro(extractErrorMessage(err, 'Erro ao criar pedido.')); },
      });
    } else {
      this._pedidoSvc.update(this.clienteId, this.pedidoId, { id: this.pedidoId, ...this._montarRequest(), origem: 'manual' }).subscribe({
        next: p => { this.salvando.set(false); this._toast.success('Pedido salvo com sucesso.'); this._carregarPedido(p); },
        error: (err) => { this.salvando.set(false); this._erro(extractErrorMessage(err, 'Erro ao atualizar pedido.')); },
      });
    }
  }

  salvarEEmitir(): void {
    if (this.salvando() || this.salvandoEEmitindo()) return;
    if (!this._validarFormulario()) return;

    this.salvandoEEmitindo.set(true);
    this.erro.set(null);
    this._cancelarAutoSave();

    const eraNovo = this.isNew();
    const usarFocus = this.focusNfeDisponivel();
    const aposSalvar = (id: string) => {
      if (usarFocus) {
        this._pedidoSvc.emitirNfeFocus(this.clienteId, id).subscribe({
          next: () => {
            this.salvandoEEmitindo.set(false);
            // Recarrega da API em vez de montar o estado na mão — cobre os três desfechos
            // possíveis (autorizada na hora, processando, ou rejeitada) com o mesmo código
            // que já trata isso em _carregarPedido/_carregarNfeEmissao.
            if (eraNovo) this._irParaPedidoCriado(id);
            else this._pedidoSvc.getById(this.clienteId, id).subscribe({ next: p => this._carregarPedido(p) });
          },
          error: err => {
            this.salvandoEEmitindo.set(false);
            this._erro(extractErrorMessage(err, 'Pedido salvo, mas houve um erro ao emitir a NF-e. Abra o pedido e tente novamente.'));
            if (eraNovo) this._irParaPedidoCriado(id);
          },
        });
        return;
      }
      this._pedidoSvc.emitir(this.clienteId, id).subscribe({
        next: p => {
          this.salvandoEEmitindo.set(false);
          if (eraNovo) this._irParaPedidoCriado(id);
          else this._carregarPedido(p);
        },
        error: err => {
          this.salvandoEEmitindo.set(false);
          this._erro(extractErrorMessage(err, 'Pedido salvo, mas houve um erro ao emitir. Abra o pedido e emita manualmente.'));
        },
      });
    };

    if (this.isNew()) {
      const req: CreatePedidoRequest = { clienteId: this.clienteId, ...this._montarRequest() };
      this._pedidoSvc.create(req).subscribe({
        next: p => aposSalvar(p.id),
        error: (err) => { this.salvandoEEmitindo.set(false); this._erro(extractErrorMessage(err, 'Erro ao criar pedido.')); },
      });
    } else {
      this._pedidoSvc.update(this.clienteId, this.pedidoId, { id: this.pedidoId, ...this._montarRequest(), origem: 'manual' }).subscribe({
        next: p => aposSalvar(p.id),
        error: (err) => { this.salvandoEEmitindo.set(false); this._erro(extractErrorMessage(err, 'Erro ao atualizar pedido.')); },
      });
    }
  }
}
