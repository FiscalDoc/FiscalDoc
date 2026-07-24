import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../../services/src/lib/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required: string[] = route.data['roles'] ?? [];

  const user = auth.currentUser();
  if (!user) return router.createUrlTree(['/auth/login']);
  if (required.length === 0 || required.includes(user.perfil)) return true;
  return router.createUrlTree(['/dashboard']);
};
