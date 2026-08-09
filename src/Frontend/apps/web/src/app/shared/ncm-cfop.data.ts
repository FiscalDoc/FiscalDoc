export interface CodigoFiscalSugestao {
  codigo: string;
  descricao: string;
}

// CFOPs mais usados por pequenas/médias empresas ao emitir NF-e de venda — cobre a imensa
// maioria dos casos (venda direta, devolução, bonificação, conserto, demonstração, consignação,
// exportação e prestação de serviço tributado por ISS). Grupo 5 = operação dentro do mesmo
// estado do emitente; grupo 6 = operação para outro estado; grupo 7 = exportação. Não é a tabela
// oficial completa (que tem centenas de códigos) — é um atalho de busca, não substitui conferência
// com o contador em operações fora do comum (transferência entre filiais, ativo imobilizado, etc.).
export const CFOP_COMUNS: CodigoFiscalSugestao[] = [
  { codigo: '5101', descricao: 'Venda de produção do estabelecimento (dentro do estado)' },
  { codigo: '6101', descricao: 'Venda de produção do estabelecimento (fora do estado)' },
  { codigo: '5102', descricao: 'Venda de mercadoria adquirida de terceiros (dentro do estado)' },
  { codigo: '6102', descricao: 'Venda de mercadoria adquirida de terceiros (fora do estado)' },
  { codigo: '5116', descricao: 'Venda de produção própria, encomenda para entrega futura (dentro do estado)' },
  { codigo: '6116', descricao: 'Venda de produção própria, encomenda para entrega futura (fora do estado)' },
  { codigo: '5117', descricao: 'Venda de mercadoria de terceiros, encomenda para entrega futura (dentro do estado)' },
  { codigo: '6117', descricao: 'Venda de mercadoria de terceiros, encomenda para entrega futura (fora do estado)' },
  { codigo: '5401', descricao: 'Venda de produção própria sujeita a substituição tributária (dentro do estado)' },
  { codigo: '6401', descricao: 'Venda de produção própria sujeita a substituição tributária (fora do estado)' },
  { codigo: '5403', descricao: 'Venda de mercadoria de terceiros sujeita a substituição tributária (dentro do estado)' },
  { codigo: '6403', descricao: 'Venda de mercadoria de terceiros sujeita a substituição tributária (fora do estado)' },
  { codigo: '5405', descricao: 'Venda de mercadoria sujeita a ST, na condição de contribuinte substituído (dentro do estado)' },
  { codigo: '6405', descricao: 'Venda de mercadoria sujeita a ST, na condição de contribuinte substituído (fora do estado)' },
  { codigo: '5551', descricao: 'Venda de bem do ativo imobilizado (dentro do estado)' },
  { codigo: '6551', descricao: 'Venda de bem do ativo imobilizado (fora do estado)' },
  { codigo: '5910', descricao: 'Remessa em bonificação, doação ou brinde (dentro do estado)' },
  { codigo: '6910', descricao: 'Remessa em bonificação, doação ou brinde (fora do estado)' },
  { codigo: '5911', descricao: 'Remessa de amostra grátis (dentro do estado)' },
  { codigo: '6911', descricao: 'Remessa de amostra grátis (fora do estado)' },
  { codigo: '5912', descricao: 'Remessa de mercadoria ou bem para demonstração (dentro do estado)' },
  { codigo: '6912', descricao: 'Remessa de mercadoria ou bem para demonstração (fora do estado)' },
  { codigo: '5915', descricao: 'Remessa de mercadoria ou bem para conserto ou reparo (dentro do estado)' },
  { codigo: '6915', descricao: 'Remessa de mercadoria ou bem para conserto ou reparo (fora do estado)' },
  { codigo: '5916', descricao: 'Retorno de mercadoria ou bem recebido para conserto ou reparo (dentro do estado)' },
  { codigo: '6916', descricao: 'Retorno de mercadoria ou bem recebido para conserto ou reparo (fora do estado)' },
  { codigo: '5917', descricao: 'Remessa de mercadoria em consignação (dentro do estado)' },
  { codigo: '6917', descricao: 'Remessa de mercadoria em consignação (fora do estado)' },
  { codigo: '5918', descricao: 'Devolução de mercadoria recebida em consignação (dentro do estado)' },
  { codigo: '6918', descricao: 'Devolução de mercadoria recebida em consignação (fora do estado)' },
  { codigo: '5201', descricao: 'Devolução de compra para industrialização ou produção rural (dentro do estado)' },
  { codigo: '6201', descricao: 'Devolução de compra para industrialização ou produção rural (fora do estado)' },
  { codigo: '5202', descricao: 'Devolução de compra para comercialização (dentro do estado)' },
  { codigo: '6202', descricao: 'Devolução de compra para comercialização (fora do estado)' },
  { codigo: '5933', descricao: 'Prestação de serviço tributado pelo ISSQN (dentro do estado)' },
  { codigo: '6933', descricao: 'Prestação de serviço tributado pelo ISSQN (fora do estado)' },
  { codigo: '5949', descricao: 'Outra saída de mercadoria ou prestação de serviço não especificado (dentro do estado)' },
  { codigo: '6949', descricao: 'Outra saída de mercadoria ou prestação de serviço não especificado (fora do estado)' },
  { codigo: '7101', descricao: 'Venda de produção do estabelecimento, destinada ao exterior (exportação)' },
  { codigo: '7102', descricao: 'Venda de mercadoria adquirida de terceiros, destinada ao exterior (exportação)' },
];

