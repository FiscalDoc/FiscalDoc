import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PedidoService, ProdutoService, DestinatarioService, DocumentoService, extractErrorMessage } from '@veloxml/services';
import { PedidoDto, ProdutoDto, DestinatarioDto, PedidoItemInput, CreatePedidoRequest, DocumentoDto } from '@veloxml/models';

interface DocumentoVinculadoInfo {
  id: string;
  numero: string;
  chaveAcesso?: string;
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
  imports: [CommonModule, FormsModule, RouterLink],
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
            <h2 class="page-title">{{ isNew() ? 'Novo Pedido' : 'Pedido ' + numero() }}</h2>
            @if (!isNew()) {
              <span class="badge" [class]="statusClass()">{{ pedidoStatus() }}</span>
            }
            @if (!isNew() && (vizinhoAnteriorId() || vizinhoProximoId())) {
              <div class="nav-vizinhos">
                <button
                  type="button" class="nav-btn" [disabled]="!vizinhoAnteriorId()" (click)="irParaAnterior()"
                  [title]="vizinhoAnteriorNumero() ? 'Pedido nº ' + vizinhoAnteriorNumero() : 'Sem pedido anterior'"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button
                  type="button" class="nav-btn" [disabled]="!vizinhoProximoId()" (click)="irParaProximo()"
                  [title]="vizinhoProximoNumero() ? 'Pedido nº ' + vizinhoProximoNumero() : 'Sem próximo pedido'"
                >
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
              <button class="icon-btn" [disabled]="salvando() || salvandoEEmitindo()" (click)="salvarEEmitir()" title="Salvar e emitir em um passo">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                <span>{{ salvandoEEmitindo() ? 'Emitindo...' : 'Salvar e Emitir' }}</span>
              </button>
            }
            @if (!isNew()) {
              <button class="icon-btn" (click)="imprimir()" title="Imprimir Pedido">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 14h12v8H6z"/>
                </svg>
                <span>Imprimir</span>
              </button>
              <button class="icon-btn" disabled title="Emissão de Nota Fiscal — em breve">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 13H8M16 17H8M10 9H8"/>
                </svg>
                <span>Gerar Nota Fiscal</span>
              </button>
              <button class="icon-btn" [disabled]="duplicando()" (click)="duplicar()" title="Duplicar Pedido">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="12" height="12" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <span>{{ duplicando() ? 'Duplicando...' : 'Duplicar' }}</span>
              </button>
              @if (pedidoStatus() === 'Rascunho') {
                <button class="icon-btn" [disabled]="emitindo()" (click)="emitir()" title="Emitir Pedido">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  <span>{{ emitindo() ? 'Emitindo...' : 'Emitir' }}</span>
                </button>
                <button class="icon-btn danger" [disabled]="excluindo()" (click)="excluir()" title="Excluir Pedido">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  <span>{{ excluindo() ? 'Excluindo...' : 'Excluir' }}</span>
                </button>
              }
              @if (pedidoStatus() !== 'Cancelado') {
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
                <span class="badge badge-emitido">Emitido externamente</span>
                <div>
                  <p class="nfe-card-title">NF-e nº {{ doc.numero }}</p>
                  <p class="nfe-card-chave mono">{{ doc.chaveAcesso }}</p>
                </div>
              </div>
              <div class="nfe-card-actions">
                <a class="btn-ghost-sm" target="_blank" [href]="danfeUrl(doc.id)">Visualizar DANFE</a>
                <a class="btn-ghost-sm" [routerLink]="['/documentos']" [queryParams]="{ id: doc.id }">Ver documento</a>
                <button class="btn-ghost-sm" [disabled]="desvinculando()" (click)="desvincularDocumento()">
                  {{ desvinculando() ? 'Removendo...' : 'Desvincular' }}
                </button>
              </div>
            </div>
          </div>
        } @else {
          <div class="card section nfe-card">
            <div class="nfe-card-info">
              <span class="field-hint">Esse pedido ainda não tem uma NF-e real vinculada. Se ela já foi emitida em outro sistema, vincule o XML importado aqui.</span>
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
                placeholder="Buscar destinatário por nome..."
              />
              @if (!readonly()) {
                <button type="button" class="btn-inline" (click)="abrirNovoDestinatario()">+ Novo</button>
              }
            </div>
            @if (destinatarioDropdownOpen() && !readonly()) {
              <div class="combo-dropdown">
                @for (d of destinatarioResults(); track d.id) {
                  <div class="combo-item" (mousedown)="selecionarDestinatario(d)">
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
            <input class="input" [disabled]="readonly()" [(ngModel)]="form.naturezaOperacao" placeholder="Venda de mercadoria"/>
          </div>
          <div class="field">
            <label class="label">Data de Saída</label>
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
          <div class="field">
            <label class="label">Observações (interno)</label>
            <textarea class="input" [disabled]="readonly()" [(ngModel)]="form.observacoes" rows="1" placeholder="Opcional"></textarea>
          </div>
          <div class="field col-4">
            <label class="label">Informações Complementares (nota fiscal)</label>
            <textarea class="input" [disabled]="readonly()" [(ngModel)]="form.informacoesComplementares" rows="1" placeholder="Texto que vai para a nota fiscal (opcional)"></textarea>
          </div>
        </div>
      </div>

      @if (documentoImpostos(); as imp) {
        <div class="accordion" [class.accordion--aberto]="impostosAbertos()">
          <button type="button" class="accordion-header" (click)="impostosAbertos.set(!impostosAbertos())">
            <span>Impostos da Nota</span>
            <svg class="accordion-chevron" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          @if (impostosAbertos()) {
            <div class="accordion-body">
              <div class="nfe-impostos-grid">
                @if (imp.valorProdutos != null) { <div class="nfe-imposto-item"><span class="footer-label">Produtos</span><span>{{ imp.valorProdutos | currency:'BRL':'symbol':'1.2-2' }}</span></div> }
                @if (imp.valorIcms != null) { <div class="nfe-imposto-item"><span class="footer-label">ICMS</span><span>{{ imp.valorIcms | currency:'BRL':'symbol':'1.2-2' }}</span></div> }
                @if (imp.valorIpi != null) { <div class="nfe-imposto-item"><span class="footer-label">IPI</span><span>{{ imp.valorIpi | currency:'BRL':'symbol':'1.2-2' }}</span></div> }
                @if (imp.valorPis != null) { <div class="nfe-imposto-item"><span class="footer-label">PIS</span><span>{{ imp.valorPis | currency:'BRL':'symbol':'1.2-2' }}</span></div> }
                @if (imp.valorCofins != null) { <div class="nfe-imposto-item"><span class="footer-label">COFINS</span><span>{{ imp.valorCofins | currency:'BRL':'symbol':'1.2-2' }}</span></div> }
                @if (imp.valorAproxTributos != null) { <div class="nfe-imposto-item nfe-imposto-item--destaque"><span class="footer-label">Aprox. Tributos*</span><span>{{ imp.valorAproxTributos | currency:'BRL':'symbol':'1.2-2' }}</span></div> }
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

        @if (itens().length === 0) {
          <div class="empty">Nenhum item adicionado.</div>
        } @else {
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
                      placeholder="Buscar produto..."
                    />
                    @if (produtoDropdownIndex() === i && !readonly()) {
                      <div class="combo-dropdown">
                        @for (p of produtoResults(); track p.id) {
                          <div class="combo-item" (mousedown)="selecionarProduto(i, p)">{{ p.codigo }} — {{ p.descricao }}</div>
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
                  <td><input class="input-sm num" [class.error]="rowErrors().has(i)" [disabled]="readonly()" type="number" [(ngModel)]="item.precoUnitario" (input)="calcTotal(i)" min="0" step="0.01"/></td>
                  <td><input class="input-sm num" [class.error]="rowErrors().has(i)" [disabled]="readonly()" type="number" [(ngModel)]="item.desconto" (input)="calcTotal(i)" min="0" step="0.01"/></td>
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
                          <input class="input-sm" [disabled]="readonly()" [(ngModel)]="item.descricao"/>
                        </div>
                        <div class="field">
                          <label class="label">CFOP</label>
                          <input class="input-sm" [disabled]="readonly()" [(ngModel)]="item.cfop"/>
                        </div>
                        <div class="field">
                          <label class="label">NCM</label>
                          <input class="input-sm" [disabled]="readonly()" [(ngModel)]="item.ncm"/>
                        </div>
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
        }
      </div>

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
            <input class="input" type="number" min="0" step="0.01" [(ngModel)]="novoProdutoForm.precoUnitario"/>
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
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; flex-direction: column; gap: .5rem; }
    .back-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; padding: 0; align-self: flex-start; }
    .back-btn:hover { color: var(--accent); }
    .header-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; }
    .title-row { display: flex; align-items: center; gap: .75rem; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text); }
    .header-actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .nav-vizinhos { display: flex; gap: 4px; }
    .nav-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg2); color: var(--text2); cursor: pointer; padding: 0; }
    .nav-btn:hover:not(:disabled) { color: var(--text); border-color: var(--accent); }
    .nav-btn:disabled { opacity: .35; cursor: not-allowed; }
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
    .badge-emitido  { background: rgba(0,229,160,.12); color: var(--accent); }
    .badge-cancelado { background: rgba(255,77,109,.12); color: var(--red); }
    .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
    .section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .header-section { padding: 1.125rem 1.5rem; gap: .625rem; }
    .section-title { margin: 0; font-size: .95rem; font-weight: 600; color: var(--text); }
    .section-title-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
    .badge-tipo { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; background: rgba(124,130,153,.15); color: var(--text2); }
    .badge-tipo--nf { background: rgba(0,229,160,.12); color: var(--accent); }
    .list-header { display: flex; align-items: center; justify-content: space-between; }
    .header-section .form-grid { grid-template-columns: repeat(4, 1fr); gap: .625rem; }
    .col-2 { grid-column: span 2; }
    .col-4 { grid-column: span 4; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
    .field { display: flex; flex-direction: column; gap: 3px; }
    .header-section .label { font-size: 10px; }
    .label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input, textarea.input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: .5rem .75rem; font-size: 13.5px; outline: none; font-family: inherit; width: 100%; box-sizing: border-box; }
    .header-section .input, .header-section textarea.input { padding: .375rem .625rem; font-size: 13px; }
    .header-section textarea.input { min-height: 32px; resize: vertical; }
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
    .alert-error { background: rgba(255,77,109,.1); border: 1px solid rgba(255,77,109,.3); color: var(--red); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }
    .alert-info { background: rgba(124,130,153,.1); border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .625rem .875rem; font-size: 13px; }

    .nfe-card, .nfe-card-wrap { flex-direction: row; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; gap: 1rem; flex-wrap: wrap; }
    .nfe-card-wrap { flex-direction: column; align-items: stretch; }
    .nfe-card-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .nfe-card-info { display: flex; align-items: center; gap: 12px; }
    .nfe-card-title { margin: 0; font-size: 13px; font-weight: 600; color: var(--text); }
    .nfe-card-chave { margin: 2px 0 0; font-size: 11px; color: var(--text2); word-break: break-all; }
    .nfe-card-actions { display: flex; gap: 8px; flex-shrink: 0; }
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
    .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 8px; padding: .5rem 1rem; font-size: 13.5px; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--text2); color: var(--text); }
    .btn-ghost-sm { background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .btn-ghost-sm:hover { color: var(--accent); border-color: var(--accent); }

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
    .combo-item { padding: 7px 10px; font-size: 12.5px; color: var(--text); cursor: pointer; }
    .combo-item:hover { background: var(--bg3); }
    .combo-item-create { color: var(--accent); border-top: 1px solid var(--border); font-weight: 600; }
    .combo-item-hint { color: var(--text2); cursor: default; font-style: italic; }
    .combo-item-hint:hover { background: none; }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
    .modal-confirm, .modal-quick {
      background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
      max-width: 420px; width: 100%; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
    }
    .confirm-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); }
    .confirm-msg { margin: 0; font-size: 13.5px; color: var(--text2); }
    .quick-hint { margin: 0; font-size: 12px; color: var(--text2); }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #0d0f14; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary.danger { background: var(--red); }
  `],
})
export class PedidoFormComponent implements OnInit {
  private readonly _pedidoSvc = inject(PedidoService);
  private readonly _prodSvc   = inject(ProdutoService);
  private readonly _destSvc   = inject(DestinatarioService);
  private readonly _docSvc    = inject(DocumentoService);
  private readonly _route     = inject(ActivatedRoute);
  private readonly _router    = inject(Router);

  private clienteId = '';
  private pedidoId  = '';

  readonly isNew    = signal(true);
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
  readonly documentoImpostos = signal<PedidoDto['documentoImpostos'] | null>(null);
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
  private _destSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // Produto por linha: mesmo padrão de busca, um dropdown por vez.
  produtoBusca: string[] = [];
  readonly produtoResults = signal<ProdutoDto[]>([]);
  readonly produtoDropdownIndex = signal<number | null>(null);
  private _prodSearchTimer: ReturnType<typeof setTimeout> | null = null;

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

  readonly valorTotal = computed(() =>
    this.itens().reduce((sum, i) => sum + this.itemTotal(i), 0)
  );

  readonly totalImpostos = computed(() =>
    this.itens().reduce((sum, i) => sum + this.itemImpostos(i), 0)
  );

  ngOnInit(): void {
    // Assina paramMap (em vez de ler o snapshot uma vez só) porque "Anterior/Próximo" navega
    // pra outro :pedidoId dentro da MESMA rota — o Angular reaproveita esta instância do
    // componente nesse caso, então um ngOnInit que só rodasse uma vez nunca pegaria a troca.
    this._route.paramMap.subscribe(params => {
      this.clienteId = params.get('id')!;
      this.pedidoId  = params.get('pedidoId') ?? '';
      this.isNew.set(!this.pedidoId || this.pedidoId === 'novo');
      this._resetState();

      if (!this.isNew()) {
        this._pedidoSvc.getById(this.clienteId, this.pedidoId).subscribe({
          next: p => { this._carregarPedido(p); this._carregarVizinhos(); },
        });
      }
    });
  }

  private _resetState(): void {
    this.erro.set(null);
    this.pedidoStatus.set('Rascunho');
    this.numero.set(null);
    this.documentoVinculado.set(null);
    this.documentoImpostos.set(null);
    this.impostosAbertos.set(false);
    this.vizinhoAnteriorId.set(null);
    this.vizinhoAnteriorNumero.set(null);
    this.vizinhoProximoId.set(null);
    this.vizinhoProximoNumero.set(null);
    this.autoSalvando.set(false);
    this.autoSalvo.set(false);
    this.rowErrors.set(new Set());
    this.expandedRows.set(new Set());
    this.form = this._emptyForm();
    this.destinatarioSearch = '';
    this.itens.set([]);
    this.produtoBusca = [];
  }

  private _carregarVizinhos(): void {
    this._pedidoSvc.getVizinhos(this.clienteId, this.pedidoId).subscribe({
      next: v => {
        this.vizinhoAnteriorId.set(v.anteriorId ?? null);
        this.vizinhoAnteriorNumero.set(v.anteriorNumero ?? null);
        this.vizinhoProximoId.set(v.proximoId ?? null);
        this.vizinhoProximoNumero.set(v.proximoNumero ?? null);
      },
    });
  }

  irParaAnterior(): void {
    const id = this.vizinhoAnteriorId();
    if (id) this._router.navigate(['/clientes', this.clienteId, 'pedidos', id]);
  }

  irParaProximo(): void {
    const id = this.vizinhoProximoId();
    if (id) this._router.navigate(['/clientes', this.clienteId, 'pedidos', id]);
  }

  private _emptyForm() {
    // Data de Saída por padrão é a própria data de emissão do pedido (hoje) — usuário troca
    // só quando a mercadoria sai em outro dia.
    const hoje = new Date();
    const dataSaidaPadrao = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    return {
      destinatarioId: '', observacoes: '', naturezaOperacao: 'Venda de mercadoria',
      dataSaida: dataSaidaPadrao, formaPagamento: '', meioPagamento: '', informacoesComplementares: '',
    };
  }

  private _carregarPedido(p: PedidoDto): void {
    this.pedidoStatus.set(p.status);
    this.numero.set(p.numero);
    this.documentoVinculado.set(p.documentoId
      ? { id: p.documentoId, numero: p.documentoNumero ?? '', chaveAcesso: p.documentoChaveAcesso }
      : null);
    this.documentoImpostos.set(p.documentoImpostos ?? null);
    this.form = {
      destinatarioId: p.destinatarioId, observacoes: p.observacoes ?? '',
      naturezaOperacao: p.naturezaOperacao || 'Venda de mercadoria',
      dataSaida: p.dataSaida ? p.dataSaida.slice(0, 10) : '',
      formaPagamento: p.formaPagamento ?? '', meioPagamento: p.meioPagamento ?? '',
      informacoesComplementares: p.informacoesComplementares ?? '',
    };
    this.destinatarioSearch = p.destinatarioNome;
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
    this.produtoBusca = p.itens.map(i => i.descricao);
  }

  goBack(): void { this._router.navigate(['/clientes', this.clienteId, 'pedidos']); }

  imprimir(): void {
    window.open(`/imprimir/pedidos/${this.clienteId}/${this.pedidoId}`, '_blank');
  }

  danfeUrl(documentoId: string): string {
    return `/imprimir/danfe/${documentoId}`;
  }

  // ── Destinatário: busca + quick-create ──────────────────────────────────

  onDestinatarioInput(value: string): void {
    this.destinatarioSearch = value;
    this.form.destinatarioId = '';
    this.destinatarioDropdownOpen.set(true);
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

  selecionarDestinatario(d: DestinatarioDto): void {
    this.form.destinatarioId = d.id;
    this.destinatarioSearch = d.razaoSocial;
    this.destinatarioDropdownOpen.set(false);
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
          error: err => { this.emitindo.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao emitir pedido.')); },
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
          next: () => { this.cancelando.set(false); this.pedidoStatus.set('Cancelado'); },
          error: err => { this.cancelando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao cancelar pedido.')); },
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
      error: err => { this.duplicando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao duplicar pedido.')); },
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
          error: err => { this.excluindo.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao excluir pedido.')); },
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
      error: err => { this.desvinculando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao desvincular documento.')); },
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
      this._autoSalvoTimer = setTimeout(() => this.autoSalvo.set(false), 2500);
    };

    if (this.isNew()) {
      const req: CreatePedidoRequest = { clienteId: this.clienteId, ...this._montarRequest() };
      this._pedidoSvc.create(req).subscribe({
        next: p => { aoTerminar(); this._irParaPedidoCriado(p.id); },
        error: () => this.autoSalvando.set(false),
      });
    } else {
      this._pedidoSvc.update(this.clienteId, this.pedidoId, { id: this.pedidoId, ...this._montarRequest() }).subscribe({
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
    if (primeiraMensagem) { this.erro.set(primeiraMensagem); return false; }
    return true;
  }

  private _validarFormulario(): boolean {
    if (!this.form.destinatarioId) { this.erro.set('Selecione um destinatário.'); return false; }
    if (!this.form.naturezaOperacao.trim()) { this.erro.set('Informe a natureza da operação.'); return false; }
    if (this.itens().length === 0) { this.erro.set('Adicione pelo menos um item.'); return false; }
    return this._validarItens();
  }

  private _montarRequest() {
    return {
      observacoes: this.form.observacoes || undefined,
      itens: this.itens(),
      destinatarioId: this.form.destinatarioId,
      naturezaOperacao: this.form.naturezaOperacao,
      dataSaida: this.form.dataSaida || undefined,
      formaPagamento: (this.form.formaPagamento || undefined) as CreatePedidoRequest['formaPagamento'],
      meioPagamento: (this.form.meioPagamento || undefined) as CreatePedidoRequest['meioPagamento'],
      informacoesComplementares: this.form.informacoesComplementares || undefined,
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
        next: p => { this.salvando.set(false); this._irParaPedidoCriado(p.id); },
        error: (err) => { this.salvando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao criar pedido.')); },
      });
    } else {
      this._pedidoSvc.update(this.clienteId, this.pedidoId, { id: this.pedidoId, ...this._montarRequest() }).subscribe({
        next: p => { this.salvando.set(false); this._carregarPedido(p); },
        error: (err) => { this.salvando.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao atualizar pedido.')); },
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
    const aposSalvar = (id: string) => {
      this._pedidoSvc.emitir(this.clienteId, id).subscribe({
        next: p => {
          this.salvandoEEmitindo.set(false);
          if (eraNovo) this._irParaPedidoCriado(id);
          else this._carregarPedido(p);
        },
        error: err => {
          this.salvandoEEmitindo.set(false);
          this.erro.set(extractErrorMessage(err, 'Pedido salvo, mas houve um erro ao emitir. Abra o pedido e emita manualmente.'));
        },
      });
    };

    if (this.isNew()) {
      const req: CreatePedidoRequest = { clienteId: this.clienteId, ...this._montarRequest() };
      this._pedidoSvc.create(req).subscribe({
        next: p => aposSalvar(p.id),
        error: (err) => { this.salvandoEEmitindo.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao criar pedido.')); },
      });
    } else {
      this._pedidoSvc.update(this.clienteId, this.pedidoId, { id: this.pedidoId, ...this._montarRequest() }).subscribe({
        next: p => aposSalvar(p.id),
        error: (err) => { this.salvandoEEmitindo.set(false); this.erro.set(extractErrorMessage(err, 'Erro ao atualizar pedido.')); },
      });
    }
  }
}
