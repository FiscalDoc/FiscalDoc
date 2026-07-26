import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./clientes-list/clientes-list.component').then((m) => m.ClientesListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./cliente-detail/cliente-detail.component').then((m) => m.ClienteDetailComponent),
  },
  {
    path: ':id/cadastros',
    loadComponent: () => import('./cadastros/cadastros.component').then((m) => m.CadastrosComponent),
  },
  {
    path: ':id/pedidos',
    loadComponent: () => import('./pedidos/pedidos.component').then((m) => m.PedidosComponent),
  },
  {
    path: ':id/pedidos/:pedidoId',
    loadComponent: () => import('./pedidos/pedido-form/pedido-form.component').then((m) => m.PedidoFormComponent),
  },
];
