export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  nome: string;
  email: string;
  perfil: string;
  tenantId: string;
  plano: string;
  planoExpiracao?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export interface Setup2faResponse {
  secret: string;
  otpAuthUri: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  tenantId: string;
  empresa?: string;
  contadorId?: string;
  clienteId?: string;
  plano?: string;
  planoExpiracao?: string;
  acessoExpiracao?: string; // DataLimiteAcesso do Contador (quando criado pelo admin)
}
