import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@veloxml/guards';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./usuarios.component').then((m) => m.UsuariosComponent),
  },
  {
    path: ':usuarioId',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./usuario-detail/usuario-detail.component').then((m) => m.UsuarioDetailComponent),
  },
];
