export interface SmtpConfigDto {
  host: string;
  port: number;
  from: string;
  fromName: string;
  username?: string;
  enableSsl: boolean;
  replyTo?: string;
}

export interface SaveSmtpConfigRequest {
  host: string;
  port: number;
  from: string;
  fromName: string;
  username?: string;
  password?: string;
  enableSsl: boolean;
  replyTo?: string;
}

export interface SocialConfigDto {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface SendConviteRequest {
  nome: string;
  email: string;
}

export interface TestSmtpConfigRequest {
  host: string;
  port: number;
  from: string;
  fromName: string;
  username?: string;
  password?: string;
  enableSsl: boolean;
  emailDestino: string;
}

export interface ImportacaoXmlStatusDto {
  executadoEm: string;
  clientesProcessados: number;
  emailsEncontrados: number;
  xmlsProcessados: number;
  xmlsImportados: number;
  erros: number;
  clientes: ImportacaoXmlClienteStatusDto[];
}

export interface ImportacaoXmlClienteStatusDto {
  clienteId: string;
  clienteNome: string;
  emailsEncontrados: number;
  xmlsProcessados: number;
  xmlsImportados: number;
  erros: number;
  mensagemErro?: string;
}
