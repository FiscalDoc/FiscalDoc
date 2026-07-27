import { Routes } from '@angular/router';
import { clienteScopeGuard } from '@veloxml/guards';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./clientes-list/clientes-list.component').then((m) => m.ClientesListComponent),
  },
  {
    path: ':id',
    canActivate: [clienteScopeGuard],
    loadComponent: () => import('./cliente-detail/cliente-detail.component').then((m) => m.ClienteDetailComponent),
  },
  {
    path: ':id/cadastros',
    canActivate: [clienteScopeGuard],
    loadComponent: () => import('./cadastros/cadastros.component').then((m) => m.CadastrosComponent),
  },
  {
    path: ':id/pedidos',
    canActivate: [clienteScopeGuard],
    loadComponent: () => import('./pedidos/pedidos.component').then((m) => m.PedidosComponent),
  },
  {
    path: ':id/pedidos/:pedidoId',
    canActivate: [clienteScopeGuard],
    loadComponent: () => import('./pedidos/pedido-form/pedido-form.component').then((m) => m.PedidoFormComponent),
  },
  {
    path: ':id/usuarios',
    canActivate: [clienteScopeGuard],
    loadComponent: () => import('./cliente-usuarios/cliente-usuarios.component').then((m) => m.ClienteUsuariosComponent),
  },
];
