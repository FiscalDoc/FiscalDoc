export interface PedidoItemDto {
  id: string;
  produtoId: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  valorTotal: number;
  cfop?: string;
  ncm?: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
}

export type FormaPagamento = 'AVista' | 'APrazo';
export type MeioPagamento = 'Dinheiro' | 'Cartao' | 'Pix' | 'Boleto' | 'Outros';

export interface PedidoDto {
  id: string;
  numero: number;
  clienteId: string;
  destinatarioId: string;
  destinatarioNome: string;
  status: 'Rascunho' | 'Emitido' | 'Cancelado';
  observacoes?: string;
  valorTotal: number;
  createdAt: string;
  itens: PedidoItemDto[];
  naturezaOperacao: string;
  dataSaida?: string;
  formaPagamento?: FormaPagamento;
  meioPagamento?: MeioPagamento;
  informacoesComplementares?: string;
}

export interface PedidoItemInput {
  produtoId: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  cfop?: string;
  ncm?: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
}

export interface CreatePedidoRequest {
  clienteId: string;
  destinatarioId: string;
  observacoes?: string;
  itens: PedidoItemInput[];
  naturezaOperacao: string;
  dataSaida?: string;
  formaPagamento?: FormaPagamento;
  meioPagamento?: MeioPagamento;
  informacoesComplementares?: string;
}

export interface UpdatePedidoRequest {
  id: string;
  destinatarioId: string;
  observacoes?: string;
  itens: PedidoItemInput[];
  naturezaOperacao: string;
  dataSaida?: string;
  formaPagamento?: FormaPagamento;
  meioPagamento?: MeioPagamento;
  informacoesComplementares?: string;
}
