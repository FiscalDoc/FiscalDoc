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
