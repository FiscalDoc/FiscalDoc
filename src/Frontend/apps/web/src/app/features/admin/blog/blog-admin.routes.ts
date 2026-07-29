import { Routes } from '@angular/router';
import { roleGuard } from '@veloxml/guards';

export const BLOG_ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () =>
      import('./blog-admin-list/blog-admin-list.component').then((m) => m.BlogAdminListComponent),
  },
  {
    path: 'nova-postagem',
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () =>
      import('./blog-post-form/blog-post-form.component').then((m) => m.BlogPostFormComponent),
  },
  {
    path: 'editar/:id',
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () =>
      import('./blog-post-form/blog-post-form.component').then((m) => m.BlogPostFormComponent),
  },
  {
    path: 'preview/:id',
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
    loadComponent: () =>
      import('./blog-preview/blog-preview.component').then((m) => m.BlogPreviewComponent),
  },
];
