export interface TransportadoraDto {
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

export interface CreateTransportadoraRequest {
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

export interface UpdateTransportadoraRequest extends CreateTransportadoraRequest {
  ativo: boolean;
}
