import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, ContadorService } from '@veloxml/services';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
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
        </div>

        <nav class="sidebar-nav">
          @for (item of visibleNavItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
            >
              <span class="nav-icon" [innerHTML]="item.icon"></span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          @if (auth.currentUser()?.empresa) {
            <div class="empresa-badge">{{ auth.currentUser()?.empresa }}</div>
          }
          <a routerLink="/perfil" routerLinkActive="nav-item-active" class="security-link">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Segurança / 2FA
          </a>
          <div class="user-row">
          <div class="user-info">
            <div class="user-avatar" [style.background]="avatarBg()" [style.color]="avatarFg()">{{ userInitials() }}</div>
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
        </div>
      </aside>

      <main class="content">
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
              <button class="btn-upgrade">
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
      background: var(--accent-dim, rgba(0,229,160,0.12));
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

    /* Footer */
    .sidebar-footer {
      padding: 0.5rem 0.75rem 0.75rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empresa-badge {
      font-size: 10px;
      font-weight: 600;
      color: var(--accent);
      background: var(--accent-dim, rgba(0,229,160,0.1));
      border: 1px solid rgba(0,229,160,0.2);
      border-radius: 4px;
      padding: 2px 7px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: fit-content;
      max-width: 100%;
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
      background: var(--accent-dim, rgba(0,229,160,0.15));
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

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

    /* Trial banner */
    .trial-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      background: linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(0,102,255,0.06) 100%);
      border: 1px solid rgba(0,229,160,0.25); border-radius: var(--radius-sm, 8px);
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
  `],
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly _contSvc = inject(ContadorService);

  cobrancasAtrasadas = signal(0);
  isAdmin = signal(false);

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      roles: ['Administrador', 'Contador', 'UsuarioContador'],
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
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`,
    },
    {
      label: 'Alertas',
      route: '/alertas',
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>`,
    },
    {
      label: 'Contadores',
      route: '/contadores',
      roles: ['Administrador'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>`,
    },
    {
      label: 'Logs',
      route: '/logs',
      roles: ['Administrador'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>`,
    },
    {
      label: 'Usuários',
      route: '/usuarios',
      roles: ['Administrador'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>`,
    },
    {
      label: 'Configurações',
      route: '/configuracoes',
      roles: ['Administrador'],
      icon: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
      </svg>`,
    },
  ];

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
    const perfil = this.auth.currentUser()?.perfil ?? '';
    return this.navItems.filter(item =>
      !item.roles || item.roles.includes(perfil)
    );
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

  private _hashColor(str: string): string {
    const colors = ['#00e5a0','#0066ff','#a855f7','#f59e0b','#ef4444','#06b6d4','#84cc16','#ec4899'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
