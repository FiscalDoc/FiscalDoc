export interface AlertaDto {
  id: string;
  documentoId?: string;
  clienteId: string;
  nomeCliente: string;
  titulo: string;
  descricao: string;
  tipo: string;
  severidade: string;
  status: string;
  lidoEm?: string;
  createdAt: string;
}
