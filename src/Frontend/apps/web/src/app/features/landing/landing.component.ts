import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { extractErrorMessage, ConfiguracaoService } from '@veloxml/services';
import { SocialConfigDto } from '@veloxml/models';

const WPP_NUMBER = '5511973982559';
const WPP_MSG   = encodeURIComponent('Olá! Gostaria de saber mais sobre o FiscalDoc.');

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  template: `
    <!-- ─── NAVBAR ─────────────────────────────────────────── -->
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" routerLink="/" aria-label="FiscalDoc — página inicial">
          <span class="brand-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M6 3.5h8.5L19 8v12.5H6z" stroke-linejoin="round"/>
              <path d="M14 3.5V8h5" stroke-linejoin="round"/>
              <path d="M9 13h6M9 16.5h4" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="brand-fiscal">Fiscal</span><span class="brand-doc">Doc</span>
        </a>
        <nav class="nav-links">
          <a href="#features">Recursos</a>
          <a href="#how">Como funciona</a>
          <a href="#plans">Planos</a>
          <a routerLink="/blog">Blog</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contato</a>
        </nav>
        <a href="https://app.fiscaldoc.com.br/auth/login" class="btn btn-outline desktop-only">Acessar sistema</a>

        <button class="menu-toggle" type="button" [class.open]="mobileMenuOpen()"
          (click)="mobileMenuOpen.set(!mobileMenuOpen())"
          [attr.aria-expanded]="mobileMenuOpen()" aria-label="Abrir menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      @if (mobileMenuOpen()) {
        <nav class="mobile-nav">
          <a href="#features" (click)="mobileMenuOpen.set(false)">Recursos</a>
          <a href="#how" (click)="mobileMenuOpen.set(false)">Como funciona</a>
          <a href="#plans" (click)="mobileMenuOpen.set(false)">Planos</a>
          <a routerLink="/blog" (click)="mobileMenuOpen.set(false)">Blog</a>
          <a href="#faq" (click)="mobileMenuOpen.set(false)">FAQ</a>
          <a href="#contact" (click)="mobileMenuOpen.set(false)">Contato</a>
          <a href="https://app.fiscaldoc.com.br/auth/login" class="mobile-cta">Acessar sistema</a>
        </nav>
      }
    </header>

    <!-- ─── HERO ────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-bg-overlay"></div>
        <div class="hero-bg-fade"></div>
      </div>
      <div class="container hero-container">
        <div class="hero-copy">
          <div class="badge-pill">Sistema para Escritórios Contábeis</div>
          <h1 class="hero-title">
            Gerencie todos os seus<br>
            <span class="gradient-text">clientes em um só lugar</span>
          </h1>
          <p class="hero-sub">
            Receba, organize e monitore NF-e, CT-e, MDF-e e NFS-e automaticamente.
            Alertas inteligentes, histórico completo e controle total!
          </p>
          <div class="hero-cta">
            <a href="#trial" class="btn btn-primary btn-lg btn-cta">
              Faça um teste grátis
            </a>
            <a href="#features" class="btn btn-outline-light btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
              </svg>
              Ver recursos
            </a>
          </div>
          <div class="hero-checks">
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/></svg> Configuração em minutos</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/></svg> 30 dias de teste grátis</span>
          </div>
        </div>

        <!-- App mockup preview widget -->
        <div class="app-mockup">
          <div class="mockup-chrome">
            <span class="mockup-dot"></span><span class="mockup-dot"></span><span class="mockup-dot"></span>
            <span class="mockup-url">app.fiscaldoc.com.br/painel</span>
          </div>
          <div class="mockup-body">
            <aside class="mockup-sidebar">
              <p class="mockup-sidebar-label">Emissão</p>
              <nav class="mockup-sidebar-nav">
                <span class="mockup-nav-item active">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  NF-e
                </span>
                <span class="mockup-nav-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  NFC-e
                </span>
                <span class="mockup-nav-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01"/></svg>
                  NFS-e
                </span>
              </nav>
              <p class="mockup-sidebar-label">Gestão</p>
              <nav class="mockup-sidebar-nav muted">
                <span class="mockup-nav-item plain">Clientes</span>
                <span class="mockup-nav-item plain">Produtos</span>
                <span class="mockup-nav-item plain">Relatórios</span>
              </nav>
            </aside>

            <div class="mockup-main">
              <div class="mockup-main-head">
                <div>
                  <h3>Notas emitidas em agosto</h3>
                  <p>Atualizado há 2 minutos</p>
                </div>
                <span class="mockup-new-btn">Nova nota</span>
              </div>

              <div class="mockup-kpis">
                <div class="mockup-kpi">
                  <p class="kpi-label">Faturamento</p>
                  <p class="kpi-value">R$ 238.104</p>
                  <p class="kpi-delta">↑ 12,4%</p>
                </div>
                <div class="mockup-kpi">
                  <p class="kpi-label">Notas autorizadas</p>
                  <p class="kpi-value">1.284</p>
                  <p class="kpi-delta">↑ 8,1%</p>
                </div>
                <div class="mockup-kpi">
                  <p class="kpi-label">Rejeições</p>
                  <p class="kpi-value">0,3%</p>
                  <p class="kpi-delta down">↓ 1,2%</p>
                </div>
              </div>

              <div class="mockup-table-wrap">
                <table class="mockup-table">
                  <thead>
                    <tr><th>Documento</th><th class="hide-sm">Destinatário</th><th>Valor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>NF-e 004512</td><td class="hide-sm">Ventura Comércio LTDA</td><td>R$ 12.480,00</td>
                      <td><span class="mockup-status ok">Autorizada</span></td>
                    </tr>
                    <tr>
                      <td>NFC-e 009274</td><td class="hide-sm">Consumidor final</td><td>R$ 289,90</td>
                      <td><span class="mockup-status ok">Autorizada</span></td>
                    </tr>
                    <tr>
                      <td>NFS-e 001188</td><td class="hide-sm">Prisma Serviços ME</td><td>R$ 3.150,00</td>
                      <td><span class="mockup-status ok">Autorizada</span></td>
                    </tr>
                    <tr>
                      <td>NF-e 004511</td><td class="hide-sm">Loja Norte Distribuidora</td><td>R$ 7.905,40</td>
                      <td><span class="mockup-status pending">Processando</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-stats">
          <div class="stat">
            <span class="stat-num">4</span>
            <span class="stat-label">tipos de XML</span>
          </div>
          <div class="stat-div"></div>
          <div class="stat">
            <span class="stat-num">100%</span>
            <span class="stat-label">multi-cliente</span>
          </div>
          <div class="stat-div"></div>
          <div class="stat">
            <span class="stat-num">24h</span>
            <span class="stat-label">monitoramento</span>
          </div>
          <div class="stat-div"></div>
          <div class="stat">
            <span class="stat-num">∞</span>
            <span class="stat-label">documentos</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FEATURES ────────────────────────────────────────── -->
    <section class="features" id="features">
      <div class="container">
        <div class="section-label">Recursos</div>
        <h2 class="section-title">Tudo que um contador precisa</h2>
        <p class="section-sub">Do recebimento do XML até o alerta de inconsistência, o FiscalDoc cuida de tudo.</p>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon accent">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3>Recepção automática de XMLs</h3>
            <p>Cada cliente recebe uma AppKey única. Basta configurar a integração e os documentos chegam sozinhos — sem e-mail, sem upload manual.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon blue">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>
              </svg>
            </div>
            <h3>Multi-cliente em uma tela</h3>
            <p>Visualize todos os seus clientes, documentos e alertas de uma só vez. Filtre, pesquise e organize sem sair do sistema.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon yellow">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <h3>Alertas inteligentes</h3>
            <p>Detecta duplicatas, inconsistências e cancelamentos automaticamente. Você é avisado antes que vire problema para o seu cliente.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon accent">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </div>
            <h3>Download individual e em lote</h3>
            <p>Baixe qualquer XML com um clique, ou exporte todos os documentos de um cliente em um mês inteiro de uma vez.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon red">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>
            <h3>Auditoria completa</h3>
            <p>Todo acesso, upload e alteração fica registrado com data, hora e IP. Rastreabilidade total para você e seus clientes.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon blue">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3>Acesso seguro por papel</h3>
            <p>Admin, Contador e Cliente com permissões separadas. Cada um vê apenas o que é seu — sem risco de vazamento de dados entre clientes.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── HOW IT WORKS ─────────────────────────────────────── -->
    <section class="how" id="how">
      <div class="container">
        <div class="section-label">Como funciona</div>
        <h2 class="section-title">Simples de começar,<br>poderoso no dia a dia</h2>

        <div class="steps">
          <div class="step">
            <div class="step-num">01</div>
            <div class="step-content">
              <h3>Você cadastra seus clientes</h3>
              <p>Em minutos cadastre as empresas que você atende. O sistema gera automaticamente uma AppKey para cada uma.</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">02</div>
            <div class="step-content">
              <h3>O cliente integra e envia</h3>
              <p>Com a AppKey em mãos, o sistema do cliente (ERP, emissor de NF) envia os XMLs automaticamente via API. Zero trabalho manual.</p>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">03</div>
            <div class="step-content">
              <h3>Você monitora tudo</h3>
              <p>Dashboard com totais, alertas em tempo real, download a qualquer hora. Você no controle, seus clientes tranquilos.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PLANS ────────────────────────────────────────────── -->
    <section class="plans" id="plans">
      <div class="container">
        <div class="section-label">Planos</div>
        <h2 class="section-title">Um plano sob medida para o seu escritório</h2>
        <p class="section-sub">Sem taxa de setup, sem fidelidade. O valor é definido de acordo com o volume de clientes e XMLs — sem pacotes engessados.</p>

        <div class="plan-card plan-single">
          <div class="plan-badge">Fale com a gente</div>
          <ul class="plan-features">
            <li><span class="check">✓</span> NF-e, CT-e, MDF-e, NFS-e</li>
            <li><span class="check">✓</span> Recepção automática de XMLs por API</li>
            <li><span class="check">✓</span> Alertas automáticos de duplicidade e inconsistência</li>
            <li><span class="check">✓</span> Download individual e em lote</li>
            <li><span class="check">✓</span> Logs de auditoria completos</li>
            <li><span class="check">✓</span> Suporte via WhatsApp</li>
          </ul>
          <a [href]="wpp" target="_blank" class="btn btn-primary btn-full btn-lg">Solicitar Proposta</a>
        </div>
        <p class="plans-note">30 dias de teste grátis antes de qualquer compromisso.</p>
      </div>
    </section>

    <!-- ─── TRIAL + AUTO-CADASTRO ────────────────────────────── -->
    <section class="trial-section" id="trial" aria-labelledby="trial-heading">
      <div class="container">
        <div class="trial-grid">

          <!-- Comparativo -->
          <div class="comparison-col">
            <div class="section-label">Teste grátis</div>
            <h2 id="trial-heading" class="section-title">30 dias sem custo,<br>sem cartão de crédito</h2>
            <p class="section-sub">Comece hoje mesmo e veja na prática o quanto o FiscalDoc economiza o seu tempo.</p>

            <table class="comparison-table" role="table" aria-label="Comparativo Trial vs Plano Pago">
              <thead>
                <tr>
                  <th scope="col">Recurso</th>
                  <th scope="col">Trial <span class="badge-free">Grátis</span></th>
                  <th scope="col">Plano Pago</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Clientes cadastrados</td><td class="yes">Ilimitado</td><td class="yes">Ilimitado</td></tr>
                <tr><td>XMLs processados</td><td class="yes">100/mês</td><td class="yes">Ilimitado</td></tr>
                <tr><td>NF-e, CT-e, MDF-e</td><td class="yes">✓</td><td class="yes">✓</td></tr>
                <tr><td>Alertas automáticos</td><td class="yes">✓</td><td class="yes">✓</td></tr>
                <tr><td>Download em lote</td><td class="no">—</td><td class="yes">✓</td></tr>
                <tr><td>Auditoria completa</td><td class="no">—</td><td class="yes">✓</td></tr>
                <tr><td>Suporte prioritário</td><td class="no">—</td><td class="yes">✓</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Formulário -->
          <div class="register-col">
            <div class="register-card" role="region" aria-labelledby="register-heading">
              <div class="register-header">
                <h3 id="register-heading">Criar conta gratuita</h3>
                <p>Acesso imediato · Sem burocracia</p>
              </div>

              @if (!registerSuccess()) {
                <form [formGroup]="registerForm" (ngSubmit)="onRegister()" novalidate class="register-form">
                  <div class="form-group">
                    <label for="reg-nome">Seu nome completo <span class="required" aria-hidden="true">*</span></label>
                    <input id="reg-nome" formControlName="nome" type="text" autocomplete="name"
                      placeholder="João Silva" [class.error]="rf('nome')?.invalid && rf('nome')?.touched" />
                    @if (rf('nome')?.invalid && rf('nome')?.touched) {
                      <span class="field-error" role="alert">Nome é obrigatório</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="reg-email">E-mail profissional <span class="required" aria-hidden="true">*</span></label>
                    <input id="reg-email" formControlName="email" type="email" autocomplete="email"
                      placeholder="joao&#64;escritorio.com.br" [class.error]="rf('email')?.invalid && rf('email')?.touched" />
                    @if (rf('email')?.invalid && rf('email')?.touched) {
                      <span class="field-error" role="alert">E-mail inválido</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="reg-firma">Nome do escritório</label>
                    <input id="reg-firma" formControlName="nomeFirma" type="text" autocomplete="organization"
                      placeholder="Escritório Contábil Silva" />
                  </div>

                  <div class="form-group">
                    <label for="reg-senha">Senha <span class="required" aria-hidden="true">*</span></label>
                    <input id="reg-senha" formControlName="senha" type="password" autocomplete="new-password"
                      placeholder="Mínimo 8 caracteres" [class.error]="rf('senha')?.invalid && rf('senha')?.touched" />
                    @if (rf('senha')?.invalid && rf('senha')?.touched) {
                      <span class="field-error" role="alert">Senha deve ter ao menos 8 caracteres</span>
                    }
                  </div>

                  @if (registerError()) {
                    <div class="alert-form-error" role="alert">{{ registerError() }}</div>
                  }

                  <button type="submit" class="btn btn-primary btn-full btn-lg"
                    [disabled]="registering()" [attr.aria-busy]="registering()">
                    @if (registering()) {
                      <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Criando conta...
                    } @else {
                      Criar conta gratuita — 30 dias grátis
                    }
                  </button>
                  <p class="register-terms">Ao criar a conta você concorda com nossos <a href="#" class="link">Termos de Uso</a>.</p>
                </form>
              } @else {
                <div class="register-success" role="status">
                  <svg class="success-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h4>Conta criada com sucesso!</h4>
                  <p>Você tem 30 dias grátis. Acesse agora e comece a usar.</p>
                  <a href="https://app.fiscaldoc.com.br/auth/login" class="btn btn-primary btn-full">Acessar o sistema →</a>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ─── FAQ ────────────────────────────────────────────────── -->
    <section class="faq" id="faq">
      <div class="container">
        <div class="section-label">Dúvidas frequentes</div>
        <h2 class="section-title">Perguntas frequentes</h2>
        <p class="section-sub">Tudo que você precisa saber antes de começar a usar o FiscalDoc.</p>

        <div class="faq-list">
          @for (item of faqs; track item.q; let i = $index) {
            <div class="faq-item" [class.open]="openFaq() === i">
              <button type="button" class="faq-question" [attr.aria-expanded]="openFaq() === i" (click)="toggleFaq(i)">
                <span>{{ item.q }}</span>
                <svg class="faq-chevron" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              @if (openFaq() === i) {
                <div class="faq-answer">
                  <p>{{ item.a }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ─── CTA FINAL ────────────────────────────────────────── -->
    <section class="cta-section" id="contact">
      <div class="container">
        <div class="cta-card">
          <div class="cta-glow"></div>
          <h2>Pronto para organizar<br>sua contabilidade?</h2>
          <p>Fale com a gente agora pelo WhatsApp e receba acesso em minutos.</p>
          <div class="cta-btns">
            <a [href]="wpp" target="_blank" class="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Falar no WhatsApp
            </a>
            <a href="https://app.fiscaldoc.com.br/auth/login" class="btn btn-ghost btn-lg">Já tenho acesso →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FOOTER ────────────────────────────────────────────── -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col footer-col-brand">
            <div class="footer-brand">
              <span class="brand-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <path d="M6 3.5h8.5L19 8v12.5H6z" stroke-linejoin="round"/>
                  <path d="M14 3.5V8h5" stroke-linejoin="round"/>
                  <path d="M9 13h6M9 16.5h4" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="brand-fiscal">Fiscal</span><span class="brand-doc">Doc</span>
            </div>
            <p class="footer-tagline">Receba, organize e monitore NF-e, CT-e, MDF-e e NFS-e automaticamente.</p>

            @if (hasSocialLinks()) {
              <div class="footer-social">
                @if (social()?.instagram) {
                  <a [href]="social()!.instagram" target="_blank" rel="noopener" aria-label="Instagram" class="social-link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                }
                @if (social()?.facebook) {
                  <a [href]="social()!.facebook" target="_blank" rel="noopener" aria-label="Facebook" class="social-link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                    </svg>
                  </a>
                }
                @if (social()?.linkedin) {
                  <a [href]="social()!.linkedin" target="_blank" rel="noopener" aria-label="LinkedIn" class="social-link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                }
                @if (social()?.tiktok) {
                  <a [href]="social()!.tiktok" target="_blank" rel="noopener" aria-label="TikTok" class="social-link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
                    </svg>
                  </a>
                }
              </div>
            }
          </div>

          <div class="footer-col">
            <h3>Navegação</h3>
            <ul>
              <li><a href="#features">Recursos</a></li>
              <li><a href="#how">Como funciona</a></li>
              <li><a href="#plans">Planos</a></li>
              <li><a routerLink="/blog">Blog</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h3>Suporte</h3>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">Contato</a></li>
              <li><a [href]="wpp" target="_blank">Falar no WhatsApp</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h3>Sistema</h3>
            <ul>
              <li><a href="https://app.fiscaldoc.com.br/auth/login">Acessar sistema</a></li>
              <li><a href="#trial">Criar conta gratuita</a></li>
              <li><a href="#" class="link">Termos de Uso</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-copy">© 2025 FiscalDoc. Hub Fiscal para Contadores.</p>
          <a href="https://app.fiscaldoc.com.br/auth/login" class="btn btn-outline btn-sm">Acessar sistema</a>
        </div>
      </div>
    </footer>

    <!-- ─── WHATSAPP FLOATING ─────────────────────────────────── -->
    <a [href]="wpp" target="_blank" class="wpp-float" title="Falar no WhatsApp">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  `,
  styles: [`
    /* ─── RESET ──────────────────────────────── */
    :host {
      --lg-bg: oklch(0.16 0.03 262);
      --lg-fg: oklch(0.97 0.008 250);
      --lg-muted: oklch(0.74 0.025 256);
      --lg-border: oklch(1 0 0 / 12%);
      --lg-input: oklch(1 0 0 / 16%);
      --lg-brand: oklch(0.62 0.17 254);
      --lg-brand-foreground: white;
      --lg-brand-deep: oklch(0.97 0.01 250);
      --lg-brand-soft: oklch(0.29 0.06 256);
      --lg-cta: oklch(0.78 0.17 158);
      --lg-red: oklch(0.62 0.2 25);
      --lg-surface: oklch(0.185 0.032 262);
      --lg-footer: oklch(0.125 0.028 262);
      --lg-footer-fg: oklch(0.97 0.008 250);
      --lg-shadow-soft: 0 1px 2px oklch(0 0 0 / 0.4), 0 8px 24px oklch(0 0 0 / 0.35);
      --lg-shadow-lift: 0 2px 4px oklch(0 0 0 / 0.4), 0 24px 60px oklch(0 0 0 / 0.5);
      --lg-gradient-brand: linear-gradient(135deg, oklch(0.3 0.09 262), var(--lg-brand));
      display: block; font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
      letter-spacing: -0.011em; background: var(--lg-bg); color: var(--lg-fg);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    a { text-decoration: none; color: inherit; }

    .container { max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; }

    /* ─── BUTTONS ────────────────────────────── */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px;
      cursor: pointer; border: none; transition: all 150ms; font-family: inherit;
    }
    .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: 12px; }
    .btn-sm { padding: 7px 14px; font-size: 13px; border-radius: 10px; }
    .btn-full { width: 100%; justify-content: center; }
    .btn-primary { background: var(--lg-brand); color: var(--lg-brand-foreground); box-shadow: var(--lg-shadow-soft); }
    .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
    .btn-outline { border: 1px solid var(--lg-border); color: var(--lg-fg); background: transparent; }
    .btn-outline:hover { border-color: var(--lg-brand); background: var(--lg-brand-soft); }
    .btn-outline-light { border: 1px solid oklch(1 0 0 / 25%); color: white; background: oklch(1 0 0 / 10%); backdrop-filter: blur(4px); }
    .btn-outline-light:hover { background: oklch(1 0 0 / 20%); transform: translateY(-1px); }
    .btn-ghost { color: var(--lg-muted); background: transparent; }
    .btn-ghost:hover { color: var(--lg-fg); }
    .btn-cta { text-transform: uppercase; letter-spacing: 0.03em; }

    /* ─── NAV ────────────────────────────────── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      background: oklch(0.16 0.03 262 / 0.75); backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--lg-border);
    }
    .nav-inner {
      display: flex; align-items: center; gap: 2rem;
      max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; height: 68px;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
      background: var(--lg-gradient-brand); color: white; box-shadow: var(--lg-shadow-soft);
    }
    .brand-fiscal { font-weight: 700; font-size: 1.1rem; letter-spacing: -0.02em; color: var(--lg-brand-deep); }
    .brand-doc    { font-weight: 500; font-size: 1.1rem; letter-spacing: -0.02em; color: var(--lg-brand-deep); opacity: .7; }
    .nav-links { display: flex; gap: 1.75rem; flex: 1; }
    .nav-links a { font-size: 14px; font-weight: 500; color: var(--lg-muted); transition: color 150ms; }
    .nav-links a:hover { color: var(--lg-brand-deep); }

    /* ─── MOBILE MENU ────────────────────────── */
    .menu-toggle { display: none; flex-direction: column; justify-content: center; gap: 5px; width: 36px; height: 36px; background: none; border: 1px solid var(--lg-border); border-radius: 8px; cursor: pointer; padding: 0; }
    .menu-toggle span { display: block; width: 16px; height: 2px; margin: 0 auto; background: var(--lg-fg); border-radius: 2px; transition: transform 150ms, opacity 150ms; }
    .menu-toggle.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .menu-toggle.open span:nth-child(2) { opacity: 0; }
    .menu-toggle.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    .mobile-nav {
      display: none; flex-direction: column; gap: .25rem;
      background: var(--lg-bg); border-top: 1px solid var(--lg-border);
      padding: .75rem 1.5rem 1.25rem;
    }
    .mobile-nav a { font-size: 15px; color: var(--lg-muted); padding: .75rem 0; border-bottom: 1px solid var(--lg-border); }
    .mobile-nav a:last-of-type { border-bottom: none; }
    .mobile-nav .mobile-cta { margin-top: .5rem; background: var(--lg-brand); color: var(--lg-brand-foreground); font-weight: 700; text-align: center; border-radius: 10px; padding: .75rem; border-bottom: none; }

    /* ─── HERO ───────────────────────────────── */
    .hero {
      position: relative; overflow: hidden;
      padding: 6.5rem 0 5rem; text-align: left; background: var(--lg-surface);
    }
    .hero-bg {
      position: absolute; inset: 0; z-index: 0;
      background: url('/assets/landing/hero-banner.jpg') center / cover no-repeat;
    }
    .hero-bg-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(100deg, oklch(0.16 0.03 262 / 0.96) 12%, oklch(0.16 0.03 262 / 0.88) 45%, oklch(0.16 0.03 262 / 0.55) 100%);
    }
    .hero-bg-fade {
      position: absolute; inset-inline: 0; bottom: 0; height: 9rem;
      background: linear-gradient(to bottom, transparent, var(--lg-surface));
    }
    .hero-container { position: relative; z-index: 1; }
    .hero-copy { max-width: 42rem; }
    .badge-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: oklch(1 0 0 / 10%); border: 1px solid oklch(1 0 0 / 20%); backdrop-filter: blur(4px);
      color: oklch(1 0 0 / 88%); border-radius: 999px; padding: 7px 16px; font-size: 12.5px; font-weight: 500;
      margin-bottom: 1.75rem; letter-spacing: 0.01em;
    }
    .badge-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--lg-cta); flex-shrink: 0; }
    .hero-title {
      font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.12;
      color: var(--lg-brand-deep); margin-bottom: 1.25rem; letter-spacing: -0.02em;
    }
    .gradient-text {
      background: var(--lg-gradient-brand);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .hero-sub {
      font-size: clamp(1rem, 2vw, 1.125rem); color: oklch(1 0 0 / 78%); line-height: 1.7;
      max-width: 640px; margin: 0 0 2.25rem;
    }
    .hero-cta { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.75rem; }
    .hero-checks { display: flex; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 3.5rem; }
    .hero-checks span { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: oklch(1 0 0 / 72%); }
    .hero-checks svg { color: var(--lg-cta); flex-shrink: 0; }

    /* App mockup preview widget */
    .app-mockup {
      max-width: 980px; margin: 0 auto 3.5rem; border-radius: 18px; overflow: hidden;
      background: var(--lg-bg); border: 1px solid var(--lg-border); box-shadow: var(--lg-shadow-lift);
    }
    .mockup-chrome { display: flex; align-items: center; gap: 7px; padding: 12px 16px; background: var(--lg-surface); border-bottom: 1px solid var(--lg-border); }
    .mockup-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--lg-border); }
    .mockup-url { margin-left: 10px; font-size: 11.5px; color: var(--lg-muted); background: var(--lg-bg); border-radius: 6px; padding: 4px 12px; }
    .mockup-body { display: grid; }
    @media (min-width: 900px) { .mockup-body { grid-template-columns: 190px minmax(0, 1fr); } }
    .mockup-sidebar { display: none; padding: 1rem; border-right: 1px solid var(--lg-border); }
    @media (min-width: 900px) { .mockup-sidebar { display: block; } }
    .mockup-sidebar-label { padding: 0 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--lg-muted); }
    .mockup-sidebar-nav { display: flex; flex-direction: column; gap: 3px; margin: 10px 0 22px; }
    .mockup-nav-item { display: flex; align-items: center; gap: 9px; border-radius: 8px; padding: 8px 10px; font-size: 13px; color: var(--lg-muted); }
    .mockup-nav-item.active { background: var(--lg-brand-soft); color: var(--lg-brand-deep); font-weight: 600; }
    .mockup-nav-item.plain { padding-left: 10px; }
    .mockup-main { padding: 1.25rem 1.5rem; }
    .mockup-main-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .mockup-main-head h3 { font-size: 15px; font-weight: 600; color: var(--lg-fg); }
    .mockup-main-head p { font-size: 11.5px; color: var(--lg-muted); margin-top: 2px; }
    .mockup-new-btn { flex-shrink: 0; background: var(--lg-brand); color: white; font-size: 12px; font-weight: 600; border-radius: 10px; padding: 8px 14px; }
    .mockup-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 1.25rem; }
    .mockup-kpi { border: 1px solid var(--lg-border); border-radius: 12px; padding: 14px; }
    .kpi-label { font-size: 11px; color: var(--lg-muted); }
    .kpi-value { font-size: 17px; font-weight: 700; color: var(--lg-brand-deep); margin-top: 4px; letter-spacing: -0.01em; }
    .kpi-delta { font-size: 11px; font-weight: 600; color: var(--lg-cta); margin-top: 4px; }
    .kpi-delta.down { color: var(--lg-red); }
    .mockup-table-wrap { margin-top: 1.25rem; border: 1px solid var(--lg-border); border-radius: 12px; overflow: hidden; overflow-x: auto; }
    .mockup-table { width: 100%; border-collapse: collapse; font-size: 12px; white-space: nowrap; }
    .mockup-table thead { background: var(--lg-surface); color: var(--lg-muted); }
    .mockup-table th { text-align: left; font-weight: 500; padding: 9px 14px; }
    .mockup-table td { padding: 11px 14px; border-top: 1px solid var(--lg-border); color: var(--lg-fg); }
    .mockup-table .hide-sm { display: none; }
    @media (min-width: 640px) { .mockup-table .hide-sm { display: table-cell; } }
    .mockup-status { display: inline-flex; border-radius: 999px; padding: 3px 9px; font-size: 10.5px; font-weight: 600; }
    .mockup-status.ok { background: oklch(0.78 0.17 158 / 18%); color: var(--lg-cta); }
    .mockup-status.pending { background: var(--lg-border); color: var(--lg-muted); }

    .hero-stats {
      display: flex; align-items: center; justify-content: center; gap: 2rem;
      flex-wrap: wrap; border-top: 1px solid var(--lg-border); padding-top: 2.5rem;
    }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stat-num { font-size: 2rem; font-weight: 800; color: var(--lg-brand); letter-spacing: -0.03em; }
    .stat-label { font-size: 12px; color: var(--lg-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-div { width: 1px; height: 40px; background: var(--lg-border); }

    /* ─── SECTION COMMON (eyebrow + heading) ──── */
    .section-label {
      display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--lg-brand); margin-bottom: 0.75rem;
      background: var(--lg-brand-soft); border-radius: 999px; padding: 5px 14px;
    }
    .section-title { font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem; color: var(--lg-brand-deep); letter-spacing: -0.02em; }
    .section-sub { font-size: 1rem; color: var(--lg-muted); line-height: 1.7; max-width: 560px; }

    /* ─── FEATURES ───────────────────────────── */
    .features { padding: 5rem 0; background: var(--lg-bg); }
    @media (min-width: 640px) { .features { padding: 7rem 0; } }
    .features > .container > .section-sub { margin-bottom: 3.5rem; }
    .features-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
    }
    @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .features-grid { grid-template-columns: 1fr; } }
    .feature-card {
      background: var(--lg-surface); border: 1px solid var(--lg-border); border-radius: 16px;
      padding: 1.75rem; display: flex; flex-direction: column; gap: 0.875rem;
      transition: border-color 200ms, transform 200ms, box-shadow 200ms;
    }
    .feature-card:hover { border-color: transparent; transform: translateY(-3px); box-shadow: var(--lg-shadow-lift); }
    .feature-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      background: var(--lg-brand-soft); color: var(--lg-brand-deep);
      transition: background 200ms, color 200ms;
    }
    .feature-card:hover .feature-icon { background: var(--lg-brand); color: var(--lg-brand-foreground); }
    .feature-card h3 { font-size: 1rem; font-weight: 700; color: var(--lg-fg); }
    .feature-card p  { font-size: 14px; color: var(--lg-muted); line-height: 1.65; }

    /* ─── HOW IT WORKS ───────────────────────── */
    .how { padding: 5rem 0; background: var(--lg-surface); }
    @media (min-width: 640px) { .how { padding: 7rem 0; } }
    .how .section-title { margin-bottom: 3.5rem; }
    .steps { display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .step { flex: 1; min-width: 220px; background: var(--lg-bg); border: 1px solid var(--lg-border); border-radius: 16px; padding: 2rem; box-shadow: var(--lg-shadow-soft); }
    .step-num { font-size: 3rem; font-weight: 900; color: var(--lg-brand-soft); line-height: 1; margin-bottom: 1rem; letter-spacing: -0.04em; }
    .step-content h3 { font-size: 1rem; font-weight: 700; color: var(--lg-fg); margin-bottom: 0.5rem; }
    .step-content p  { font-size: 14px; color: var(--lg-muted); line-height: 1.65; }
    .step-arrow { font-size: 1.5rem; color: var(--lg-border); align-self: center; flex-shrink: 0; }

    /* ─── PLANS ──────────────────────────────── */
    .plans { padding: 5rem 0; background: var(--lg-bg); }
    @media (min-width: 640px) { .plans { padding: 7rem 0; } }
    .plans .section-sub { margin-bottom: 3.5rem; max-width: 640px; }
    .plan-card {
      background: var(--lg-surface); border: 1px solid var(--lg-border); border-radius: 18px;
      padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; position: relative;
      box-shadow: var(--lg-shadow-soft);
    }
    .plan-single {
      max-width: 480px; border-color: var(--lg-brand);
      box-shadow: var(--lg-shadow-lift), 0 0 0 1px oklch(0.62 0.17 254 / 25%);
      background: linear-gradient(145deg, var(--lg-brand-soft), var(--lg-surface));
    }
    .plan-badge {
      align-self: flex-start;
      background: var(--lg-brand-soft); color: var(--lg-brand); font-size: 11px; font-weight: 800;
      padding: 5px 14px; border-radius: 999px; white-space: nowrap; letter-spacing: 0.04em;
      border: 1px solid oklch(0.62 0.17 254 / 0.3);
    }
    .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--lg-border); padding-top: 1.5rem; }
    .plan-features li { font-size: 14px; color: var(--lg-fg); display: flex; align-items: center; gap: 8px; }
    .check { color: var(--lg-cta); font-weight: 700; }
    .plans-note { text-align: left; max-width: 480px; font-size: 13px; color: var(--lg-muted); margin-top: 1.5rem; }

    /* ─── FAQ ────────────────────────────────── */
    .faq { padding: 5rem 0; background: var(--lg-surface); }
    @media (min-width: 640px) { .faq { padding: 7rem 0; } }
    .faq .section-sub { margin-bottom: 3rem; }
    .faq-list { display: flex; flex-direction: column; gap: 0.75rem; max-width: 780px; }
    .faq-item { background: var(--lg-bg); border: 1px solid var(--lg-border); border-radius: 16px; overflow: hidden; transition: border-color 200ms; }
    .faq-item.open { border-color: var(--lg-brand); }
    .faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: none; border: none; text-align: left; cursor: pointer; padding: 1.25rem 1.5rem; font-size: 15px; font-weight: 700; color: var(--lg-fg); font-family: inherit; }
    .faq-question:hover { color: var(--lg-brand); }
    .faq-chevron { flex-shrink: 0; color: var(--lg-muted); transition: transform 200ms; }
    .faq-item.open .faq-chevron { transform: rotate(180deg); color: var(--lg-brand); }
    .faq-answer { padding: 0 1.5rem 1.5rem; }
    .faq-answer p { font-size: 14px; color: var(--lg-muted); line-height: 1.75; white-space: pre-line; }

    /* ─── CTA ────────────────────────────────── */
    .cta-section { padding: 5rem 0; background: var(--lg-bg); }
    @media (min-width: 640px) { .cta-section { padding: 7rem 0; } }
    .cta-card {
      position: relative; overflow: hidden;
      background: var(--lg-gradient-brand); border: none;
      border-radius: 24px; padding: 5rem 2rem; text-align: center;
      box-shadow: var(--lg-shadow-lift);
    }
    .cta-glow {
      position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
      width: 600px; height: 400px; border-radius: 50%;
      background: radial-gradient(ellipse, oklch(1 0 0 / 0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .cta-card h2 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem; color: white; }
    .cta-card p  { font-size: 1.05rem; color: oklch(1 0 0 / 0.8); margin-bottom: 2rem; }
    .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .cta-btns .btn-primary { background: white; color: var(--lg-brand-deep); }
    .cta-btns .btn-ghost { color: oklch(1 0 0 / 0.85); }
    .cta-btns .btn-ghost:hover { color: white; }

    /* ─── FOOTER ─────────────────────────────── */
    .footer { padding: 4.5rem 0 0; background: var(--lg-footer); color: var(--lg-footer-fg); }
    .footer-grid { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 2.5rem; }
    @media (max-width: 900px) { .footer-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .footer-grid { grid-template-columns: 1fr; } }
    .footer-col-brand { min-width: 0; }
    .footer-brand { display: flex; align-items: center; gap: 8px; }
    .footer-brand .brand-icon { width: 28px; height: 28px; background: oklch(1 0 0 / 0.12); box-shadow: none; }
    .footer-brand .brand-fiscal { color: var(--lg-footer-fg); }
    .footer-brand .brand-doc { color: var(--lg-footer-fg); opacity: .65; }
    .footer-tagline { margin-top: 1rem; max-width: 22rem; font-size: 13px; line-height: 1.6; color: oklch(0.97 0.008 250 / 0.62); }
    .footer-social { display: flex; align-items: center; gap: .625rem; margin-top: 1.5rem; }
    .social-link { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; color: oklch(0.97 0.008 250 / 0.8); border: 1px solid oklch(0.97 0.008 250 / 0.15); }
    .social-link:hover { color: white; border-color: oklch(0.97 0.008 250 / 0.4); }
    .footer-col h3 { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: oklch(0.97 0.008 250 / 0.55); }
    .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-top: 1rem; }
    .footer-col ul a { font-size: 13.5px; color: oklch(0.97 0.008 250 / 0.8); transition: color 150ms; }
    .footer-col ul a:hover { color: white; }
    .footer-bottom {
      display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
      margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid oklch(0.97 0.008 250 / 0.12);
    }
    .footer-copy { font-size: 12.5px; color: oklch(0.97 0.008 250 / 0.55); }
    .footer .btn-outline { border-color: oklch(0.97 0.008 250 / 0.25); color: var(--lg-footer-fg); }
    .footer .btn-outline:hover { border-color: oklch(0.97 0.008 250 / 0.5); background: oklch(1 0 0 / 0.08); }

    /* ─── TRIAL ─────────────────────────────── */
    .trial-section { padding: 5rem 0; background: var(--lg-surface); }
    @media (min-width: 640px) { .trial-section { padding: 7rem 0; } }
    .trial-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
    .comparison-col .section-sub { margin-bottom: 2rem; }
    .comparison-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 1.5rem; }
    .comparison-table th { text-align: left; padding: 10px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--lg-muted); border-bottom: 1px solid var(--lg-border); }
    .comparison-table td { padding: 12px; border-bottom: 1px solid var(--lg-border); color: var(--lg-muted); vertical-align: middle; }
    .comparison-table td:first-child { color: var(--lg-fg); }
    .comparison-table td.yes { color: var(--lg-cta); font-weight: 600; }
    .comparison-table td.no  { color: var(--lg-muted); opacity: .6; }
    .badge-free { display: inline-block; background: oklch(0.78 0.17 158 / 0.18); color: var(--lg-cta); font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 4px; vertical-align: middle; }

    .register-col { position: sticky; top: 88px; }
    .register-card { background: var(--lg-bg); border: 1px solid var(--lg-border); border-radius: 20px; overflow: hidden; box-shadow: var(--lg-shadow-lift); }
    .register-header { background: var(--lg-brand-soft); padding: 2rem 2rem 1.5rem; border-bottom: 1px solid var(--lg-border); }
    .register-header h3 { font-size: 1.25rem; font-weight: 800; color: var(--lg-brand-deep); margin-bottom: 4px; }
    .register-header p  { font-size: 13px; color: var(--lg-muted); }
    .register-form { display: flex; flex-direction: column; gap: 14px; padding: 2rem; }
    .register-form .form-group { display: flex; flex-direction: column; gap: 6px; }
    .register-form label { font-size: 13px; font-weight: 600; color: var(--lg-fg); }
    .register-form input { background: var(--lg-bg); border: 1px solid var(--lg-input); border-radius: 10px; padding: 11px 14px; color: var(--lg-fg); font-size: 14px; outline: none; transition: border-color 150ms, box-shadow 150ms; font-family: inherit; }
    .register-form input:focus { border-color: var(--lg-brand); box-shadow: 0 0 0 4px oklch(0.62 0.17 254 / 0.22); }
    .register-form input.error { border-color: var(--lg-red); }
    .field-error { font-size: 12px; color: var(--lg-red); }
    .alert-form-error { background: oklch(0.62 0.2 25 / 0.1); border: 1px solid oklch(0.62 0.2 25 / 0.3); color: var(--lg-red); border-radius: 10px; padding: 10px 14px; font-size: 13px; }
    .register-terms { font-size: 12px; color: var(--lg-muted); text-align: center; }
    .register-terms .link { color: var(--lg-muted); text-decoration: underline; }
    .register-success { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 3rem 2rem; text-align: center; }
    .success-icon { color: var(--lg-cta); }
    .register-success h4 { font-size: 1.1rem; font-weight: 700; color: var(--lg-fg); }
    .register-success p { font-size: 14px; color: var(--lg-muted); }
    .required { color: var(--lg-red); }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }

    /* ─── WPP FLOAT ──────────────────────────── */
    .wpp-float {
      position: fixed; bottom: 24px; right: 24px; z-index: 999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #25D366; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(37,211,102,0.4);
      transition: transform 150ms, box-shadow 150ms;
    }
    .wpp-float:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(37,211,102,0.5); }

    /* ─── RESPONSIVE ─────────────────────────── */
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .desktop-only { display: none; }
      .menu-toggle { display: flex; }
      .mobile-nav { display: flex; }
      .steps { flex-direction: column; }
      .step-arrow { display: none; }
      .hero-stats .stat-div { display: none; }
      .cta-card { padding: 3rem 1.25rem; }
      .trial-grid { grid-template-columns: 1fr; }
      .register-col { position: static; }
      .hero-cta a { width: 100%; justify-content: center; }
      .mockup-kpis { grid-template-columns: 1fr; }
      .footer-bottom { justify-content: flex-start; }
    }
  `]
})
export class LandingComponent implements OnInit {
  readonly wpp = `https://wa.me/${WPP_NUMBER}?text=${WPP_MSG}`;
  readonly mobileMenuOpen = signal(false);

