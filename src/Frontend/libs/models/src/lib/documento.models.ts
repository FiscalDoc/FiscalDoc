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
  valorBaseCalculoIcms?: number;
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

export interface DanfeEnderecoDto {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface DanfeDadosDto {
  serie?: string;
  naturezaOperacao?: string;
  protocoloAutorizacao?: string;
  dataAutorizacao?: string;
  inscricaoEstadualEmitente?: string;
  enderecoEmitente?: DanfeEnderecoDto;
  inscricaoEstadualDestinatario?: string;
  enderecoDestinatario?: DanfeEnderecoDto;
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
  danfe?: DanfeDadosDto;
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
