export interface DestinatarioDto {
  id: string;
  clienteId: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cpfCnpj?: string;
  inscricaoEstadual?: string;
  email?: string;
  telefone?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  codigoIbgeCidade?: string;
  ativo: boolean;
  createdAt: string;
}

export interface CreateDestinatarioRequest {
  razaoSocial: string;
  nomeFantasia?: string;
  cpfCnpj?: string;
  inscricaoEstadual?: string;
  email?: string;
  telefone?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  codigoIbgeCidade?: string;
}

export interface UpdateDestinatarioRequest extends CreateDestinatarioRequest {
  ativo: boolean;
}
