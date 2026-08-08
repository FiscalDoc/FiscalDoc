import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  LoginRequest, LoginResponse, CurrentUser, Setup2faResponse,
  SwitchContextRequest, SwitchContextResponse, RestoreAdminContextResponse,
} from '@veloxml/models';

const TOKEN_KEY   = 'vx_access_token';
const REFRESH_KEY = 'vx_refresh_token';
const PLANO_KEY   = 'vx_plano';
const EXPIRA_KEY  = 'vx_plano_expiracao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _api    = inject(ApiService);
  private readonly _router = inject(Router);

  private readonly _currentUser = signal<CurrentUser | null>(null);
  readonly currentUser    = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  // A URL do avatar (usuarios/{id}/avatar) não muda quando a foto é trocada — é a mesma chave
  // sobrescrita no storage. Esse contador força o <img> a buscar de novo depois de um upload,
  // em vez de continuar mostrando a foto antiga do cache do navegador.
  private readonly _avatarVersion = signal(0);
  readonly avatarVersion = this._avatarVersion.asReadonly();
  bumpAvatarVersion(): void { this._avatarVersion.update(v => v + 1); }

  readonly isOnTrial = computed(() => this._currentUser()?.plano === 'Trial');
  readonly isImpersonating = computed(() => !!this._currentUser()?.actingAdminId);

  readonly diasRestantesTrial = computed(() => {
    const exp = this._currentUser()?.planoExpiracao;
    if (!exp) return null;
    const diff = new Date(exp).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  readonly trialExpirado = computed(() => {
    const dias = this.diasRestantesTrial();
    return dias !== null && dias <= 0;
  });

  readonly trialCritico = computed(() => {
    const dias = this.diasRestantesTrial();
    return dias !== null && dias > 0 && dias <= 7;
  });

  readonly diasRestantesAcesso = computed(() => {
    const exp = this._currentUser()?.acessoExpiracao;
    if (!exp) return null;
    const diff = new Date(exp).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  readonly acessoExpirado = computed(() => {
    const dias = this.diasRestantesAcesso();
    return dias !== null && dias <= 0;
  });

  readonly acessoCritico = computed(() => {
    const dias = this.diasRestantesAcesso();
    return dias !== null && dias > 0 && dias <= 7;
  });

  login(req: LoginRequest): Observable<LoginResponse> {
    return new Observable(observer => {
      this._api.post<LoginResponse>('/auth/login', req).subscribe({
        next: (res) => {
          this._persistSession(res);
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(PLANO_KEY);
    localStorage.removeItem(EXPIRA_KEY);
    this._currentUser.set(null);
    this._router.navigate(['/auth/login']);
  }

  getToken(): string | null        { return localStorage.getItem(TOKEN_KEY); }
  getRefreshToken(): string | null { return localStorage.getItem(REFRESH_KEY); }

  verify2fa(twoFactorToken: string, code: string): Observable<LoginResponse> {
    return new Observable(observer => {
      this._api.post<LoginResponse>('/auth/2fa/verify', { twoFactorToken, code }).subscribe({
        next: (res) => { this._persistSession(res); observer.next(res); observer.complete(); },
        error: (err) => observer.error(err),
      });
    });
  }

  changePassword(senhaAtual: string, novaSenha: string): Observable<void> {
    return this._api.post<void>('/auth/change-password', { senhaAtual, novaSenha });
  }

  forgotPassword(email: string): Observable<void> {
    return this._api.post<void>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, novaSenha: string): Observable<void> {
    return this._api.post<void>('/auth/reset-password', { token, novaSenha });
  }

  validateResetToken(token: string): Observable<{ valido: boolean }> {
    return this._api.get<{ valido: boolean }>('/auth/reset-password/validar', { token });
  }

  switchContext(req: SwitchContextRequest): Observable<SwitchContextResponse> {
    return new Observable(observer => {
      this._api.post<SwitchContextResponse>('/auth/switch-context', req).subscribe({
        next: (res) => {
          // Sem refresh token guardado enquanto impersonando — se o access token expirar, a
          // sessão simplesmente cai (evita "voltar" silenciosamente pro admin sem o usuário
          // perceber, via um refresh usando o token antigo).
          localStorage.removeItem(REFRESH_KEY);
          localStorage.setItem(TOKEN_KEY, res.accessToken);
          const user = this._decodeToken(res.accessToken);
          if (user) this._currentUser.set({ ...user, plano: this._currentUser()?.plano, planoExpiracao: this._currentUser()?.planoExpiracao });
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  restoreAdminContext(): Observable<RestoreAdminContextResponse> {
    return new Observable(observer => {
      this._api.post<RestoreAdminContextResponse>('/auth/restore-admin-context', {}).subscribe({
        next: (res) => {
          localStorage.setItem(TOKEN_KEY, res.accessToken);
          localStorage.setItem(REFRESH_KEY, res.refreshToken);
          const user = this._decodeToken(res.accessToken);
          if (user) this._currentUser.set({ ...user, plano: this._currentUser()?.plano, planoExpiracao: this._currentUser()?.planoExpiracao });
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  setup2fa(): Observable<Setup2faResponse> {
    return this._api.post<Setup2faResponse>('/auth/2fa/setup', {});
  }

  verifySetup2fa(code: string): Observable<{ message: string }> {
    return this._api.post<{ message: string }>('/auth/2fa/verify-setup', { code });
  }

  restoreSession(): Observable<void> {
    const token = this.getToken();
    if (!token) return of(undefined);

    const user = this._decodeToken(token);
    if (!user) {
      this.logout();
      return of(undefined);
    }

    // Restore plan info from localStorage
    user.plano          = localStorage.getItem(PLANO_KEY) ?? undefined;
    user.planoExpiracao = localStorage.getItem(EXPIRA_KEY) ?? undefined;
    this._currentUser.set(user);

    // Refresh plan + access expiration info from server in background
    this.refreshMe();

    return of(undefined);
  }

  // Também usado sob demanda (ex.: depois de trocar a foto do avatar) pra sincronizar o
  // currentUser() sem precisar de um novo login/reload de página.
  refreshMe(): void {
    this._api.get<CurrentUser>('/auth/me').subscribe({
      next: (me) => {
        const updated = this._currentUser();
        if (updated) {
          this._currentUser.set({
            ...updated,
            plano: me.plano,
            planoExpiracao: me.planoExpiracao,
            acessoExpiracao: me.acessoExpiracao,
            avatarUrl: me.avatarUrl,
          });
          this.bumpAvatarVersion();
          if (me.plano)          localStorage.setItem(PLANO_KEY,  me.plano);
          if (me.planoExpiracao) localStorage.setItem(EXPIRA_KEY, me.planoExpiracao);
        }
      },
      error: () => {},
    });
  }

  private _persistSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY,   res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    if (res.plano)          localStorage.setItem(PLANO_KEY,  res.plano);
    if (res.planoExpiracao) localStorage.setItem(EXPIRA_KEY, res.planoExpiracao);

    const user = this._decodeToken(res.accessToken);
    this._currentUser.set(user
      ? { ...user, plano: res.plano, planoExpiracao: res.planoExpiracao }
      : { id: '', nome: res.nome, email: res.email, perfil: res.perfil, tenantId: res.tenantId, plano: res.plano, planoExpiracao: res.planoExpiracao }
    );
  }

  private _decodeToken(token: string): CurrentUser | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64  = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(jsonStr);
      if (payload.exp && Date.now() / 1000 > payload.exp) return null;
      if (!payload.sub || !payload.email) return null;
      return {
        id: payload.sub, nome: payload['name'] ?? '', email: payload['email'],
        perfil: payload['role'] ?? '', tenantId: payload['tenant_id'] ?? '',
        empresa: payload['empresa'] ?? undefined,
        cnpj: payload['cnpj'] ?? undefined,
        contadorId: payload['contador_id'] ?? undefined,
        clienteId: payload['cliente_id'] ?? undefined,
        actingAdminId: payload['acting_admin_id'] ?? undefined,
      };
    } catch { return null; }
  }
}
