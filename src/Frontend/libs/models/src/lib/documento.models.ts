export type TipoDocumento = 'NFe' | 'CTe' | 'MDFe' | 'NFSe' | 'PDF' | 'Imagem' | 'XML';
export type StatusDocumento = 'Pendente' | 'Valido' | 'Alerta' | 'Duplicado';
export type OrigemImportacao = 'Manual' | 'ImportacaoEmail' | 'ApiIngest';

export interface DocumentoItemDto {
  codigoProduto?: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface DocumentoImpostosDto {
  valorProdutos?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorDesconto?: number;
  valorIcms?: number;
  valorIpi?: number;
  valorPis?: number;
  valorCofins?: number;
  valorOutrasDespesas?: number;
  valorAproxTributos?: number;
}

export interface DocumentoDto {
  id: string;
  clienteId: string;
  nomeCliente: string;
  tipo: string;
  tipoNome: string;
  status: string;
  statusNome: string;
  origemImportacao: string;
  origemImportacaoNome: string;
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
  impostos: DocumentoImpostosDto;
  itens: DocumentoItemDto[];
}

export interface DocumentoDownloadResponse {
  url: string;
  nomeOriginal: string;
  mimeType: string;
}

export interface UploadDocumentoRequest {
  clienteId?: string;
  tipo: string;
  arquivo: File;
}
