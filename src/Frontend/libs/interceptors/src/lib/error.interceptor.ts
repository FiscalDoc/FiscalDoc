import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@veloxml/services';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/auth/login']);
      }

      if (err.status === 403) {
        const body = err.error;
        if (body?.type === 'access_blocked') {
          // Contador bloqueado: desloga e redireciona com motivo
          auth.logout();
          router.navigate(['/auth/login'], {
            queryParams: {
              blocked: '1',
              motivo: body.motivo ?? ''
            }
          });
        }
      }

      return throwError(() => err);
    })
  );
};
