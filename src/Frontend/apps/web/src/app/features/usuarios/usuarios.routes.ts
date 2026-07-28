import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./usuarios.component').then((m) => m.UsuariosComponent),
  },
  {
    path: ':usuarioId',
    loadComponent: () => import('./usuario-detail/usuario-detail.component').then((m) => m.UsuarioDetailComponent),
  },
];
