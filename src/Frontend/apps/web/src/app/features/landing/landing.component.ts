import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="6" y="4" width="20" height="24" rx="3" fill="#1a1e28" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <path d="M10 9h12M10 13h12M10 17h8" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round"/>
            <rect x="4" y="2" width="12" height="12" rx="3" fill="#0d0f14" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path d="M10 5v6M7 8h6" stroke="#00e5a0" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="brand-fiscal">Fiscal</span><span class="brand-doc">Doc</span>
        </a>
        <nav class="nav-links">
          <a href="#features">Recursos</a>
          <a href="#how">Como funciona</a>
          <a href="#plans">Planos</a>
          <a href="#contact">Contato</a>
        </nav>
        <a href="https://app.fiscaldoc.com.br/auth/login" class="btn btn-outline">Acessar sistema</a>
      </div>
    </header>

    <!-- ─── HERO ────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="container">
        <div class="badge-pill">Sistema para Escritórios Contábeis</div>
        <h1 class="hero-title">
          Gerencie todos os seus<br>
          <span class="gradient-text">clientes fiscais</span><br>
          em um só lugar
        </h1>
        <p class="hero-sub">
          Receba, organize e monitore NF-e, CT-e, MDF-e e NFS-e de todos os seus clientes automaticamente.<br>
          Alertas inteligentes, histórico completo e controle total — sem planilha, sem bagunça.
        </p>
        <div class="hero-cta">
          <a [href]="wpp" target="_blank" class="btn btn-primary btn-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar no WhatsApp
          </a>
          <a href="https://app.fiscaldoc.com.br/auth/login" class="btn btn-ghost btn-lg">
            Acessar sistema →
          </a>
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
        <h2 class="section-title">Preço justo para cada tamanho</h2>
        <p class="section-sub">Sem taxa de setup, sem fidelidade. Comece pequeno e escale quando precisar.</p>

        <div class="plans-grid">
          <div class="plan-card">
            <div class="plan-name">Starter</div>
            <div class="plan-price">R$ 99<span>/mês por cliente</span></div>
            <ul class="plan-features">
              <li><span class="check">✓</span> Até 100 XMLs/mês por cliente</li>
              <li><span class="check">✓</span> NF-e, CT-e, MDF-e, NFS-e</li>
              <li><span class="check">✓</span> Alertas automáticos</li>
              <li><span class="check">✓</span> Download individual</li>
              <li><span class="check">✓</span> Suporte via e-mail</li>
            </ul>
            <a [href]="wpp" target="_blank" class="btn btn-outline btn-full">Contratar</a>
          </div>

          <div class="plan-card plan-featured">
            <div class="plan-badge">Mais popular</div>
            <div class="plan-name">Professional</div>
            <div class="plan-price">R$ 149<span>/mês por cliente</span></div>
            <ul class="plan-features">
              <li><span class="check">✓</span> Até 200 XMLs/mês por cliente</li>
              <li><span class="check">✓</span> Tudo do Starter</li>
              <li><span class="check">✓</span> Download em lote por mês</li>
              <li><span class="check">✓</span> Logs de auditoria</li>
              <li><span class="check">✓</span> Suporte prioritário WhatsApp</li>
            </ul>
            <a [href]="wpp" target="_blank" class="btn btn-primary btn-full">Contratar</a>
          </div>

          <div class="plan-card">
            <div class="plan-name">Enterprise</div>
            <div class="plan-price">R$ 249<span>/mês por cliente</span></div>
            <ul class="plan-features">
              <li><span class="check">✓</span> Até 500 XMLs/mês por cliente</li>
              <li><span class="check">✓</span> Tudo do Professional</li>
              <li><span class="check">✓</span> API dedicada</li>
              <li><span class="check">✓</span> Relatórios personalizados</li>
              <li><span class="check">✓</span> Gerente de conta exclusivo</li>
            </ul>
            <a [href]="wpp" target="_blank" class="btn btn-outline btn-full">Contratar</a>
          </div>
        </div>
        <p class="plans-note">XMLs excedentes cobrados à parte. Sem limite de clientes por plano.</p>
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
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" stroke-width="2" aria-hidden="true">
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
        <div class="footer-inner">
          <div class="footer-brand">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="6" y="4" width="20" height="24" rx="3" fill="#1a1e28" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
              <path d="M10 9h12M10 13h12M10 17h8" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="4" y="2" width="12" height="12" rx="3" fill="#0d0f14" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
              <path d="M10 5v6M7 8h6" stroke="#00e5a0" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="brand-fiscal">Fiscal</span><span class="brand-doc">Doc</span>
          </div>
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
    :host { display: block; font-family: 'DM Sans', system-ui, sans-serif; background: #0d0f14; color: #e8eaf0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    a { text-decoration: none; color: inherit; }

    .container { max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; }

    /* ─── BUTTONS ────────────────────────────── */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
      cursor: pointer; border: none; transition: all 150ms;
    }
    .btn-lg { padding: 14px 28px; font-size: 15px; border-radius: 10px; }
    .btn-sm { padding: 7px 14px; font-size: 13px; }
    .btn-full { width: 100%; justify-content: center; }
    .btn-primary { background: #00e5a0; color: #0d0f14; }
    .btn-primary:hover { background: #00c98d; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,229,160,0.3); }
    .btn-outline { border: 1px solid rgba(255,255,255,0.15); color: #e8eaf0; background: transparent; }
    .btn-outline:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
    .btn-ghost { color: #7c8299; background: transparent; }
    .btn-ghost:hover { color: #e8eaf0; }

    /* ─── NAV ────────────────────────────────── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(13,15,20,0.85); backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .nav-inner {
      display: flex; align-items: center; gap: 2rem;
      max-width: 1120px; margin: 0 auto; padding: 0 1.5rem; height: 64px;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-fiscal { font-weight: 800; font-size: 1.1rem; letter-spacing: 0.01em; color: #e8eaf0; }
    .brand-doc    { font-weight: 800; font-size: 1.1rem; letter-spacing: 0.01em; color: #00e5a0; }
    .nav-links { display: flex; gap: 1.75rem; flex: 1; }
    .nav-links a { font-size: 14px; color: #7c8299; transition: color 150ms; }
    .nav-links a:hover { color: #e8eaf0; }

    /* ─── HERO ───────────────────────────────── */
    .hero {
      position: relative; overflow: hidden;
      padding: 100px 0 80px; text-align: center;
    }
    .hero-glow {
      position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
      width: 800px; height: 600px; border-radius: 50%;
      background: radial-gradient(ellipse, rgba(0,229,160,0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .badge-pill {
      display: inline-flex; align-items: center;
      background: rgba(0,229,160,0.1); border: 1px solid rgba(0,229,160,0.25);
      color: #00e5a0; border-radius: 999px; padding: 6px 16px; font-size: 13px; font-weight: 600;
      margin-bottom: 1.5rem; letter-spacing: 0.02em;
    }
    .hero-title {
      font-size: clamp(2.2rem, 5vw, 3.8rem); font-weight: 800; line-height: 1.15;
      color: #e8eaf0; margin-bottom: 1.25rem; letter-spacing: -0.02em;
    }
    .gradient-text {
      background: linear-gradient(135deg, #00e5a0 0%, #0066ff 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .hero-sub {
      font-size: clamp(1rem, 2vw, 1.15rem); color: #7c8299; line-height: 1.7;
      max-width: 640px; margin: 0 auto 2.5rem;
    }
    .hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3.5rem; }
    .hero-stats {
      display: flex; align-items: center; justify-content: center; gap: 2rem;
      flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 2.5rem;
    }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stat-num { font-size: 2rem; font-weight: 800; color: #00e5a0; letter-spacing: -0.03em; }
    .stat-label { font-size: 12px; color: #7c8299; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-div { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }

    /* ─── SECTION COMMON ─────────────────────── */
    .section-label {
      display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #00e5a0; margin-bottom: 0.75rem;
    }
    .section-title { font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem; }
    .section-sub { font-size: 1rem; color: #7c8299; line-height: 1.7; max-width: 560px; }

    /* ─── FEATURES ───────────────────────────── */
    .features { padding: 100px 0; background: #13161e; }
    .features > .container > .section-sub { margin-bottom: 3.5rem; }
    .features-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem;
    }
    .feature-card {
      background: #0d0f14; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
      padding: 1.75rem; display: flex; flex-direction: column; gap: 0.875rem;
      transition: border-color 200ms, transform 200ms;
    }
    .feature-card:hover { border-color: rgba(0,229,160,0.2); transform: translateY(-2px); }
    .feature-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .feature-icon.accent { background: rgba(0,229,160,0.12); color: #00e5a0; }
    .feature-icon.blue   { background: rgba(0,102,255,0.12);  color: #4d94ff; }
    .feature-icon.yellow { background: rgba(255,209,102,0.12); color: #ffd166; }
    .feature-icon.red    { background: rgba(255,77,109,0.12);  color: #ff4d6d; }
    .feature-card h3 { font-size: 1rem; font-weight: 700; color: #e8eaf0; }
    .feature-card p  { font-size: 14px; color: #7c8299; line-height: 1.65; }

    /* ─── HOW IT WORKS ───────────────────────── */
    .how { padding: 100px 0; }
    .how .section-title { margin-bottom: 3.5rem; }
    .steps { display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .step { flex: 1; min-width: 220px; background: #13161e; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 2rem; }
    .step-num { font-size: 3rem; font-weight: 900; color: rgba(0,229,160,0.2); line-height: 1; margin-bottom: 1rem; letter-spacing: -0.04em; }
    .step-content h3 { font-size: 1rem; font-weight: 700; color: #e8eaf0; margin-bottom: 0.5rem; }
    .step-content p  { font-size: 14px; color: #7c8299; line-height: 1.65; }
    .step-arrow { font-size: 1.5rem; color: rgba(255,255,255,0.2); align-self: center; flex-shrink: 0; }

    /* ─── PLANS ──────────────────────────────── */
    .plans { padding: 100px 0; background: #13161e; }
    .plans .section-sub { margin-bottom: 3.5rem; }
    .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
    .plan-card {
      background: #0d0f14; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
      padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem; position: relative;
    }
    .plan-featured {
      border-color: rgba(0,229,160,0.35); background: linear-gradient(145deg, rgba(0,229,160,0.04), #0d0f14);
    }
    .plan-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: #00e5a0; color: #0d0f14; font-size: 11px; font-weight: 800;
      padding: 4px 14px; border-radius: 999px; white-space: nowrap; letter-spacing: 0.04em;
    }
    .plan-name { font-size: 1.1rem; font-weight: 800; color: #e8eaf0; }
    .plan-price { font-size: 2rem; font-weight: 900; color: #00e5a0; letter-spacing: -0.03em; }
    .plan-price span { font-size: 13px; font-weight: 500; color: #7c8299; }
    .plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .plan-features li { font-size: 14px; color: #7c8299; display: flex; align-items: center; gap: 8px; }
    .check { color: #00e5a0; font-weight: 700; }
    .plans-note { text-align: center; font-size: 13px; color: #4a5068; margin-top: 2rem; }

    /* ─── CTA ────────────────────────────────── */
    .cta-section { padding: 100px 0; }
    .cta-card {
      position: relative; overflow: hidden;
      background: #13161e; border: 1px solid rgba(0,229,160,0.2);
      border-radius: 24px; padding: 5rem 2rem; text-align: center;
    }
    .cta-glow {
      position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
      width: 600px; height: 400px; border-radius: 50%;
      background: radial-gradient(ellipse, rgba(0,229,160,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .cta-card h2 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem; }
    .cta-card p  { font-size: 1.05rem; color: #7c8299; margin-bottom: 2rem; }
    .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

    /* ─── FOOTER ─────────────────────────────── */
    .footer { border-top: 1px solid rgba(255,255,255,0.07); padding: 1.75rem 0; background: #0d0f14; }
    .footer-inner { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .footer-brand { display: flex; align-items: center; gap: 8px; }
    .footer-copy { flex: 1; font-size: 13px; color: #4a5068; }

    /* ─── TRIAL ─────────────────────────────── */
    .trial-section { padding: 100px 0; }
    .trial-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
    .comparison-col .section-sub { margin-bottom: 2rem; }
    .comparison-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 1.5rem; }
    .comparison-table th { text-align: left; padding: 10px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #7c8299; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .comparison-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #7c8299; vertical-align: middle; }
    .comparison-table td:first-child { color: #b0b5c5; }
    .comparison-table td.yes { color: #00e5a0; font-weight: 600; }
    .comparison-table td.no  { color: #4a5068; }
    .badge-free { display: inline-block; background: rgba(0,229,160,0.15); color: #00e5a0; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 4px; vertical-align: middle; }

    .register-col { position: sticky; top: 88px; }
    .register-card { background: #13161e; border: 1px solid rgba(0,229,160,0.2); border-radius: 20px; overflow: hidden; }
    .register-header { background: linear-gradient(135deg, rgba(0,229,160,0.1), rgba(0,102,255,0.05)); padding: 2rem 2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .register-header h3 { font-size: 1.25rem; font-weight: 800; color: #e8eaf0; margin-bottom: 4px; }
    .register-header p  { font-size: 13px; color: #7c8299; }
    .register-form { display: flex; flex-direction: column; gap: 14px; padding: 2rem; }
    .register-form .form-group { display: flex; flex-direction: column; gap: 6px; }
    .register-form label { font-size: 13px; font-weight: 600; color: #b0b5c5; }
    .register-form input { background: #0d0f14; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 11px 14px; color: #e8eaf0; font-size: 14px; outline: none; transition: border-color 150ms; }
    .register-form input:focus { border-color: rgba(0,229,160,0.4); }
    .register-form input.error { border-color: rgba(255,77,109,0.5); }
    .field-error { font-size: 12px; color: #ff4d6d; }
    .alert-form-error { background: rgba(255,77,109,0.1); border: 1px solid rgba(255,77,109,0.2); color: #ff4d6d; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
    .register-terms { font-size: 12px; color: #4a5068; text-align: center; }
    .register-terms .link { color: #7c8299; text-decoration: underline; }
    .register-success { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 3rem 2rem; text-align: center; }
    .register-success h4 { font-size: 1.1rem; font-weight: 700; color: #e8eaf0; }
    .register-success p { font-size: 14px; color: #7c8299; }
    .required { color: #ff4d6d; }

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
      .steps { flex-direction: column; }
      .step-arrow { display: none; }
      .hero-stats .stat-div { display: none; }
      .cta-card { padding: 3rem 1.25rem; }
      .trial-grid { grid-template-columns: 1fr; }
      .register-col { position: static; }
    }
  `]
})
export class LandingComponent {
  readonly wpp = `https://wa.me/${WPP_NUMBER}?text=${WPP_MSG}`;

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
        this.registerError.set(err?.error?.detail ?? err?.error?.title ?? 'Erro ao criar conta. Tente novamente.');
      },
    });
  }
}
