import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ViaCepResult } from '@veloxml/models';

@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly _http = inject(HttpClient);

  // Consulta o ViaCEP (API pública, sem autenticação) direto do navegador — não passa pelo
  // nosso backend. Retorna null se o CEP for inválido, não encontrado, ou a consulta falhar.
  buscar(cep: string): Observable<ViaCepResult | null> {
    const cepLimpo = (cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return of(null);

    return this._http.get<ViaCepResult>(`https://viacep.com.br/ws/${cepLimpo}/json/`).pipe(
      map(r => (r.erro ? null : r)),
      catchError(() => of(null)),
    );
  }
}
