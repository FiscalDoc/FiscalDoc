export interface CnpjLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  cnaeFiscal?: string;
  codigoMunicipioIbge?: string;
  optanteSimples: boolean;
  situacaoCadastral?: string;
}
