export type TipoDocumento = 'NFe' | 'CTe' | 'MDFe' | 'NFSe' | 'PDF' | 'Imagem' | 'XML';
export type StatusDocumento = 'Pendente' | 'Valido' | 'Alerta' | 'Duplicado';

export interface DocumentoDto {
  id: string;
  clienteId: string;
  nomeCliente: string;
  tipo: string;
  tipoNome: string;
  status: string;
  statusNome: string;
  numero: string;
  chaveAcesso?: string;
  cnpjEmitente?: string;
  nomeEmitente?: string;
  cnpjDestinatario?: string;
  nomeDestinatario?: string;
  dataEmissao: string;
  valorTotal: number;
  totalArquivos: number;
  totalAlertas: number;
  createdAt: string;
}

export interface DocumentoDownloadResponse {
  url: string;
  nomeOriginal: string;
  mimeType: string;
}

export interface UploadDocumentoRequest {
  clienteId: string;
  tipo: string;
  arquivo: File;
}
