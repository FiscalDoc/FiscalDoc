export type StatusContaReceber = 'Pendente' | 'Atrasado' | 'Pago' | 'Cancelado';

export interface ContaReceberDto {
  id: string;
  clienteId: string;
  destinatarioId: string;
  destinatarioNome: string;
  pedidoId?: string;
  pedidoNumero?: number;
  descricao: string;
  valorTotal: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusContaReceber;
  formaPagamento?: string;
  observacao?: string;
  createdAt: string;
}

export interface CreateContaReceberRequest {
  destinatarioId: string;
  pedidoId?: string;
  descricao: string;
  valorTotal: number;
  dataVencimento: string;
  observacao?: string;
}

export interface UpdateContaReceberRequest extends CreateContaReceberRequest {}

export interface DarBaixaContaReceberRequest {
  dataPagamento?: string;
  formaPagamento?: string;
}

export interface ContaReceberResumoDto {
  totalPendente: number;
  totalAtrasado: number;
  totalPagoNoMes: number;
  qtdPendente: number;
  qtdAtrasado: number;
}
