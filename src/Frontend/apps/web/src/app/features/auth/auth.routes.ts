import { Routes } from '@angular/router';
import { authGuard } from '@veloxml/guards';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'selecionar-contexto',
    canActivate: [authGuard],
    loadComponent: () => import('./selecionar-contexto/selecionar-contexto.component').then((m) => m.SelecionarContextoComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
