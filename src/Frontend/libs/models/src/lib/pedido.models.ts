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
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  icmsOrigem?: number;
  ibsCbsCst?: string;
  ibsCbsClassificacaoTributaria?: string;
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
  consumidorFinal: boolean;
  presencaComprador: number;
  valorFrete: number;
  valorSeguro: number;
  valorOutrasDespesas: number;
  documentoId?: string;
  documentoNumero?: string;
  documentoSerie?: string;
  documentoChaveAcesso?: string;
  documentoOrigem?: 'Manual' | 'ImportacaoEmail' | 'ApiIngest' | 'FocusNfe';
  documentoStatus?: 'Pendente' | 'Valido' | 'Alerta' | 'Duplicado' | 'Cancelado';
  documentoDataEmissao?: string;
  documentoProtocoloAutorizacao?: string;
  documentoDataAutorizacao?: string;
  documentoMotivoCancelamento?: string;
  documentoProtocoloCancelamento?: string;
  documentoDataCancelamento?: string;
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
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  icmsOrigem?: number;
  ibsCbsCst?: string;
  ibsCbsClassificacaoTributaria?: string;
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
  consumidorFinal?: boolean;
  presencaComprador?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorOutrasDespesas?: number;
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
  consumidorFinal?: boolean;
  presencaComprador?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorOutrasDespesas?: number;
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

export interface PedidosResumoDto {
  faturamentoMes: number;
  faturamentoVariacaoPercentual?: number;
  notasAutorizadasMes: number;
  notasAutorizadasVariacaoPercentual?: number;
  notasCanceladasMes: number;
  notasCanceladasVariacaoPercentual?: number;
  percentualRejeicaoMes: number;
  percentualRejeicaoVariacaoPontos?: number;
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
