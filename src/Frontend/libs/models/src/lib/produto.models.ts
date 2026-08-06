export interface ProdutoDto {
  id: string;
  clienteId: string;
  codigo: string;
  descricao: string;
  ncm?: string;
  unidade: string;
  precoUnitario: number;
  cfop?: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
  ativo: boolean;
  createdAt: string;
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  icmsOrigem?: number;
  ibsCbsCst?: string;
  ibsCbsClassificacaoTributaria?: string;
}

export interface CreateProdutoRequest {
  codigo: string;
  descricao: string;
  ncm?: string;
  unidade: string;
  precoUnitario: number;
  cfop?: string;
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

export interface UpdateProdutoRequest extends CreateProdutoRequest {
  ativo: boolean;
}
