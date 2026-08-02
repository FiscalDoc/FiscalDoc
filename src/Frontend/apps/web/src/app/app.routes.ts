import { Routes } from '@angular/router';
import { authGuard, clienteScopeGuard, landingDomainGuard } from '@veloxml/guards';

export const routes: Routes = [
  {
    path: '',
    canActivate: [landingDomainGuard],
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'blog',
    canActivate: [landingDomainGuard],
    loadChildren: () => import('./features/blog/blog.routes').then((m) => m.BLOG_ROUTES),
  },
  {
    path: 'imprimir/pedidos/:id/:pedidoId',
    canActivate: [authGuard, clienteScopeGuard],
    loadComponent: () =>
      import('./features/clientes/pedidos/pedido-imprimir/pedido-imprimir.component').then((m) => m.PedidoImprimirComponent),
  },
  {
    path: 'imprimir/danfe/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/documentos/documento-danfe/documento-danfe.component').then((m) => m.DocumentoDanfeComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
      },
      {
        path: 'documentos',
        loadChildren: () =>
          import('./features/documentos/documentos.routes').then((m) => m.DOCUMENTOS_ROUTES),
      },
      {
        path: 'alertas',
        loadComponent: () =>
          import('./features/alertas/alertas.component').then((m) => m.AlertasComponent),
      },
      {
        path: 'contadores',
        loadChildren: () =>
          import('./features/contadores/contadores.routes').then((m) => m.CONTADORES_ROUTES),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./features/logs/logs.component').then((m) => m.LogsComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./features/configuracoes/configuracoes.component').then((m) => m.ConfiguracoesComponent),
      },
      {
        path: 'admin/blog',
        loadChildren: () =>
          import('./features/admin/blog/blog-admin.routes').then((m) => m.BLOG_ADMIN_ROUTES),
      },
      {
        path: 'cobrancas',
        loadComponent: () =>
          import('./features/cobrancas/cobrancas.component').then((m) => m.CobrancasComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
