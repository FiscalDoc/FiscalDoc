import { Routes } from '@angular/router';
import { roleGuard, unsavedChangesGuard } from '@veloxml/guards';

export const CONTADORES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () =>
      import('./contadores-list/contadores-list.component').then((m) => m.ContadoresListComponent),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () =>
      import('./contador-detail/contador-detail.component').then((m) => m.ContadorDetailComponent),
  },
];
