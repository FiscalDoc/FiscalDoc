export interface ApiError {
  code: string;
  message: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// "Anterior/Próximo" na tela de detalhe — mesmo shape pra Produto, Destinatário e
// Transportadora (o rótulo é a Descrição ou a Razão Social, dependendo da entidade).
export interface VizinhosDto {
  anteriorId?: string;
  anteriorLabel?: string;
  proximoId?: string;
  proximoLabel?: string;
  posicao: number;
  total: number;
}
