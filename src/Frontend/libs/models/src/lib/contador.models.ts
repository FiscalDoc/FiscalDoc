export interface CobrancaDto {
  id: string;
  contadorId?: string;
  clienteId?: string;
  tipo: 'Contador' | 'Cliente';
  entidadeNome: string;
  mes: number;
  ano: number;
  totalClientes: number;
  valorPorCliente: number;
  valorBase: number;
  limiteXmlTotal: number;
  xmlsProcessados: number;
  xmlsExcedentes: number;
  valorExcedente: number;
  valorTotal: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  dataVencimento: string;
  dataPagamento?: string;
  observacao?: string;
}

export interface ContadorDto {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  crc?: string;
  empresa?: string;
  ativo: boolean;
  totalClientes: number;
  canalNotificacao: string;
  // Licenciamento
  statusLicenca: 'Ativo' | 'Bloqueado';
  motivoBloqueio?: string;
  dataLimiteAcesso?: string;
  // Plano
  valorPorCliente: number;
  limiteXmlPorCliente: number;
  valorXmlExcedente: number;
  fotoUrl?: string;
  // Cobrança do mês
  cobrancaAtual?: CobrancaDto;
  // Plano do tenant (Trial, Starter, etc.)
  plano: string;
}

export interface CreateContadorResponse {
  contador: ContadorDto;
}

export interface CreateContadorRequest {
  nome: string;
  email: string;
  telefone?: string;
  crc?: string;
  empresa?: string;
  canalNotificacao?: string;
  notifNovasNotas?: boolean;
  notifAlertas?: boolean;
  notifResumoSemanal?: boolean;
  notifConsolidadoMensal?: boolean;
}

export interface UpdateContadorRequest {
  nome: string;
  telefone?: string;
  crc?: string;
  empresa?: string;
  canalNotificacao?: string;
  notifNovasNotas?: boolean;
  notifAlertas?: boolean;
  notifResumoSemanal?: boolean;
  notifConsolidadoMensal?: boolean;
}

export interface AtualizarPlanoRequest {
  contadorId: string;
  valorPorCliente: number;
  limiteXmlPorCliente: number;
  valorXmlExcedente: number;
}

export interface GerarCobrancaRequest {
  mes: number;
  ano: number;
  diasVencimento?: number;
}

export interface AdminDashboardDto {
  totalContadores: number;
  contadoresAtivos: number;
  contadoresBloqueados: number;
  totalClientes: number;
  clientesAtivos: number;
  cobrancasPendentes: number;
  cobrancasAtrasadas: number;
  receitaMesAtual: number;
  receitaPendenteMes: number;
  topContadores: ContadorResumoDto[];
}

export interface ContadorResumoDto {
  id: string;
  nome: string;
  empresa?: string;
  totalClientes: number;
  statusLicenca: string;
  valorMensal: number;
  statusCobranca: string;
}

export interface CriarCobrancaManualRequest {
  contadorId?: string;
  clienteId?: string;
  mes: number;
  ano: number;
  valorTotal: number;
  dataVencimento: string;
  observacao?: string;
}

export interface CobrancasResumoDto {
  totalPendente: number;
  qtdPendente: number;
  totalAtrasado: number;
  qtdAtrasado: number;
  totalRecebidoMesAtual: number;
}
