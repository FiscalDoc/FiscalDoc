export interface ClienteDto {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  contadorId: string;
  nomeContador?: string;
  totalDocumentos: number;
  appKey: string;
  webhookHabilitado: boolean;
  webhookUrl?: string;
  imapHabilitado: boolean;
  imapHost?: string;
  imapPort: number;
  imapEmail?: string;
  // Fiscal
  regimeTributario?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  cnaePrincipal?: string;
  serieNfe?: string;
  nfeHabilitado?: boolean;
  certificadoA1Validade?: string;
  focusNfeStatus: 'NaoConfigurado' | 'PendenteRegistro' | 'Registrada' | 'ErroRegistro';
  focusNfeErro?: string;
  focusNfeAmbiente: 'homologacao' | 'producao';
}

export interface CreateClienteRequest {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  contadorId?: string;
}

export interface UpdateClienteRequest {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
}

export interface ConfigurarImapRequest {
  habilitado: boolean;
  host?: string;
  port: number;
  email?: string;
  senha?: string;
}

export interface ConfigurarWebhookRequest {
  habilitado: boolean;
  url?: string;
}

export interface CriarContaClienteRequest {
  nome: string;
  email: string;
}

export interface CriarContaClienteResponse {
  userId: string;
  email: string;
  nome: string;
}

export interface UpdateClienteFiscalRequest {
  regimeTributario?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  cnaePrincipal?: string;
  serieNfe: string;
  nfeHabilitado: boolean;
}
