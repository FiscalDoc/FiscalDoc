import { DocumentoImpostosDto } from './documento.models';

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
export type FinalidadeEmissao = 'Normal' | 'Complementar' | 'Ajuste' | 'Devolucao';
export type ModalidadeFrete = 'SemFrete' | 'EmitenteContaFrete' | 'DestinatarioContaFrete' | 'Terceiros';

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
  finalidadeEmissao: FinalidadeEmissao;
  modalidadeFrete: ModalidadeFrete;
  dataSaida?: string;
  formaPagamento?: FormaPagamento;
  meioPagamento?: MeioPagamento;
  informacoesComplementares?: string;
  documentoId?: string;
  documentoNumero?: string;
  documentoChaveAcesso?: string;
  documentoOrigem?: 'Manual' | 'ImportacaoEmail' | 'ApiIngest' | 'FocusNfe';
  documentoImpostos?: DocumentoImpostosDto;
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
  finalidadeEmissao?: FinalidadeEmissao;
  modalidadeFrete?: ModalidadeFrete;
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
  finalidadeEmissao?: FinalidadeEmissao;
  modalidadeFrete?: ModalidadeFrete;
  dataSaida?: string;
  formaPagamento?: FormaPagamento;
  meioPagamento?: MeioPagamento;
  informacoesComplementares?: string;
  origem?: 'manual' | 'auto';
}

export interface PedidoVizinhosDto {
  anteriorId?: string;
  anteriorNumero?: number;
  proximoId?: string;
  proximoNumero?: number;
}

export interface PedidoHistoricoDto {
  id: string;
  tipo: string;
  descricao: string;
  usuarioNome?: string;
  createdAt: string;
}

export type NfeEmissaoStatus = 'Enviada' | 'Processando' | 'Autorizada' | 'Rejeitada' | 'Erro' | 'Cancelada';

export interface NfeCampoErroDto {
  campo?: string;
  mensagem: string;
}

export interface NfeEmissaoDto {
  id: string;
  status: NfeEmissaoStatus;
  mensagemErro?: string;
  chaveAcesso?: string;
  numero?: string;
  serie?: string;
  documentoId?: string;
  createdAt: string;
  errosDetalhados?: NfeCampoErroDto[];
}
