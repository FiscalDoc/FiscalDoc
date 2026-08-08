import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, ContadorService } from '@veloxml/services';
import { ToastContainerComponent } from '../toast-container/toast-container.component';
import { AssistenteChatComponent } from '../assistente-chat/assistente-chat.component';
import { NovidadesModalComponent } from '../novidades-modal/novidades-modal.component';
import { OnboardingTourComponent } from '../onboarding-tour/onboarding-tour.component';
import { environment } from '../../../environments/environment';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles?: string[];
  children?: NavItem[];
  // Âncora pro tour guiado (app-onboarding-tour) apontar a seta pra esse item no menu — só
  // setado nos itens que o tour realmente usa (ver visibleNavItems, bloco Cliente).
  tourId?: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent, AssistenteChatComponent, NovidadesModalComponent, OnboardingTourComponent],
  template: `
    <div class="shell">
      <button type="button" class="mobile-menu-btn" (click)="mobileMenuOpen.set(true)" aria-label="Abrir menu">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      @if (mobileMenuOpen()) {
        <div class="sidebar-backdrop" (click)="mobileMenuOpen.set(false)"></div>
      }

      <aside class="sidebar" [class.open]="mobileMenuOpen()">
        <div class="sidebar-header">
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
          </div>
          <span class="brand-name font-heading">FiscalDoc</span>
          <button type="button" class="sidebar-close-btn" (click)="mobileMenuOpen.set(false)" aria-label="Fechar menu">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of visibleNavItems; track item.label) {
            @if (item.children) {
              <div class="nav-group">
                <button type="button" class="nav-item nav-group-toggle" [attr.data-tour]="item.tourId" [class.active]="isGroupActive(item)" (click)="toggleGroup(item.label)">
                  <span class="nav-icon" [innerHTML]="item.icon"></span>
                  <span class="nav-label">{{ item.label }}</span>
                  <svg class="nav-chevron" [class.open]="isGroupExpanded(item)" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
                @if (isGroupExpanded(item)) {
                  <div class="nav-subitems">
                    @for (child of item.children; track child.route) {
                      <a [routerLink]="child.route" [attr.data-tour]="child.tourId" routerLinkActive="active" class="nav-item nav-subitem" (click)="mobileMenuOpen.set(false)">
                        <span class="nav-icon" [innerHTML]="child.icon"></span>
                        <span class="nav-label">{{ child.label }}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            } @else {
              <a [routerLink]="item.route" [attr.data-tour]="item.tourId" routerLinkActive="active" class="nav-item" (click)="mobileMenuOpen.set(false)">
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          }
        </nav>

        <div class="sidebar-footer">
          @if (auth.currentUser()?.empresa) {
            <div class="empresa-badge" [title]="auth.currentUser()?.empresa">
              <span class="empresa-nome">{{ auth.currentUser()?.empresa }}</span>
              @if (auth.currentUser()?.cnpj) {
                <span class="empresa-cnpj">{{ formatCnpj(auth.currentUser()!.cnpj!) }}</span>
              }
            </div>
          }
          <div class="footer-links-row">
            <a routerLink="/perfil" routerLinkActive="nav-item-active" class="security-link">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Segurança / 2FA
            </a>
            <div class="footer-icons">
              @if (auth.currentUser()?.perfil === 'Cliente') {
                <button type="button" class="novidades-icon-link" title="Tour guiado" (click)="tourGuiado.abrir()">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                  </svg>
                </button>
              }
              <button type="button" class="novidades-icon-link" title="Novidades" (click)="novidadesModal.abrir()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 11l18-6v14L3 15v-4z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.6 17.4a2 2 0 11-3.4 2L6 15.5"/>
                </svg>
              </button>
              <a routerLink="/alertas" routerLinkActive="active" class="alertas-icon-link" title="Alertas">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              </a>
            </div>
          </div>
          <div class="user-row">
          <div class="user-info">
            @if (auth.currentUser()?.avatarUrl) {
              <img class="user-avatar" [src]="userAvatarSrc()" alt="avatar"/>
            } @else {
              <div class="user-avatar" [style.background]="avatarBg()" [style.color]="avatarFg()">{{ userInitials() }}</div>
            }
            <div class="user-details">
              <span class="user-name">{{ auth.currentUser()?.nome }}</span>
              <span class="user-role">{{ auth.currentUser()?.perfil }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="auth.logout()" title="Sair">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          </div>
          <div class="version-row">{{ appVersion }}</div>
        </div>
      </aside>

      <main class="content">
        @if (auth.isImpersonating()) {
          <div class="impersonation-banner">
            <span>
              Você está atuando como <strong>{{ auth.currentUser()?.empresa || auth.currentUser()?.perfil }}</strong>
              ({{ auth.currentUser()?.perfil }})
            </span>
            <button type="button" class="impersonation-exit" (click)="voltarParaAdmin()">Voltar para Admin</button>
          </div>
        }
        @if (auth.isOnTrial()) {
          <div class="trial-banner" [class.trial-critico]="auth.trialCritico()" [class.trial-expirado]="auth.trialExpirado()">
            <div class="trial-banner-left">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              @if (auth.trialExpirado()) {
                <span><strong>Seu período de teste expirou.</strong> Faça upgrade para continuar usando o FiscalDoc.</span>
              } @else {
                <span>
                  <strong>Teste gratuito:</strong>
                  @if (auth.diasRestantesTrial() === 1) {
                    restam <strong>1 dia</strong>.
                  } @else {
                    restam <strong>{{ auth.diasRestantesTrial() }} dias</strong>.
                  }
                  Aproveite todos os recursos sem limitações.
                </span>
              }
            </div>
            <div class="trial-banner-right">
              <div class="trial-benefits">
                <span>✓ Clientes ilimitados</span>
                <span>✓ XMLs ilimitados</span>
                <span>✓ Suporte incluso</span>
              </div>
              <button class="btn-upgrade" (click)="showUpgradeModal.set(true)">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
                Fazer upgrade
              </button>
            </div>
          </div>
        }

        @if (auth.acessoCritico() || auth.acessoExpirado()) {
          <div class="trial-banner" [class.trial-critico]="auth.acessoCritico()" [class.trial-expirado]="auth.acessoExpirado()">
            <div class="trial-banner-left">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              @if (auth.acessoExpirado()) {
                <span><strong>Seu acesso expirou.</strong> Entre em contato com o administrador para renovar.</span>
              } @else {
                <span>
                  <strong>Atenção:</strong> seu acesso expira em
                  <strong>{{ auth.diasRestantesAcesso() }} dia(s)</strong>.
                  Entre em contato com o administrador para renovar.
                </span>
              }
            </div>
          </div>
        }

        @if (isAdmin() && cobrancasAtrasadas() > 0) {
          <div class="billing-alert">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>
              <strong>{{ cobrancasAtrasadas() }} cobrança(s) atrasada(s)</strong> — acesse
              <a routerLink="/contadores" class="alert-link">Contadores</a> para regularizar.
            </span>
          </div>
        }
        <router-outlet />
      </main>
    </div>

    <app-toast-container />
    <app-assistente-chat />
    <app-novidades-modal #novidadesModal />
    <app-onboarding-tour #tourGuiado />

    <!-- ── Modal de upgrade de plano ── -->
    @if (showUpgradeModal()) {
      <div class="overlay" (click)="showUpgradeModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3 class="modal-title font-heading">Fazer upgrade do plano</h3>
            <button class="modal-close" (click)="showUpgradeModal.set(false)">✕</button>
          </header>
          <div class="modal-body">
            <p class="upgrade-text">
              Fale com a gente pelo WhatsApp para escolher o melhor plano pago para o seu escritório e continuar usando o FiscalDoc sem interrupções.
            </p>
            <a class="btn-whatsapp" [href]="whatsappUpgradeUrl()" target="_blank" rel="noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.44.79 3.07 1.2 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.13-4.9-4.32-.14-.19-1.17-1.56-1.17-2.98s.74-2.11 1-2.4c.26-.29.57-.36.76-.36h.55c.18 0 .42-.03.65.5.24.53.81 1.85.88 1.99.07.14.12.3.02.48-.1.19-.15.3-.29.46-.15.17-.31.38-.45.51-.15.14-.3.3-.13.58.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.44.29.15.46.13.63-.07.17-.19.72-.83.91-1.12.19-.29.38-.24.63-.14.26.1 1.63.77 1.91.91.29.14.48.22.55.34.07.13.07.72-.17 1.4z"/></svg>
              Chamar no WhatsApp
            </a>
            <span class="upgrade-hint">Ou envie mensagem direto: {{ whatsappNumberFormatted }}</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg);
    }

    /* Sidebar */
    .sidebar {
      width: var(--sidebar, 220px);
      background: var(--bg2);
      border-right: 1px solid var(--border);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--border);
    }

    .mobile-menu-btn {
      display: none;
      position: fixed;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 60;
      width: 38px;
      height: 38px;
      align-items: center;
      justify-content: center;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      cursor: pointer;
    }

    .sidebar-close-btn {
      display: none;
      margin-left: auto;
      background: none;
      border: none;
      color: var(--text2);
      cursor: pointer;
      padding: 4px;
      flex-shrink: 0;
    }

    .sidebar-backdrop {
      display: none;
    }

    .brand-icon {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: var(--accent);
      color: #0d0f14;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
      letter-spacing: 0.02em;
    }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm, 8px);
      color: var(--text2);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      transition: background 120ms, color 120ms;
      cursor: pointer;
    }

    .nav-item:hover {
      background: var(--bg3);
      color: var(--text);
    }

    .nav-item.active {
      background: var(--accent-dim, oklch(0.62 0.17 254 / 0.12));
      color: var(--accent);
    }

    .nav-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-label { flex: 1; }

    .nav-group { display: flex; flex-direction: column; gap: 2px; }
    .nav-group-toggle { width: 100%; background: none; border: none; font-family: inherit; text-align: left; }
    .nav-chevron { flex-shrink: 0; transition: transform 150ms; opacity: .6; }
    .nav-chevron.open { transform: rotate(90deg); }
    .nav-subitems { display: flex; flex-direction: column; gap: 2px; padding-left: 1.5rem; }
    .nav-subitem { font-size: 13px; padding: 0.4rem 0.75rem; }
    .nav-subitem .nav-icon { width: 14px; height: 14px; }

    /* Footer */
    .sidebar-footer {
      padding: 0.5rem 0.75rem 0.75rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empresa-badge {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: var(--accent-dim, oklch(0.62 0.17 254 / 0.1));
      border: 1px solid oklch(0.62 0.17 254 / 0.2);
      border-radius: 6px;
      padding: 5px 8px;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }
    .empresa-nome {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .empresa-cnpj {
      font-size: 9.5px;
      color: var(--text2);
      letter-spacing: 0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
    }

    .user-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--accent-dim, oklch(0.62 0.17 254 / 0.15));
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    img.user-avatar { object-fit: cover; }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 11px;
      color: var(--text2);
    }

    .logout-btn {
      background: none;
      border: none;
      color: var(--text2);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 120ms, background 120ms;
      flex-shrink: 0;
    }

    .logout-btn:hover {
      color: var(--red);
      background: rgba(255,77,109,0.1);
    }

    .security-link {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--text2); text-decoration: none; padding: 4px 2px;
      border-radius: 6px; transition: color 120ms;
    }
    .security-link:hover { color: var(--text); }
    .nav-item-active.security-link { color: var(--accent); }

    .footer-links-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .footer-icons { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
    .alertas-icon-link, .novidades-icon-link {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; flex-shrink: 0;
      color: var(--text2); border-radius: 6px; transition: color 120ms, background 120ms;
      background: none; border: none; cursor: pointer; padding: 0;
    }
    .alertas-icon-link:hover, .novidades-icon-link:hover { color: var(--text); background: rgba(255,255,255,.05); }
    .alertas-icon-link.active { color: var(--accent); }

    .version-row {
      font-size: 10px;
      color: var(--text3, var(--text2));
      text-align: center;
      padding-top: 2px;
    }

    /* Main content */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Impersonation banner */
    .impersonation-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      background: rgba(255,209,102,0.1); border: 1px solid rgba(255,209,102,0.35);
      border-radius: var(--radius-sm, 8px); padding: 10px 16px; margin-bottom: 1rem;
      font-size: 13px; color: var(--yellow);
    }
    .impersonation-exit {
      background: none; border: 1px solid var(--yellow); color: var(--yellow); border-radius: 6px;
      padding: 5px 12px; font-size: 12.5px; font-weight: 600; cursor: pointer; flex-shrink: 0;
    }
    .impersonation-exit:hover { background: rgba(255,209,102,0.15); }

    /* Trial banner */
    .trial-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      background: linear-gradient(135deg, oklch(0.62 0.17 254 / 0.08) 0%, rgba(0,102,255,0.06) 100%);
      border: 1px solid oklch(0.62 0.17 254 / 0.25); border-radius: var(--radius-sm, 8px);
      padding: 10px 16px; margin-bottom: 1rem; font-size: 13px; color: var(--text);
    }
    .trial-banner.trial-critico {
      background: rgba(255,209,102,0.08); border-color: rgba(255,209,102,0.35); color: var(--yellow);
    }
    .trial-banner.trial-expirado {
      background: rgba(255,77,109,0.08); border-color: rgba(255,77,109,0.3); color: var(--red);
    }
    .trial-banner-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .trial-banner-left svg { flex-shrink: 0; color: var(--accent); }
    .trial-critico .trial-banner-left svg { color: var(--yellow); }
    .trial-expirado .trial-banner-left svg { color: var(--red); }
    .trial-banner-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .trial-benefits {
      display: flex; gap: 12px; font-size: 11.5px; color: var(--text2);
    }
    @media (max-width: 768px) { .trial-benefits { display: none; } }
    .btn-upgrade {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--accent); color: #0d0f14; border: none; border-radius: 6px;
      padding: 5px 12px; font-size: 12.5px; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: opacity 120ms;
    }
    .btn-upgrade:hover { opacity: 0.85; }

    .billing-alert {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,209,102,0.08); border: 1px solid rgba(255,209,102,0.25);
      border-radius: var(--radius-sm, 8px); padding: 10px 14px; margin-bottom: 1.25rem;
      font-size: 13px; color: var(--yellow);
    }
    .billing-alert strong { color: var(--yellow); }
    .alert-link { color: var(--accent); text-decoration: underline; cursor: pointer; }

    /* ── Modal de upgrade ── */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; max-width: 420px; }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .modal-title { margin: 0; font-size: 1rem; }
    .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 16px; padding: 4px; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
    .upgrade-text { margin: 0; font-size: 13.5px; color: var(--text2); line-height: 1.6; }
    .btn-whatsapp {
      display: inline-flex; align-items: center; gap: 8px;
      background: #25D366; color: #06301a; border: none; border-radius: 8px;
      padding: .625rem 1.25rem; font-size: 14px; font-weight: 700; cursor: pointer;
      text-decoration: none; white-space: nowrap;
    }
    .btn-whatsapp:hover { opacity: .9; }
    .upgrade-hint { font-size: 12px; color: var(--text3); }

    /* Tablet/iPad e mobile: sidebar vira gaveta (off-canvas) */
    @media (max-width: 1024px) {
      .mobile-menu-btn { display: flex; }
      .sidebar-close-btn { display: block; }

      .sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 70;
        width: min(280px, 82vw);
        transform: translateX(-100%);
        transition: transform 200ms ease;
        box-shadow: 2px 0 16px rgba(0,0,0,.35);
      }
      .sidebar.open { transform: translateX(0); }

      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.5);
        z-index: 65;
      }

      .content { padding: 1rem; padding-top: 3.75rem; }
    }

    @media (max-width: 640px) {
      .content { padding: 0.75rem; padding-top: 3.5rem; }
      .impersonation-banner, .trial-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .trial-banner-right { width: 100%; }
      .trial-benefits { flex-wrap: wrap; }
    }
  `],
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly _contSvc = inject(ContadorService);
  private readonly _router = inject(Router);

  cobrancasAtrasadas = signal(0);
  isAdmin = signal(false);
  showUpgradeModal = signal(false);
  mobileMenuOpen = signal(false);
  private readonly _expandedGroups = signal<Set<string>>(new Set());

  private readonly _whatsappNumber = '5511973982559';
  readonly whatsappNumberFormatted = '+55 11 97398-2559';
  readonly appVersion = environment.appVersion;

  formatCnpj(cnpj: string): string {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  voltarParaAdmin(): void {
    this.auth.restoreAdminContext().subscribe({
      next: () => this._router.navigate(['/dashboard']),
      error: () => this._router.navigate(['/auth/login']),
    });
  }

  whatsappUpgradeUrl(): string {
    const nome = this.auth.currentUser()?.nome ?? '';
    const msg = `Olá! Sou ${nome} e quero fazer upgrade do meu plano no FiscalDoc.`;
    return `https://wa.me/${this._whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      roles: ['Administrador', 'Contador', 'UsuarioContador', 'Cliente'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>`,
    },
    {
      label: 'Clientes',
      route: '/clientes',
      roles: ['Administrador', 'Contador', 'UsuarioContador'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>
      </svg>`,
    },
    {
      label: 'Documentos',
      route: '/documentos',
      roles: ['Contador', 'UsuarioContador'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`,
    },
    {
      label: 'Logs',
      route: '/logs',
      roles: ['Contador', 'UsuarioContador'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>`,
    },
  ];

  private readonly _adminIcons = {
    contadores: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>`,
    clientes: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>
    </svg>`,
    usuarios: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>`,
    alertas: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>`,
    logs: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
    </svg>`,
    blog: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>`,
    configuracoes: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
    </svg>`,
    cadastros: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>`,
    gerencial: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>`,
    cobrancas: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>`,
    relatorios: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V9m4 8V5m4 12v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>`,
  };

  private get adminNavItems(): NavItem[] {
    return [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>`,
      },
      {
        label: 'Cadastros',
        icon: this._adminIcons.cadastros,
        children: [
          { label: 'Contadores', route: '/contadores', icon: this._adminIcons.contadores },
          { label: 'Clientes', route: '/clientes', icon: this._adminIcons.clientes },
          { label: 'Usuários', route: '/usuarios', icon: this._adminIcons.usuarios },
        ],
      },
      {
        label: 'Gerencial',
        icon: this._adminIcons.gerencial,
        children: [
          { label: 'Contas a Receber', route: '/cobrancas', icon: this._adminIcons.cobrancas },
          { label: 'Relatórios', route: '/relatorios', icon: this._adminIcons.relatorios },
          { label: 'Alertas', route: '/alertas', icon: this._adminIcons.alertas },
          { label: 'Logs', route: '/logs', icon: this._adminIcons.logs },
          { label: 'Blog', route: '/admin/blog', icon: this._adminIcons.blog },
          { label: 'Configurações', route: '/configuracoes', icon: this._adminIcons.configuracoes },
        ],
      },
    ];
  }

  ngOnInit(): void {
    const perfil = this.auth.currentUser()?.perfil;
    if (perfil === 'Administrador') {
      this.isAdmin.set(true);
      this._contSvc.getAdminDashboard().subscribe({
        next: (d) => this.cobrancasAtrasadas.set(d.cobrancasAtrasadas),
        error: () => {},
      });
    }
  }

  get visibleNavItems(): NavItem[] {
    const user = this.auth.currentUser();
    const perfil = user?.perfil ?? '';

    if (perfil === 'Administrador') {
      return this.adminNavItems;
    }

    const base = this.navItems.filter(item => !item.roles || item.roles.includes(perfil));

    if (perfil === 'Cliente' && user?.clienteId) {
      const id = user.clienteId;
      base.push(
        {
          label: 'Emissão',
          tourId: 'grupo-emissao',
          icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>`,
          children: [
            {
              label: 'Pedidos / NF-e',
              route: `/clientes/${id}/pedidos`,
              tourId: 'nav-pedidos',
              icon: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>`,
            },
          ],
        },
        {
          label: 'Cadastros',
          route: `/clientes/${id}/cadastros`,
          tourId: 'grupo-cadastros',
          icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>`,
          children: [
            {
              label: 'Usuários',
              route: `/clientes/${id}/usuarios`,
              icon: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>
              </svg>`,
            },
            {
              label: 'Produtos',
              route: `/clientes/${id}/cadastros/produtos`,
              icon: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>`,
            },
            {
              label: 'Clientes',
              route: `/clientes/${id}/cadastros/destinatarios`,
              icon: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 3.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>`,
            },
            {
              label: 'Transportadoras',
              route: `/clientes/${id}/cadastros/transportadoras`,
              icon: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16V6a1 1 0 011-1h9a1 1 0 011 1v10M3 16h11m0 0h2.05M3 16a2 2 0 104 0m7 0a2 2 0 104 0m0 0h2v-4.5a1 1 0 00-.293-.707l-2.5-2.5A1 1 0 0016.5 8H14v8"/>
              </svg>`,
            },
          ],
        },
        {
          label: 'Relatórios',
          route: `/clientes/${id}/relatorios`,
          tourId: 'nav-relatorios',
          icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V9m4 8V5m4 12v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>`,
        },
        {
          label: 'Configurações',
          icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
          </svg>`,
          children: [
            {
              label: 'Empresa',
              route: `/clientes/${id}/empresa`,
              icon: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4m-4 6h.01M9 15h.01M9 18h.01"/>
              </svg>`,
            },
            {
              label: 'Logs',
              route: `/logs`,
              icon: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>`,
            },
          ],
        },
      );
    }

    return base;
  }

  toggleGroup(label: string): void {
    this._expandedGroups.update(s => {
      const next = new Set(s);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }

  isGroupActive(item: NavItem): boolean {
    return (item.children ?? []).some(c => !!c.route && this._router.url.startsWith(c.route));
  }

  isGroupExpanded(item: NavItem): boolean {
    return this._expandedGroups().has(item.label) || this.isGroupActive(item);
  }

  userInitials(): string {
    const nome = this.auth.currentUser()?.nome ?? '';
    const parts = nome.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] ?? '?').toUpperCase();
  }

  avatarBg(): string {
    return this._hashColor(this.auth.currentUser()?.nome ?? '?');
  }

  avatarFg(): string {
    return '#0d0f14';
  }

  userAvatarSrc(): string {
    const id = this.auth.currentUser()?.id;
    return `${environment.apiUrl}/usuarios/${id}/avatar?v=${this.auth.avatarVersion()}`;
  }

  private _hashColor(str: string): string {
    const colors = ['#00e5a0','#0066ff','#a855f7','#f59e0b','#ef4444','#06b6d4','#84cc16','#ec4899'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
