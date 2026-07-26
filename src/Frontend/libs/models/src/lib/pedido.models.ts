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

export interface PedidoDto {
  id: string;
  clienteId: string;
  destinatarioId: string;
  destinatarioNome: string;
  status: 'Rascunho' | 'Emitido' | 'Cancelado';
  observacoes?: string;
  valorTotal: number;
  createdAt: string;
  itens: PedidoItemDto[];
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
}

export interface UpdatePedidoRequest {
  id: string;
  destinatarioId: string;
  observacoes?: string;
  itens: PedidoItemInput[];
}
