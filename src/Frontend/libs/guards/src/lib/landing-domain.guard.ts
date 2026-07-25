import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * A landing page (marketing) so vive no domínio raiz (ex: fiscaldoc.com.br).
 * No subdomínio do app (app.fiscaldoc.com.br), a raiz "/" leva direto pro login.
 */
export const landingDomainGuard: CanActivateFn = () => {
  if (window.location.hostname.startsWith('app.')) {
    const router = inject(Router);
    return router.createUrlTree(['/auth/login']);
  }
  return true;
};
