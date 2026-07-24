export interface UsuarioDto {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  contadorId?: string;
  nomeContador?: string;
  clienteId?: string;
  nomeCliente?: string;
  twoFactorHabilitado: boolean;
  createdAt: string;
}

export interface CreateUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfil: string;
  contadorId?: string;
  clienteId?: string;
}

export interface UpdateUsuarioRequest {
  nome: string;
  ativo: boolean;
  novaSenha?: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  nomeFirma?: string;
  telefone?: string;
}

export interface RegisterResponse {
  tenantId: string;
  userId: string;
  nome: string;
  email: string;
}
