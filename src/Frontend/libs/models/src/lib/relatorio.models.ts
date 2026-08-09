export interface RelatorioNfeItemDto {
  usuarioNome?: string;
  data: string;
  numero?: string;
  serie?: string;
  status: string;
  chaveAcesso?: string;
  valorTotal?: number;
  // Só vem preenchido quando a nota tem um Pedido vinculado (dá pra saber o custo dos produtos
  // vendidos) — null quando a nota foi importada de XML externo, sem Pedido no sistema.
  lucro?: number;
}

export interface RelatorioNfeEmitidasDto {
  totalNotas: number;
  totalAutorizadas: number;
  totalCanceladas: number;
  valorTotal: number;
  lucroTotal: number;
  notasComLucroCalculado: number;
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
