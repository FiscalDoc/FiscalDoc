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
];
