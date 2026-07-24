import { Routes } from '@angular/router';

export const DOCUMENTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./documentos-list/documentos-list.component').then((m) => m.DocumentosListComponent),
  },
];
