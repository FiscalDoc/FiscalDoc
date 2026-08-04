import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CnpjLookupResult } from '@veloxml/models';

interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
  cnae_fiscal?: number;
  codigo_municipio_ibge?: number;
  opcao_pelo_simples?: boolean;
  descricao_situacao_cadastral?: string;
}

@Injectable({ providedIn: 'root' })
export class CnpjService {
  private readonly _http = inject(HttpClient);

  // Consulta a BrasilAPI (agregador público e gratuito dos dados da Receita Federal, sem
  // autenticação) direto do navegador, mesmo espírito do CepService. Retorna null se o CNPJ
  // for inválido, não encontrado, ou a consulta falhar.
  buscar(cnpj: string): Observable<CnpjLookupResult | null> {
    const cnpjLimpo = (cnpj || '').replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return of(null);

    return this._http.get<BrasilApiCnpjResponse>(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`).pipe(
      map(r => ({
        cnpj: r.cnpj,
        razaoSocial: r.razao_social,
        nomeFantasia: r.nome_fantasia || undefined,
        logradouro: r.logradouro || undefined,
        numero: r.numero || undefined,
        complemento: r.complemento || undefined,
        bairro: r.bairro || undefined,
        municipio: r.municipio || undefined,
        uf: r.uf || undefined,
        cep: r.cep || undefined,
        telefone: r.ddd_telefone_1 || undefined,
        email: r.email || undefined,
        cnaeFiscal: r.cnae_fiscal != null ? String(r.cnae_fiscal) : undefined,
        codigoMunicipioIbge: r.codigo_municipio_ibge != null ? String(r.codigo_municipio_ibge) : undefined,
        optanteSimples: r.opcao_pelo_simples === true,
        situacaoCadastral: r.descricao_situacao_cadastral || undefined,
      })),
      catchError(() => of(null)),
    );
  }
}
