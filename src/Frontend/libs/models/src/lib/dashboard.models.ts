export interface DashboardStatsDto {
  totalDocumentos: number;
  totalDocumentosHoje: number;
  valorTotalMes: number;
  alertasAtivos: number;
  pendenciasAtivas: number;
  totalClientes: number;
  duplicados: number;
  documentosPorMes: DocumentoPorMesDto[];
  documentosPorTipo: DocumentoPorTipoDto[];
  topClientes: TopClienteDto[];
}

export interface DocumentoPorMesDto {
  ano: number;
  mes: number;
  label: string;
  quantidade: number;
  valor: number;
}

export interface DocumentoPorTipoDto {
  tipo: string;
  quantidade: number;
  percentual: number;
}

export interface TopClienteDto {
  clienteId: string;
  nome: string;
  totalDocumentos: number;
  valorTotal: number;
}
