export interface LogDto {
  id: string;
  tabela: string;
  operacao: string;
  registroId?: string;
  valoresAntigos?: string;
  valoresNovos?: string;
  userId?: string;
  ipAddress?: string;
  criadoEm: string;
}