// NCMs de produtos comuns, pra ajudar quem não sabe o código de cabeça a começar a busca —
// NÃO é a tabela TIPI completa (são mais de 10 mil códigos) e a classificação correta depende
// das características técnicas exatas do produto. Trate como ponto de partida, não como
// resposta pronta: confirme sempre com o contador antes de emitir a primeira nota com um NCM novo.
export const NCM_COMUNS: CodigoFiscalSugestao[] = [
  { codigo: '8517.12.31', descricao: 'Telefones celulares (smartphones)' },
  { codigo: '8471.30.19', descricao: 'Computadores portáteis (notebooks)' },
  { codigo: '8471.41.90', descricao: 'Computadores de mesa (desktops)' },
  { codigo: '8528.72.00', descricao: 'Televisores' },
  { codigo: '8518.30.00', descricao: 'Fones de ouvido' },
  { codigo: '8544.42.00', descricao: 'Cabos elétricos com conectores' },
  { codigo: '9403.30.00', descricao: 'Móveis de madeira para escritório' },
  { codigo: '9401.30.00', descricao: 'Cadeiras giratórias de altura ajustável' },
  { codigo: '6109.10.00', descricao: 'Camisetas de algodão' },
  { codigo: '6203.42.00', descricao: 'Calças de algodão masculinas' },
  { codigo: '6403.99.00', descricao: 'Calçados em geral' },
  { codigo: '2202.10.00', descricao: 'Águas e refrigerantes' },
  { codigo: '1902.19.00', descricao: 'Massas alimentícias' },
  { codigo: '0901.21.00', descricao: 'Café torrado' },
  { codigo: '3401.11.90', descricao: 'Sabonetes' },
  { codigo: '3402.20.00', descricao: 'Detergentes e produtos de limpeza' },
  { codigo: '3305.10.00', descricao: 'Xampus' },
  { codigo: '4820.10.00', descricao: 'Cadernos e agendas' },
  { codigo: '4901.99.00', descricao: 'Livros' },
  { codigo: '9608.10.00', descricao: 'Canetas esferográficas' },
  { codigo: '3304.99.90', descricao: 'Cremes e cosméticos em geral' },
  { codigo: '3303.00.20', descricao: 'Perfumes e águas de colônia' },
  { codigo: '8205.59.00', descricao: 'Ferramentas manuais diversas' },
  { codigo: '8467.21.00', descricao: 'Furadeiras elétricas' },
  { codigo: '3917.23.00', descricao: 'Tubos e conexões de PVC' },
  { codigo: '9503.00.99', descricao: 'Brinquedos em geral' },
  { codigo: '3004.90.99', descricao: 'Medicamentos diversos' },
  { codigo: '8708.99.90', descricao: 'Partes e acessórios de veículos automóveis' },
  { codigo: '4202.92.00', descricao: 'Bolsas, mochilas e estojos' },
  { codigo: '3926.90.90', descricao: 'Artigos diversos de plástico' },
];
