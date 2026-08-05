export interface RelatorioNfeItemDto {
  usuarioNome?: string;
  data: string;
  numero?: string;
  serie?: string;
  status: string;
  chaveAcesso?: string;
  valorTotal?: number;
}

export interface RelatorioNfeEmitidasDto {
  totalNotas: number;
  totalAutorizadas: number;
  totalCanceladas: number;
  valorTotal: number;
  itens: RelatorioNfeItemDto[];
}

export interface RelatorioNfePorClienteItemDto {
  clienteId: string;
  clienteNome: string;
  quantidade: number;
  totalAutorizadas: number;
  totalCanceladas: number;
  valorTotal: number;
}
