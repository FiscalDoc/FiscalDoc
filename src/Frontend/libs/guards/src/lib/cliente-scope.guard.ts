import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../../services/src/lib/auth.service';

/**
 * Impede que um usuário de perfil Cliente acesse dados de outro cliente
 * navegando manualmente para /clientes/{outroId}/... — Admin e Contador
 * não são restritos, pois legitimamente atendem múltiplos clientes.
 */
export const clienteScopeGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();
  if (!user) return router.createUrlTree(['/auth/login']);

  if (user.perfil === 'Cliente') {
    const routeClienteId = route.paramMap.get('id');
    if (routeClienteId && routeClienteId !== user.clienteId) {
      return router.createUrlTree(['/clientes', user.clienteId ?? '', 'cadastros']);
    }
  }

  return true;
};
