import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContadorService, ClienteService, extractErrorMessage } from '@veloxml/services';
import { ContadorDto, CobrancaDto, ClienteDto } from '@veloxml/models';
import { environment } from '../../../../environments/environment';

type Tab = 'visao-geral' | 'cadastro' | 'clientes' | 'financeiro' | 'acesso';

@Component({
  selector: 'app-contador-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
<div class="page">

  <!-- ── Back ── -->
  <div class="page-nav">
    <a routerLink="/contadores" class="back-link">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
      </svg>
      Contadores
    </a>
  </div>

  @if (loading()) {
    <div class="empty-state">Carregando...</div>
  } @else if (!contador()) {
    <div class="empty-state">Contador não encontrado.</div>
  } @else {

    <!-- ── Profile Header ── -->
    <div class="profile-header card">
      <div class="profile-left">
        <!-- Avatar / Foto -->
        <label class="avatar-upload" title="Clique para trocar a foto">
          <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFotoChange($event)" style="display:none"/>
          @if (contador()!.fotoUrl) {
            <img class="profile-avatar" [src]="fotoSrc(contador()!.id)" alt="foto"/>
          } @else {
            <div class="profile-avatar" [style.background]="avatarBg(contador()!.nome)">
              {{ initials(contador()!.nome) }}
            </div>
          }
          <div class="avatar-overlay">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          @if (uploadandoFoto()) {
            <div class="avatar-loading">...</div>
          }
        </label>
        <div>
          <h2 class="profile-name font-heading">{{ contador()!.nome }}</h2>
          @if (contador()!.empresa) {
            <div class="profile-empresa">{{ contador()!.empresa }}</div>
          }
          <div class="profile-email">{{ contador()!.email }}</div>
        </div>
      </div>
      <div class="profile-right">
        <div class="profile-stat">
          <span class="ps-num">{{ contador()!.totalClientes }}</span>
          <span class="ps-label">Clientes</span>
        </div>
        <div class="profile-stat">
          <span class="ps-num">{{ contador()!.cobrancaAtual?.valorTotal | currency:'BRL':'symbol':'1.0-0' }}</span>
          <span class="ps-label">Mês atual</span>
        </div>
        <div class="profile-stat">
          <div class="license-badge" [class]="contador()!.statusLicenca === 'Ativo' ? 'badge-ok' : 'badge-block'">
            {{ contador()!.statusLicenca }}
          </div>
          <span class="ps-label">Licença</span>
        </div>
        @if (contador()!.dataLimiteAcesso) {
          <div class="profile-stat">
            <span class="ps-num" [class.expired]="isExpired(contador()!.dataLimiteAcesso!)">
              {{ contador()!.dataLimiteAcesso! | date:'dd/MM/yy' }}
            </span>
            <span class="ps-label">Limite acesso</span>
          </div>
        }
      </div>
    </div>

    <!-- ── Alerta de vencimento ── -->
    @if (contador()!.dataLimiteAcesso && diasParaVencer(contador()!.dataLimiteAcesso!) <= 7) {
      <div class="vencimento-alert" [class.vencimento-expirado]="diasParaVencer(contador()!.dataLimiteAcesso!) <= 0">
        <div class="vencimento-icon">
          @if (diasParaVencer(contador()!.dataLimiteAcesso!) <= 0) {
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          } @else {
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
        </div>
        <div class="vencimento-texto">
          @if (diasParaVencer(contador()!.dataLimiteAcesso!) <= 0) {
            <strong>Acesso expirado!</strong> O acesso de <strong>{{ contador()!.nome }}</strong> expirou em <strong>{{ contador()!.dataLimiteAcesso! | date:'dd/MM/yyyy' }}</strong>. Renove o acesso na aba <em>Acesso & Licença</em>.
          } @else {
            <strong>Acesso expirando em {{ diasParaVencer(contador()!.dataLimiteAcesso!) }} dia(s)!</strong>
            O acesso de <strong>{{ contador()!.nome }}</strong> vence em <strong>{{ contador()!.dataLimiteAcesso! | date:'dd/MM/yyyy' }}</strong>. Renove o acesso na aba <em>Acesso & Licença</em>.
          }
        </div>
      </div>
    }

    <!-- ── Tabs ── -->
    <div class="tabs">
      @for (tab of tabs; track tab.id) {
        <button class="tab-btn" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
          {{ tab.label }}
        </button>
      }
    </div>

    <!-- ═══════════════ TAB: VISÃO GERAL ═══════════════ -->
    @if (activeTab() === 'visao-geral') {
      <div class="tab-content">
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon blue">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>
              </svg>
            </div>
            <div>
              <div class="kpi-num">{{ contador()!.totalClientes }}</div>
              <div class="kpi-label">Clientes ativos</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon accent">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <div class="kpi-num">{{ contador()!.cobrancaAtual?.xmlsProcessados ?? 0 }}</div>
              <div class="kpi-label">XMLs no mês</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon yellow">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div class="kpi-num">{{ contador()!.cobrancaAtual?.valorTotal | currency:'BRL':'symbol':'1.0-0' }}</div>
              <div class="kpi-label">Valor do mês</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" [class]="statusIconClass(contador()!.cobrancaAtual?.status)">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <div class="kpi-num">{{ contador()!.cobrancaAtual?.status ?? 'Sem cobrança' }}</div>
              <div class="kpi-label">Status cobrança</div>
            </div>
          </div>
        </div>

        @if (contador()!.cobrancaAtual) {
          <div class="card section-card">
            <h3 class="section-title">Cobrança do mês</h3>
            <div class="detail-grid">
              <div class="detail-row"><span class="detail-label">Período</span><span class="detail-val">{{ contador()!.cobrancaAtual!.mes }}/{{ contador()!.cobrancaAtual!.ano }}</span></div>
              <div class="detail-row"><span class="detail-label">Clientes faturados</span><span class="detail-val">{{ contador()!.cobrancaAtual!.totalClientes }}</span></div>
              <div class="detail-row"><span class="detail-label">Valor base</span><span class="detail-val">{{ contador()!.cobrancaAtual!.valorBase | currency:'BRL' }}</span></div>
              <div class="detail-row"><span class="detail-label">XMLs excedentes</span><span class="detail-val">{{ contador()!.cobrancaAtual!.xmlsExcedentes }}</span></div>
              <div class="detail-row"><span class="detail-label">Valor excedente</span><span class="detail-val">{{ contador()!.cobrancaAtual!.valorExcedente | currency:'BRL' }}</span></div>
              <div class="detail-row"><span class="detail-label">Total</span><span class="detail-val detail-total">{{ contador()!.cobrancaAtual!.valorTotal | currency:'BRL' }}</span></div>
              <div class="detail-row"><span class="detail-label">Vencimento</span><span class="detail-val">{{ contador()!.cobrancaAtual!.dataVencimento | date:'dd/MM/yyyy' }}</span></div>
            </div>
          </div>
        }
      </div>
    }

    <!-- ═══════════════ TAB: CADASTRO ═══════════════ -->
    @if (activeTab() === 'cadastro') {
      <div class="tab-content">
        <div class="card section-card">
          <h3 class="section-title">Dados do Contador</h3>
          <div class="form-row-2">
            <div class="field-sm">
              <label class="label-sm">Nome *</label>
              <input class="input-sm" type="text" [(ngModel)]="edit.nome" placeholder="Nome completo"/>
            </div>
            <div class="field-sm">
              <label class="label-sm">E-mail (somente leitura)</label>
              <input class="input-sm" type="email" [value]="contador()!.email" disabled/>
            </div>
            <div class="field-sm">
              <label class="label-sm">Empresa / Escritório</label>
              <input class="input-sm" type="text" [(ngModel)]="edit.empresa" placeholder="Contabilidade Ltda"/>
            </div>
            <div class="field-sm">
              <label class="label-sm">CRC</label>
              <input class="input-sm" type="text" [(ngModel)]="edit.crc" placeholder="SP-123456"/>
            </div>
            <div class="field-sm">
              <label class="label-sm">Telefone</label>
              <input class="input-sm" type="text" [(ngModel)]="edit.telefone" placeholder="(11) 99999-9999"/>
            </div>
            <div class="field-sm">
              <label class="label-sm">Canal de notificação</label>
              <select class="input-sm" [(ngModel)]="edit.canalNotificacao">
                <option value="email">E-mail</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="ambos">Ambos</option>
                <option value="nenhum">Nenhum</option>
              </select>
            </div>
          </div>
          <div class="notif-row">
            <label class="check-label"><input type="checkbox" [(ngModel)]="edit.notifNovasNotas"/> Novas notas</label>
            <label class="check-label"><input type="checkbox" [(ngModel)]="edit.notifAlertas"/> Alertas</label>
            <label class="check-label"><input type="checkbox" [(ngModel)]="edit.notifResumoSemanal"/> Resumo semanal</label>
            <label class="check-label"><input type="checkbox" [(ngModel)]="edit.notifConsolidadoMensal"/> Consolidado mensal</label>
          </div>
          <div class="inline-actions">
            <button class="btn-primary-sm" (click)="salvarCadastro()" [disabled]="salvandoCadastro()">
              {{ salvandoCadastro() ? 'Salvando...' : 'Salvar alterações' }}
            </button>
          </div>
          @if (erroCadastro()) { <div class="inline-error">{{ erroCadastro() }}</div> }
          @if (sucessoCadastro()) { <div class="inline-success">{{ sucessoCadastro() }}</div> }
        </div>
      </div>
    }

    <!-- ═══════════════ TAB: CLIENTES ═══════════════ -->
    @if (activeTab() === 'clientes') {
      <div class="tab-content">
        <div class="card section-card">
          <h3 class="section-title">Clientes ({{ clientes().length }})</h3>
          @if (loadingClientes()) {
            <div class="empty-state">Carregando clientes...</div>
          } @else if (clientes().length === 0) {
            <div class="empty-state">Nenhum cliente encontrado.</div>
          } @else {
            <div class="table-scroll">
            <table class="table">
              <thead><tr><th>Cliente</th><th>CNPJ</th><th>E-mail</th><th>Status</th></tr></thead>
              <tbody>
                @for (cl of clientes(); track cl.id) {
                  <tr>
                    <td>
                      <div class="cell-name">
                        <div class="avatar-sm">{{ cl.razaoSocial[0] }}</div>
                        <div>
                          <div class="cell-title">{{ cl.nomeFantasia ?? cl.razaoSocial }}</div>
                          <div class="cell-sub">{{ cl.razaoSocial }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="text-mono">{{ cl.cnpj }}</td>
                    <td>{{ cl.email ?? '—' }}</td>
                    <td><span class="badge" [class]="cl.ativo ? 'badge-ok' : 'badge-muted'">{{ cl.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
            </div>
          }
        </div>
      </div>
    }

    <!-- ═══════════════ TAB: FINANCEIRO ═══════════════ -->
    @if (activeTab() === 'financeiro') {
      <div class="tab-content">

        <!-- Plano -->
        <div class="card section-card">
          <h3 class="section-title">Plano</h3>
          <div class="detail-grid" style="margin-bottom:1rem">
            <div class="detail-row"><span class="detail-label">Valor por cliente</span><span class="detail-val">{{ contador()!.valorPorCliente | currency:'BRL' }}</span></div>
            <div class="detail-row"><span class="detail-label">Limite XMLs/cliente</span><span class="detail-val">{{ contador()!.limiteXmlPorCliente }}</span></div>
            <div class="detail-row"><span class="detail-label">Valor XML excedente</span><span class="detail-val">{{ contador()!.valorXmlExcedente | currency:'BRL' }}</span></div>
          </div>
          <div class="form-row-3">
            <div class="field-sm">
              <label class="label-sm">Valor/cliente (R$)</label>
              <input type="number" class="input-sm" min="0" step="0.01" [(ngModel)]="plano.valorPorCliente"/>
            </div>
            <div class="field-sm">
              <label class="label-sm">Limite XMLs/cliente</label>
              <input type="number" class="input-sm" min="1" [(ngModel)]="plano.limiteXmlPorCliente"/>
            </div>
            <div class="field-sm">
              <label class="label-sm">XML excedente (R$)</label>
              <input type="number" class="input-sm" min="0" step="0.01" [(ngModel)]="plano.valorXmlExcedente"/>
            </div>
          </div>
          <div class="inline-actions">
            <button class="btn-primary-sm" (click)="salvarPlano()" [disabled]="salvandoPlano()">
              {{ salvandoPlano() ? 'Salvando...' : 'Salvar plano' }}
            </button>
          </div>
          @if (erroPlano()) { <div class="inline-error">{{ erroPlano() }}</div> }
          @if (sucessoPlano()) { <div class="inline-success">{{ sucessoPlano() }}</div> }
        </div>

        <!-- Gerar cobrança -->
        <div class="card section-card">
          <h3 class="section-title">Gerar cobrança</h3>
          <div class="form-row-3">
            <div class="field-sm">
              <label class="label-sm">Mês de referência</label>
              <select class="input-sm" [(ngModel)]="novaCob.mes">
                <option [value]="1">Janeiro</option><option [value]="2">Fevereiro</option>
                <option [value]="3">Março</option><option [value]="4">Abril</option>
                <option [value]="5">Maio</option><option [value]="6">Junho</option>
                <option [value]="7">Julho</option><option [value]="8">Agosto</option>
                <option [value]="9">Setembro</option><option [value]="10">Outubro</option>
                <option [value]="11">Novembro</option><option [value]="12">Dezembro</option>
              </select>
            </div>
            <div class="field-sm">
              <label class="label-sm">Ano</label>
              <select class="input-sm" [(ngModel)]="novaCob.ano">
                @for (a of anos; track a) { <option [value]="a">{{ a }}</option> }
              </select>
            </div>
            <div class="field-sm">
              <label class="label-sm">Dias para vencimento</label>
              <input type="number" class="input-sm" min="1" max="30" [(ngModel)]="novaCob.dias"/>
            </div>
          </div>
          <div class="inline-actions">
            <button class="btn-primary-sm" (click)="gerarCobranca()" [disabled]="gerandoCob()">
              {{ gerandoCob() ? 'Gerando...' : 'Gerar cobrança' }}
            </button>
          </div>
          @if (erroCob()) { <div class="inline-error">{{ erroCob() }}</div> }
          @if (sucessoCob()) { <div class="inline-success">{{ sucessoCob() }}</div> }
        </div>

        <!-- Histórico -->
        <div class="card section-card">
          <h3 class="section-title">Histórico de cobranças</h3>
          @if (historico().length === 0) {
            <div class="empty-state">Nenhuma cobrança registrada.</div>
          } @else {
            <div class="table-scroll">
            <table class="table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Clientes</th>
                  <th>XMLs</th>
                  <th>Total</th>
                  <th>Vencimento</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (cb of historico(); track cb.id) {
                  <tr>
                    <td class="text-mono">{{ cb.mes.toString().padStart(2,'0') }}/{{ cb.ano }}</td>
                    <td>{{ cb.totalClientes }}</td>
                    <td>
                      {{ cb.xmlsProcessados }}/{{ cb.limiteXmlTotal }}
                      @if (cb.xmlsExcedentes > 0) {
                        <span class="badge badge-block" style="margin-left:4px">+{{ cb.xmlsExcedentes }}</span>
                      }
                    </td>
                    <td><strong>{{ cb.valorTotal | currency:'BRL' }}</strong></td>
                    <td>{{ cb.dataVencimento | date:'dd/MM/yyyy' }}</td>
                    <td>{{ cb.dataPagamento ? (cb.dataPagamento | date:'dd/MM/yyyy') : '—' }}</td>
                    <td><span class="badge" [class]="cobrancaBadge(cb.status)">{{ cb.status }}</span></td>
                    <td>
                      @if (cb.status !== 'Pago') {
                        <button class="btn-link" (click)="marcarPaga(cb)">Marcar pago</button>
                      } @else {
                        <button class="btn-link" (click)="reabrir(cb)">Reabrir</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            </div>
          }
        </div>
      </div>
    }

    <!-- ═══════════════ TAB: ACESSO ═══════════════ -->
    @if (activeTab() === 'acesso') {
      <div class="tab-content">
        <div class="card section-card">
          <h3 class="section-title">Controle de acesso</h3>
          <div class="access-grid">

            <!-- Licença -->
            <div class="access-block">
              <div class="access-label">Status da licença</div>
              <div class="access-status">
                <span class="license-badge" [class]="contador()!.statusLicenca === 'Ativo' ? 'badge-ok' : 'badge-block'">
                  {{ contador()!.statusLicenca }}
                </span>
                @if (contador()!.motivoBloqueio) {
                  <span class="motive-text">{{ contador()!.motivoBloqueio }}</span>
                }
              </div>
              @if (contador()!.statusLicenca === 'Ativo') {
                <div class="access-actions">
                  <input type="text" class="input-date" placeholder="Motivo do bloqueio (opcional)"
                    [(ngModel)]="bloquearMotivo" style="flex:1;max-width:280px"/>
                  <button class="btn-danger" (click)="bloquear()" [disabled]="bloqueandoAcesso()">
                    {{ bloqueandoAcesso() ? 'Bloqueando...' : 'Bloquear acesso' }}
                  </button>
                </div>
              } @else {
                <div class="access-actions">
                  <button class="btn-success" (click)="liberar()">Liberar acesso</button>
                </div>
              }
              @if (erroBloqueio()) { <div class="inline-error">{{ erroBloqueio() }}</div> }
            </div>

            <!-- Período de avaliação -->
            <div class="access-block">
              <div class="access-label">Limite de acesso (trial)</div>
              <div class="access-status">
                @if (contador()!.dataLimiteAcesso) {
                  <span [class.expired]="isExpired(contador()!.dataLimiteAcesso!)">
                    {{ contador()!.dataLimiteAcesso! | date:'dd/MM/yyyy' }}
                    {{ isExpired(contador()!.dataLimiteAcesso!) ? '— EXPIRADO' : '' }}
                  </span>
                } @else {
                  <span class="text-muted">Sem limite definido</span>
                }
              </div>
              <div class="access-actions">
                <input type="date" class="input-date" [(ngModel)]="novaDataLimite"/>
                <button class="btn-primary-sm" (click)="salvarDataLimite()" [disabled]="salvandoData()">
                  {{ salvandoData() ? 'Salvando...' : 'Salvar data' }}
                </button>
                <button class="btn-ghost-sm" (click)="removerDataLimite()">Remover limite</button>
              </div>
              @if (erroData()) { <div class="inline-error">{{ erroData() }}</div> }
              @if (sucessoData()) { <div class="inline-success">{{ sucessoData() }}</div> }
            </div>

            <!-- Reset senha -->
            <div class="access-block">
              <div class="access-label">Senha do contador</div>
              <div class="access-status">
                @if (senhaEnviada()) {
                  <span class="inline-success">E-mail de redefinição de senha enviado para o contador.</span>
                } @else {
                  <span class="text-muted">Envia um e-mail para o contador definir uma nova senha</span>
                }
              </div>
              <div class="access-actions">
                <button class="btn-warning" (click)="resetarSenha()">Enviar redefinição de senha</button>
              </div>
              @if (erroSenha()) { <div class="inline-error">{{ erroSenha() }}</div> }
            </div>

            <!-- Reenviar e-mail -->
            <div class="access-block">
              <div class="access-label">E-mail de boas-vindas</div>
              <div class="access-status">
                <span class="text-muted">Reenvia as instruções de acesso para <strong>{{ contador()!.email }}</strong></span>
              </div>
              <div class="access-actions">
                <button class="btn-ghost-sm" (click)="reenviarEmail()" [disabled]="enviandoEmail()">
                  @if (enviandoEmail()) { Enviando... } @else {
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:-2px">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    Reenviar e-mail de boas-vindas
                  }
                </button>
              </div>
              @if (erroEmail()) { <div class="inline-error">{{ erroEmail() }}</div> }
              @if (sucessoEmail()) { <div class="inline-success">{{ sucessoEmail() }}</div> }
            </div>

          </div>
        </div>
      </div>
    }
  }
</div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-nav { display: flex; align-items: center; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text2); text-decoration: none; font-weight: 500;
      transition: color 120ms;
    }
    .back-link:hover { color: var(--text); }
    .empty-state { text-align: center; padding: 3rem; color: var(--text2); font-size: 14px; }

    .profile-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
    }
    .profile-left { display: flex; align-items: center; gap: 1rem; }
    .profile-avatar {
      width: 56px; height: 56px; border-radius: 14px; color: #0d0f14; font-size: 20px; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .profile-name { font-size: 1.2rem; margin: 0; }
    .profile-empresa { font-size: 12px; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .profile-email { font-size: 12.5px; color: var(--text2); }
    .profile-right { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .profile-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .ps-num { font-size: 1.2rem; font-weight: 700; color: var(--text); }
    .ps-label { font-size: 11px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.05em; }
    .expired { color: var(--red) !important; }

    .license-badge {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 10px; border-radius: 6px;
    }
    .badge-ok    { background: rgba(0,229,160,0.12); color: var(--accent); }
    .badge-block { background: rgba(255,77,109,0.12); color: var(--red); }
    .badge-muted { background: var(--bg3); color: var(--text2); }

    .vencimento-alert {
      display: flex; align-items: flex-start; gap: .875rem;
      background: rgba(255,209,102,0.10); border: 1px solid rgba(255,209,102,0.35);
      border-radius: var(--radius); padding: 1rem 1.25rem;
      color: var(--yellow);
    }
    .vencimento-alert.vencimento-expirado {
      background: rgba(255,77,109,0.10); border-color: rgba(255,77,109,0.35);
      color: var(--red);
    }
    .vencimento-icon { flex-shrink: 0; margin-top: 1px; }
    .vencimento-texto { font-size: 13.5px; line-height: 1.55; }
    .vencimento-texto strong { color: var(--text); }
    .vencimento-texto em { font-style: normal; text-decoration: underline; }

    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
    .tab-btn {
      background: none; border: none; color: var(--text2); font-size: 13.5px; font-weight: 500;
      padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent;
      margin-bottom: -1px; transition: color 120ms, border-color 120ms;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }

    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
    .kpi-card {
      background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius, 12px);
      padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem;
    }
    .kpi-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon.accent { background: rgba(0,229,160,0.12); color: var(--accent); }
    .kpi-icon.blue   { background: rgba(0,102,255,0.12);  color: #4d94ff; }
    .kpi-icon.yellow { background: rgba(255,209,102,0.12); color: var(--yellow); }
    .kpi-icon.red    { background: rgba(255,77,109,0.12);  color: var(--red); }
    .kpi-num   { font-size: 1.25rem; font-weight: 700; color: var(--text); }
    .kpi-label { font-size: 11px; color: var(--text2); margin-top: 2px; }

    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius, 12px); padding: 1.25rem; }
    .section-card { display: flex; flex-direction: column; gap: 1rem; }
    .section-title { font-size: 14px; font-weight: 700; color: var(--text); margin: 0; }

    .detail-grid { display: flex; flex-direction: column; }
    .detail-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 13.5px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: var(--text2); }
    .detail-val   { color: var(--text); font-weight: 500; }
    .detail-total { color: var(--accent); font-size: 1rem; font-weight: 700; }

    .table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .table th { text-align: left; padding: 8px 12px; color: var(--text2); font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid var(--border); }
    .table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 5px; }
    .cell-name { display: flex; align-items: center; gap: 10px; }
    .cell-title { font-weight: 600; font-size: 13.5px; }
    .cell-sub { font-size: 12px; color: var(--text2); }
    .text-mono { font-family: monospace; font-size: 12px; color: var(--text2); }
    .avatar-sm {
      width: 28px; height: 28px; border-radius: 7px; background: rgba(0,229,160,0.12);
      color: var(--accent); font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    /* Financeiro — inline forms */
    /* Avatar upload */
    .avatar-upload { position: relative; cursor: pointer; display: block; flex-shrink: 0; }
    .avatar-upload .profile-avatar { display: flex; }
    .avatar-overlay {
      position: absolute; inset: 0; border-radius: 14px; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center; color: #fff;
      opacity: 0; transition: opacity 150ms;
    }
    .avatar-upload:hover .avatar-overlay { opacity: 1; }
    .avatar-loading {
      position: absolute; inset: 0; border-radius: 14px; background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px;
    }
    img.profile-avatar { object-fit: cover; border-radius: 14px; width: 56px; height: 56px; }

    /* Cadastro form */
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .notif-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .check-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text2); cursor: pointer; }
    .check-label input { accent-color: var(--accent); width: 14px; height: 14px; }

    .form-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .field-sm { display: flex; flex-direction: column; gap: 4px; }
    .label-sm { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .04em; }
    .input-sm {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 7px;
      color: var(--text); padding: .45rem .65rem; font-size: 13px; outline: none; font-family: inherit;
    }
    .input-sm:focus { border-color: var(--accent); }
    select.input-sm { cursor: pointer; }
    .inline-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-link { background: none; border: none; color: var(--accent); font-size: 12px; cursor: pointer; padding: 0; text-decoration: underline; }

    /* Access tab */
    .access-grid { display: flex; flex-direction: column; gap: 1.5rem; }
    .access-block { display: flex; flex-direction: column; gap: 0.75rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .access-block:last-child { border-bottom: none; padding-bottom: 0; }
    .access-label { font-size: 12px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.07em; }
    .access-status { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text); flex-wrap: wrap; }
    .access-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .motive-text { font-size: 12px; color: var(--text2); font-style: italic; }
    .text-muted { color: var(--text2); font-size: 13px; }
    .input-date {
      background: var(--bg3); border: 1px solid var(--border); border-radius: 7px;
      padding: 6px 10px; color: var(--text); font-size: 13px; outline: none;
    }
    .input-date:focus { border-color: var(--accent); }

    .btn-primary-sm {
      background: var(--accent); color: #0d0f14; border: none; border-radius: 7px;
      padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-primary-sm:hover { opacity: 0.88; }
    .btn-primary-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost-sm {
      background: none; border: 1px solid var(--border); color: var(--text2); border-radius: 7px;
      padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
    }
    .btn-ghost-sm:hover { border-color: var(--text2); color: var(--text); }
    .btn-ghost-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger {
      background: rgba(255,77,109,0.12); color: var(--red); border: 1px solid rgba(255,77,109,0.25);
      border-radius: 7px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-danger:hover { background: rgba(255,77,109,0.2); }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-success {
      background: rgba(0,229,160,0.12); color: var(--accent); border: 1px solid rgba(0,229,160,0.25);
      border-radius: 7px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-success:hover { background: rgba(0,229,160,0.2); }
    .btn-warning {
      background: rgba(255,209,102,0.12); color: var(--yellow); border: 1px solid rgba(255,209,102,0.25);
      border-radius: 7px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-warning:hover { background: rgba(255,209,102,0.2); }
    .inline-error {
      font-size: 12.5px; color: var(--red);
      background: rgba(255,77,109,0.08); border: 1px solid rgba(255,77,109,0.2);
      border-radius: 7px; padding: 8px 12px; margin-top: 4px;
    }
    .inline-success {
      font-size: 12.5px; color: var(--accent);
      background: rgba(0,229,160,0.08); border: 1px solid rgba(0,229,160,0.2);
      border-radius: 7px; padding: 8px 12px; margin-top: 4px;
    }

    .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .table { min-width: 600px; }

    /* ── Tablet (iPad) e mobile ── */
    @media (max-width: 1024px) {
      .form-row-3 { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .profile-header { flex-direction: column; align-items: stretch; }
      .profile-right { justify-content: space-between; gap: 1rem; }
      .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
      .access-actions { flex-direction: column; align-items: stretch; }
      .access-actions .input-date { max-width: none !important; }
      .tabs { flex-wrap: wrap; }
    }
  `]
})
export class ContadorDetailComponent implements OnInit {
  private readonly _route      = inject(ActivatedRoute);
  private readonly _contSvc    = inject(ContadorService);
  private readonly _clienteSvc = inject(ClienteService);

  readonly tabs = [
    { id: 'visao-geral' as Tab, label: 'Visão Geral' },
    { id: 'cadastro'    as Tab, label: 'Cadastro' },
    { id: 'clientes'    as Tab, label: 'Clientes' },
    { id: 'financeiro'  as Tab, label: 'Financeiro' },
    { id: 'acesso'      as Tab, label: 'Acesso' },
  ];

  activeTab       = signal<Tab>('visao-geral');
  loading         = signal(true);
  loadingClientes = signal(false);
  contador        = signal<ContadorDto | null>(null);
  clientes        = signal<ClienteDto[]>([]);
  historico       = signal<CobrancaDto[]>([]);
  senhaEnviada    = signal(false);
  novaDataLimite  = '';
  bloquearMotivo  = '';

  // access signals
  salvandoData    = signal(false);
  erroData        = signal<string | null>(null);
  sucessoData     = signal<string | null>(null);
  bloqueandoAcesso = signal(false);
  erroBloqueio    = signal<string | null>(null);
  erroSenha       = signal<string | null>(null);
  enviandoEmail   = signal(false);
  erroEmail       = signal<string | null>(null);
  sucessoEmail    = signal<string | null>(null);

  // cadastro signals
  salvandoCadastro = signal(false);
  erroCadastro     = signal<string | null>(null);
  sucessoCadastro  = signal<string | null>(null);
  uploadandoFoto   = signal(false);

  edit = { nome: '', telefone: '', crc: '', empresa: '', canalNotificacao: 'ambos',
           notifNovasNotas: true, notifAlertas: true, notifResumoSemanal: false, notifConsolidadoMensal: false };

  // financeiro signals
  salvandoPlano   = signal(false);
  erroPlano       = signal<string | null>(null);
  sucessoPlano    = signal<string | null>(null);
  gerandoCob      = signal(false);
  erroCob         = signal<string | null>(null);
  sucessoCob      = signal<string | null>(null);

  plano = { valorPorCliente: 0, limiteXmlPorCliente: 0, valorXmlExcedente: 0 };
  novaCob = { mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), dias: 10 };
  readonly anos = [new Date().getFullYear(), new Date().getFullYear() - 1];

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._contSvc.getById(id).subscribe({
      next: (c) => {
        this.contador.set(c);
        this.loading.set(false);
        this._syncEdit(c);
        this.plano = { valorPorCliente: c.valorPorCliente, limiteXmlPorCliente: c.limiteXmlPorCliente, valorXmlExcedente: c.valorXmlExcedente };
        this._loadClientes(id);
        this._loadHistorico(id);
      },
      error: () => this.loading.set(false),
    });
  }

  private _loadClientes(id: string): void {
    this.loadingClientes.set(true);
    this._clienteSvc.getAll({ contadorId: id }).subscribe({
      next: (r) => { this.clientes.set(r.items); this.loadingClientes.set(false); },
      error: () => this.loadingClientes.set(false),
    });
  }

  private _loadHistorico(id: string): void {
    this._contSvc.getHistoricoCobrancas(id).subscribe({
      next: (h) => this.historico.set(h),
      error: () => {},
    });
  }

  private _syncEdit(c: ContadorDto): void {
    this.edit = {
      nome: c.nome, telefone: c.telefone ?? '', crc: c.crc ?? '',
      empresa: c.empresa ?? '', canalNotificacao: c.canalNotificacao,
      notifNovasNotas: true, notifAlertas: true,
      notifResumoSemanal: false, notifConsolidadoMensal: false,
    };
  }

  private _reload(): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._contSvc.getById(id).subscribe({ next: (c) => { this.contador.set(c); this._syncEdit(c); } });
  }

  // ── Cadastro ──

  salvarCadastro(): void {
    this.erroCadastro.set(null); this.sucessoCadastro.set(null);
    if (!this.edit.nome.trim()) { this.erroCadastro.set('O nome é obrigatório.'); return; }
    const id = this._route.snapshot.paramMap.get('id')!;
    this.salvandoCadastro.set(true);
    this._contSvc.update(id, {
      nome: this.edit.nome, telefone: this.edit.telefone || undefined,
      crc: this.edit.crc || undefined, empresa: this.edit.empresa || undefined,
      canalNotificacao: this.edit.canalNotificacao,
      notifNovasNotas: this.edit.notifNovasNotas, notifAlertas: this.edit.notifAlertas,
      notifResumoSemanal: this.edit.notifResumoSemanal, notifConsolidadoMensal: this.edit.notifConsolidadoMensal,
    }).subscribe({
      next: (c) => {
        this.salvandoCadastro.set(false);
        this.contador.set(c);
        this.sucessoCadastro.set('Cadastro atualizado com sucesso!');
        setTimeout(() => this.sucessoCadastro.set(null), 3000);
      },
      error: (e) => { this.salvandoCadastro.set(false); this.erroCadastro.set(extractErrorMessage(e, 'Erro ao salvar.')); },
    });
  }

  onFotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const id = this._route.snapshot.paramMap.get('id')!;
    this.uploadandoFoto.set(true);
    this._contSvc.uploadFoto(id, file).subscribe({
      next: () => { this.uploadandoFoto.set(false); this._reload(); },
      error: () => this.uploadandoFoto.set(false),
    });
  }

  fotoSrc(id: string): string {
    return `${environment.apiUrl}/contadores/${id}/foto?t=${Date.now()}`;
  }

  // ── Acesso ──

  bloquear(): void {
    this.erroBloqueio.set(null);
    const id = this._route.snapshot.paramMap.get('id')!;
    this.bloqueandoAcesso.set(true);
    this._contSvc.bloquear(id, this.bloquearMotivo || undefined).subscribe({
      next: () => { this.bloqueandoAcesso.set(false); this.bloquearMotivo = ''; this._reload(); },
      error: (e) => { this.bloqueandoAcesso.set(false); this.erroBloqueio.set(extractErrorMessage(e, 'Erro ao bloquear o acesso.')); },
    });
  }

  liberar(): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._contSvc.liberar(id).subscribe({
      next: () => this._reload(),
      error: (e) => this.erroBloqueio.set(extractErrorMessage(e, 'Erro ao liberar o acesso.')),
    });
  }

  salvarDataLimite(): void {
    this.erroData.set(null); this.sucessoData.set(null);
    if (!this.novaDataLimite) { this.erroData.set('Selecione uma data antes de salvar.'); return; }
    const id = this._route.snapshot.paramMap.get('id')!;
    this.salvandoData.set(true);
    this._contSvc.setDataLimiteAcesso(id, this.novaDataLimite).subscribe({
      next: () => {
        this.salvandoData.set(false);
        this.sucessoData.set('Data limite salva com sucesso!');
        this.novaDataLimite = '';
        this._reload();
        setTimeout(() => this.sucessoData.set(null), 3000);
      },
      error: (e) => { this.salvandoData.set(false); this.erroData.set(extractErrorMessage(e, 'Erro ao salvar a data.')); },
    });
  }

  removerDataLimite(): void {
    this.erroData.set(null); this.sucessoData.set(null);
    const id = this._route.snapshot.paramMap.get('id')!;
    this._contSvc.setDataLimiteAcesso(id, null).subscribe({
      next: () => { this.sucessoData.set('Limite removido.'); this._reload(); setTimeout(() => this.sucessoData.set(null), 3000); },
      error: (e) => this.erroData.set(extractErrorMessage(e, 'Erro ao remover o limite.')),
    });
  }

  resetarSenha(): void {
    this.erroSenha.set(null);
    const id = this._route.snapshot.paramMap.get('id')!;
    this._contSvc.resetSenha(id).subscribe({
      next: () => { this.senhaEnviada.set(true); setTimeout(() => this.senhaEnviada.set(false), 5000); },
      error: (e) => this.erroSenha.set(extractErrorMessage(e, 'Erro ao enviar e-mail de redefinição.')),
    });
  }

  reenviarEmail(): void {
    this.erroEmail.set(null); this.sucessoEmail.set(null);
    const id = this._route.snapshot.paramMap.get('id')!;
    this.enviandoEmail.set(true);
    this._contSvc.resendBoasVindas(id).subscribe({
      next: () => {
        this.enviandoEmail.set(false);
        this.sucessoEmail.set(`E-mail enviado para ${this.contador()!.email}`);
        setTimeout(() => this.sucessoEmail.set(null), 4000);
      },
      error: (e) => { this.enviandoEmail.set(false); this.erroEmail.set(extractErrorMessage(e, 'Erro ao enviar o e-mail.')); },
    });
  }

  // ── Financeiro ──

  salvarPlano(): void {
    this.erroPlano.set(null); this.sucessoPlano.set(null);
    const id = this._route.snapshot.paramMap.get('id')!;
    this.salvandoPlano.set(true);
    this._contSvc.atualizarPlano(id, { contadorId: id, ...this.plano }).subscribe({
      next: () => {
        this.salvandoPlano.set(false);
        this.sucessoPlano.set('Plano atualizado com sucesso!');
        this._reload();
        setTimeout(() => this.sucessoPlano.set(null), 3000);
      },
      error: (e) => { this.salvandoPlano.set(false); this.erroPlano.set(extractErrorMessage(e, 'Erro ao salvar o plano.')); },
    });
  }

  gerarCobranca(): void {
    this.erroCob.set(null); this.sucessoCob.set(null);
    const id = this._route.snapshot.paramMap.get('id')!;
    this.gerandoCob.set(true);
    this._contSvc.gerarCobranca(id, { mes: this.novaCob.mes, ano: this.novaCob.ano, diasVencimento: this.novaCob.dias }).subscribe({
      next: () => {
        this.gerandoCob.set(false);
        this.sucessoCob.set('Cobrança gerada com sucesso!');
        this._loadHistorico(id);
        this._reload();
        setTimeout(() => this.sucessoCob.set(null), 3000);
      },
      error: (e) => {
        this.gerandoCob.set(false);
        this.erroCob.set(e?.error?.detail ?? e?.error?.errors?.['Cobrança']?.[0] ?? 'Erro ao gerar cobrança.');
      },
    });
  }

  marcarPaga(cb: CobrancaDto): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._contSvc.marcarCobrancaPaga(cb.id).subscribe({ next: () => this._loadHistorico(id) });
  }

  reabrir(cb: CobrancaDto): void {
    const id = this._route.snapshot.paramMap.get('id')!;
    this._contSvc.reabrirCobranca(cb.id).subscribe({ next: () => this._loadHistorico(id) });
  }

  // ── Helpers ──

  initials(nome: string): string {
    const parts = nome.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0]?.[0] ?? '?').toUpperCase();
  }

  avatarBg(nome: string): string {
    const colors = ['#00e5a0','#0066ff','#a855f7','#f59e0b','#ef4444','#06b6d4','#84cc16','#ec4899'];
    let hash = 0;
    for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  isExpired(date: string): boolean { return new Date(date) < new Date(); }

  diasParaVencer(date: string): number {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  statusIconClass(status?: string): string {
    if (!status) return 'accent';
    if (status === 'Atrasado') return 'red';
    if (status === 'Pago') return 'accent';
    return 'yellow';
  }

  cobrancaBadge(status: string): string {
    if (status === 'Pago') return 'badge-ok';
    if (status === 'Atrasado') return 'badge-block';
    return 'badge-muted';
  }
}