  private readonly _configSvc = inject(ConfiguracaoService);
  readonly social = signal<SocialConfigDto | null>(null);
  readonly hasSocialLinks = () => {
    const s = this.social();
    return !!(s && (s.instagram || s.facebook || s.linkedin || s.tiktok));
  };

  ngOnInit(): void {
    this._configSvc.getSocialPublic().subscribe({
      next: s => this.social.set(s),
      error: () => {},
    });
  }

  readonly faqs = [
    {
      q: 'O que é o FiscalDoc e como ele funciona na gestão de documentos fiscais?',
      a: 'O FiscalDoc é um hub fiscal inteligente desenvolvido especificamente para escritórios de contabilidade e departamentos fiscais. Ele funciona como uma plataforma centralizada na nuvem que automatiza a recepção, organização e monitoramento de XMLs (NF-e, CT-e, NFS-e e MDF-e).\nO sistema elimina o trabalho manual de importação de notas fiscais. Seus clientes enviam os arquivos (ou utilizam nossa API/e-mail exclusivo) e o FiscalDoc automaticamente valida, indexa e organiza esses documentos, permitindo que sua equipe visualize todos os clientes em uma única tela, sem depender de planilhas ou e-mails descentralizados.',
    },
    {
      q: 'De que maneira o FiscalDoc protege o escritório e o cliente contra prejuízos financeiros e multas?',
      a: 'O FiscalDoc age como uma blindagem fiscal ativa contra erros humanos e fraudes. A conferência manual de notas fiscais é um processo lento e falho, que frequentemente resulta em pagamentos indevidos ou créditos tributários perdidos.\nNossa plataforma protege seu escritório e seus clientes de duas formas críticas:\n1. Detecção de Divergências de Valor: o sistema cruza automaticamente os dados do XML contra pedidos de compra ou valores de contrato, emitindo alertas imediatos se houver cobranças indevidas ou erros de emissão pelo fornecedor antes da contabilização.\n2. Bloqueio de Notas Duplicadas: o robô do FiscalDoc identifica XMLs duplicados (mesma chave de acesso ou número de nota) em tempo real, evitando que o financeiro pague a mesma despesa duas vezes — um erro operacional comum que gera alto ROI negativo.\nAo garantir que apenas notas fiscais validadas e íntegras sejam processadas, você elimina o risco de multas por inconsistências no SPED e blinda o caixa do seu cliente contra prejuízos diretos.',
    },
    {
      q: 'Quais tipos de XML o FiscalDoc suporta e qual o volume de documentos suportado?',
      a: 'O FiscalDoc é uma solução multi-tenant robusta que suporta todos os principais tipos de documentos fiscais eletrônicos do Brasil: NF-e (Nota Fiscal de Produto/Mercadoria), NFS-e (Nota Fiscal de Serviço), CT-e (Conhecimento de Transporte Eletrônico) e MDF-e (Manifesto Eletrônico de Documentos Fiscais).\nQuanto ao volume, nossa infraestrutura em nuvem é elástica e projetada para alta escala, atendendo desde pequenas empresas até grandes indústrias ou escritórios contábeis com centenas de clientes e milhares de notas processadas diariamente, mantendo a performance de busca instantânea (menos de 2 segundos por nota).',
    },
    {
      q: 'O sistema possui integração com ERPs e compartilhamento com o contador?',
      a: 'Sim, a integração e o compartilhamento são pilares fundamentais do FiscalDoc. Oferecemos opções flexíveis de integração via API com os principais ERPs do mercado, facilitando o fluxo de entrada de dados.\nPara os escritórios contábeis, o sistema foi desenhado para o modelo de portal do contador. Você pode configurar acessos para que seus clientes enviem os documentos diretamente para a plataforma, enquanto seu escritório tem visibilidade total em tempo real, podendo realizar downloads individuais ou em lote (XML e DANFE) e gerar relatórios gerenciais sem precisar solicitar arquivos aos clientes.',
    },
    {
      q: 'Como posso testar o FiscalDoc e quanto custa a implantação?',
      a: 'Você pode começar a organizar sua contabilidade agora mesmo com nosso período de teste gratuito de 30 dias, sem necessidade de cartão de crédito. Basta acessar nosso site e clicar em "Teste grátis".\nSobre a implantação, o FiscalDoc possui uma taxa de setup zero e a plataforma é extremamente intuitiva, permitindo um "go-live" rápido. Nossos planos são flexíveis (Starter, Professional e Enterprise) e cobrados de acordo com o volume de notas por cliente, sem contratos de fidelidade longos. O retorno sobre o investimento (ROI) é imediato devido à drástica redução do tempo operacional e à prevenção de prejuízos com notas duplicadas.',
    },
  ];

  readonly openFaq = signal<number | null>(0);

  toggleFaq(i: number): void {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  private readonly _http = inject(HttpClient);
  private readonly _fb   = inject(FormBuilder);

  registerForm = this._fb.group({
    nome:      ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    nomeFirma: [''],
    senha:     ['', [Validators.required, Validators.minLength(8)]],
  });

  registering     = signal(false);
  registerSuccess = signal(false);
  registerError   = signal('');

  rf(field: string) { return this.registerForm.get(field); }

  onRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.registering.set(true);
    this.registerError.set('');
    const v = this.registerForm.getRawValue();
    this._http.post(`${environment.apiUrl}/auth/register`, v).subscribe({
      next: () => { this.registering.set(false); this.registerSuccess.set(true); },
      error: (err) => {
        this.registering.set(false);
        this.registerError.set(extractErrorMessage(err, 'Erro ao criar conta. Tente novamente.'));
      },
    });
  }
}
