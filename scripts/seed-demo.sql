-- ============================================================
--  VeloXML – Seed de Demonstração
--  Senha de todos os contadores: Veloxml@2025
-- ============================================================

BEGIN;

-- -----------------------------------------------------------
-- 1. LIMPA DADOS EXISTENTES (preserva admin)
-- -----------------------------------------------------------
DELETE FROM alertas;
DELETE FROM arquivos;
DELETE FROM documentos;
DELETE FROM clientes;
DELETE FROM cobrancas_contador;
DELETE FROM audit_logs;
DELETE FROM refresh_tokens;
DELETE FROM configuracoes;
DELETE FROM contadores;
DELETE FROM users          WHERE perfil <> 'Administrador';

-- -----------------------------------------------------------
-- 2. VARIÁVEIS FIXAS
-- -----------------------------------------------------------
-- Tenant do admin (único tenant do sistema)
-- tenant_id = 3be959ef-0faf-448b-a36c-5eda439971da

-- Contadores IDs
-- c1 = Maria Fernanda Contabilidade
-- c2 = Carlos Alberto & Associados
-- c3 = Gestão Fiscal Nordeste

-- ============================================================
-- 3. CONTADORES
-- ============================================================

INSERT INTO contadores (
  id, nome, email, telefone, crc, empresa, ativo,
  notif_novas_notas, notif_alertas, notif_resumo_semanal, notif_consolidado_mensal,
  canal_notificacao, tenant_id, created_at, updated_at,
  limite_xml_por_cliente, status_licenca, valor_por_cliente, valor_xml_excedente
) VALUES
-- Contador 1 – ativo, plano Professional
(
  'a1000000-0000-0000-0000-000000000001',
  'Maria Fernanda Rodrigues',
  'maria.fernanda@mfcontabil.com.br',
  '(11) 99812-3456',
  'CRC-SP 123456/O-1',
  'MF Contabilidade & Consultoria',
  true, true, true, true, true, 'ambos',
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - INTERVAL '8 months', NOW() - INTERVAL '2 days',
  200, 0, 149.90, 1.50
),
-- Contador 2 – ativo, plano Starter, cobrança atrasada
(
  'a2000000-0000-0000-0000-000000000002',
  'Carlos Alberto Mendes',
  'carlos.alberto@cacontadores.com.br',
  '(21) 98734-5678',
  'CRC-RJ 456789/O-3',
  'Carlos Alberto & Associados',
  true, true, true, false, false, 'email',
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - INTERVAL '5 months', NOW() - INTERVAL '10 days',
  100, 0, 99.90, 1.00
),
-- Contador 3 – ativo, plano Enterprise
(
  'a3000000-0000-0000-0000-000000000003',
  'João Paulo Cavalcante',
  'joao.paulo@gestaofiscal.com.br',
  '(85) 98812-9900',
  'CRC-CE 789012/O-7',
  'Gestão Fiscal Nordeste Ltda',
  true, true, true, true, true, 'ambos',
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - INTERVAL '12 months', NOW() - INTERVAL '1 day',
  500, 0, 249.90, 2.00
);

-- ============================================================
-- 4. USUÁRIOS DOS CONTADORES  (senha: Veloxml@2025)
-- ============================================================

INSERT INTO users (
  id, nome, email, password_hash, perfil, ativo, contador_id,
  tenant_id, created_at
) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'Maria Fernanda Rodrigues',
  'maria.fernanda@mfcontabil.com.br',
  '$2b$11$VZJNm2AHnS5lHGa2NMTfWeX2fRd5QuQx9cjMggXEmXhTh0vBcJf7C',
  'Contador', true,
  'a1000000-0000-0000-0000-000000000001',
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - INTERVAL '8 months'
),
(
  'b2000000-0000-0000-0000-000000000002',
  'Carlos Alberto Mendes',
  'carlos.alberto@cacontadores.com.br',
  '$2b$11$8U.fQVlrQycjtyJ3cFSC4.K./1nSFnCJnhD4Fu1ebywCRQEKYCoiC',
  'Contador', true,
  'a2000000-0000-0000-0000-000000000002',
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - INTERVAL '5 months'
),
(
  'b3000000-0000-0000-0000-000000000003',
  'João Paulo Cavalcante',
  'joao.paulo@gestaofiscal.com.br',
  '$2b$11$AdaLwPq1IYhOptBcNXhjM.SX5tfk3ddFzJ38By5Ys6gAEmOqr.zGe',
  'Contador', true,
  'a3000000-0000-0000-0000-000000000003',
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - INTERVAL '12 months'
);

-- ============================================================
-- 5. CLIENTES
-- ============================================================

INSERT INTO clientes (
  id, razao_social, nome_fantasia, cnpj, email, telefone,
  endereco, cidade, estado, ativo, contador_id,
  tenant_id, created_at, app_key
) VALUES
-- Clientes de Maria Fernanda (c1)
('c1010000-0000-0000-0000-000000000001', 'Supermercados Paulista S.A.', 'SuperPaula', '12345678000191', 'fiscal@superpaulista.com.br', '(11) 3211-4400', 'Av. Paulista, 1000, São Paulo', 'São Paulo', 'SP', true, 'a1000000-0000-0000-0000-000000000001', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '7 months', md5(random()::text)),
('c1020000-0000-0000-0000-000000000002', 'Construtora Horizonte Ltda', 'Horizonte Obras', '23456789000182', 'contabil@horizonteobras.com.br', '(11) 4321-5500', 'Rua dos Construtores, 450, Santo André', 'Santo André', 'SP', true, 'a1000000-0000-0000-0000-000000000001', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '6 months', md5(random()::text)),
('c1030000-0000-0000-0000-000000000003', 'Distribuidora Alimentos Norte Ltda', 'AlimNorte', '34567890000173', 'fiscal@alimnorte.com.br', '(11) 5432-6600', 'Rua das Indústrias, 200, Guarulhos', 'Guarulhos', 'SP', true, 'a1000000-0000-0000-0000-000000000001', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '6 months', md5(random()::text)),
('c1040000-0000-0000-0000-000000000004', 'Tech Solutions do Brasil Ltda', 'TechSol', '45678901000164', 'fiscal@techsol.com.br', '(11) 2234-7700', 'Rua da Tecnologia, 88, Campinas', 'Campinas', 'SP', true, 'a1000000-0000-0000-0000-000000000001', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '5 months', md5(random()::text)),
('c1050000-0000-0000-0000-000000000005', 'Farmácia Popular Saúde & Vida Ltda', 'Saúde & Vida', '56789012000155', 'contabil@saudaevida.com.br', '(11) 9988-3300', 'Av. das Farmácias, 55, Osasco', 'Osasco', 'SP', true, 'a1000000-0000-0000-0000-000000000001', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '4 months', md5(random()::text)),
('c1060000-0000-0000-0000-000000000006', 'Transporte Rápido SP Eireli', 'Rápido SP', '67890123000146', 'fiscal@rapidosp.com.br', '(11) 8877-2200', 'Rua dos Transportes, 99, Mauá', 'Mauá', 'SP', true, 'a1000000-0000-0000-0000-000000000001', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '3 months', md5(random()::text)),

-- Clientes de Carlos Alberto (c2)
('c2010000-0000-0000-0000-000000000001', 'Hotel Maravilha Rio Ltda', 'Hotel Maravilha', '78901234000137', 'fiscal@hotelmaravilhario.com.br', '(21) 2211-3300', 'Av. Atlântica, 500, Copacabana', 'Rio de Janeiro', 'RJ', true, 'a2000000-0000-0000-0000-000000000002', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '4 months', md5(random()::text)),
('c2020000-0000-0000-0000-000000000002', 'Restaurante Sabor Carioca Ltda', 'Sabor Carioca', '89012345000128', 'contabil@saborcarioca.com.br', '(21) 3322-4400', 'Rua da Praia, 200, Ipanema', 'Rio de Janeiro', 'RJ', true, 'a2000000-0000-0000-0000-000000000002', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '4 months', md5(random()::text)),
('c2030000-0000-0000-0000-000000000003', 'Loja Virtual Moda Carioca S.A.', 'Moda Carioca', '90123456000119', 'fiscal@modacarioca.com.br', '(21) 4433-5500', 'Rua da Moda, 300, Barra da Tijuca', 'Rio de Janeiro', 'RJ', true, 'a2000000-0000-0000-0000-000000000002', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '3 months', md5(random()::text)),
('c2040000-0000-0000-0000-000000000004', 'Clinica Médica Saúde Total Ltda', 'Saúde Total', '01234567000100', 'fiscal@saudetotal.com.br', '(21) 5544-6600', 'Rua da Saúde, 10, Botafogo', 'Rio de Janeiro', 'RJ', true, 'a2000000-0000-0000-0000-000000000002', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '2 months', md5(random()::text)),
('c2050000-0000-0000-0000-000000000005', 'Construtora Belvedere RJ S.A.', 'Belvedere', '11234567000191', 'contabil@belvedereri.com.br', '(21) 6655-7700', 'Av. das Construções, 88, Niterói', 'Niterói', 'RJ', true, 'a2000000-0000-0000-0000-000000000002', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '3 months', md5(random()::text)),

-- Clientes de João Paulo (c3)
('c3010000-0000-0000-0000-000000000001', 'Indústria de Calçados Nordeste Ltda', 'CalçaNorte', '21234567000182', 'fiscal@calcasnordeste.com.br', '(85) 3211-4400', 'Rua do Couro, 100, Fortaleza', 'Fortaleza', 'CE', true, 'a3000000-0000-0000-0000-000000000003', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '10 months', md5(random()::text)),
('c3020000-0000-0000-0000-000000000002', 'Agropecuária Sertão Verde Ltda', 'Sertão Verde', '31234567000173', 'contabil@sertaoverde.com.br', '(88) 3412-5500', 'Fazenda Boa Vista km 10, Juazeiro do Norte', 'Juazeiro do Norte', 'CE', true, 'a3000000-0000-0000-0000-000000000003', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '10 months', md5(random()::text)),
('c3030000-0000-0000-0000-000000000003', 'Distribuidora de Combustíveis Nordeste Eireli', 'CombNorte', '41234567000164', 'fiscal@combnorte.com.br', '(85) 4321-6600', 'Rod. BR-116 km 30, Caucaia', 'Caucaia', 'CE', true, 'a3000000-0000-0000-0000-000000000003', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '9 months', md5(random()::text)),
('c3040000-0000-0000-0000-000000000004', 'Supermercado Fortaleza Ltda', 'Super Fortaleza', '51234567000155', 'fiscal@superfortaleza.com.br', '(85) 5432-7700', 'Av. Washington Soares, 800, Fortaleza', 'Fortaleza', 'CE', true, 'a3000000-0000-0000-0000-000000000003', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '8 months', md5(random()::text)),
('c3050000-0000-0000-0000-000000000005', 'Exportadora Frutas do Nordeste S.A.', 'FrutaNorte', '61234567000146', 'contabil@frutanorte.com.br', '(85) 6543-8800', 'Porto de Mucuripe s/n, Fortaleza', 'Fortaleza', 'CE', true, 'a3000000-0000-0000-0000-000000000003', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '7 months', md5(random()::text)),
('c3060000-0000-0000-0000-000000000006', 'Construtora Litoral Cearense Ltda', 'Litoral Obras', '71234567000137', 'fiscal@litoralobras.com.br', '(85) 7654-9900', 'Av. Beira Mar, 1500, Fortaleza', 'Fortaleza', 'CE', true, 'a3000000-0000-0000-0000-000000000003', '3be959ef-0faf-448b-a36c-5eda439971da', NOW() - INTERVAL '6 months', md5(random()::text));

-- ============================================================
-- 6. DOCUMENTOS  (spread nos últimos 6 meses)
-- ============================================================
-- Usamos uma função auxiliar local para gerar chave de acesso aleatória
CREATE OR REPLACE FUNCTION rand_chave() RETURNS text AS $$
  SELECT substring(md5(random()::text) || md5(random()::text), 1, 44);
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION rand_num_nfe() RETURNS text AS $$
  SELECT lpad((floor(random() * 999999 + 1))::text, 9, '0');
$$ LANGUAGE sql;

-- ---- CLIENTE c1010000 – SuperPaula – NF-e pesado (supermercado)
INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT
  gen_random_uuid(),
  'c1010000-0000-0000-0000-000000000001',
  CASE (i % 3)
    WHEN 0 THEN 'NFe'
    WHEN 1 THEN 'NFe'
    ELSE 'CTe'
  END,
  CASE (i % 10)
    WHEN 9 THEN 'Alerta'
    WHEN 8 THEN 'Cancelado'
    ELSE 'Valido'
  END,
  rand_num_nfe(),
  rand_chave(),
  '33445566000188',
  'Fornecedora Atacado SP S.A.',
  '12345678000191',
  'Supermercados Paulista S.A.',
  NOW() - (random() * INTERVAL '180 days'),
  (1000 + random() * 49000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 45) AS s(i);

-- ---- CLIENTE c1020000 – Horizonte Obras – NF-e + CT-e
INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT
  gen_random_uuid(),
  'c1020000-0000-0000-0000-000000000002',
  CASE (i % 4) WHEN 0 THEN 'CTe' WHEN 1 THEN 'NFe' WHEN 2 THEN 'NFe' ELSE 'MDFe' END,
  CASE (i % 8) WHEN 7 THEN 'Alerta' WHEN 6 THEN 'Pendente' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '44556677000177', 'Materiais Construção Brasil Ltda',
  '23456789000182', 'Construtora Horizonte Ltda',
  NOW() - (random() * INTERVAL '180 days'),
  (5000 + random() * 95000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 32) AS s(i);

-- ---- CLIENTE c1030000 – AlimNorte – NF-e distribuição
INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT
  gen_random_uuid(),
  'c1030000-0000-0000-0000-000000000003',
  CASE (i % 5) WHEN 0 THEN 'CTe' WHEN 1 THEN 'MDFe' ELSE 'NFe' END,
  CASE (i % 7) WHEN 6 THEN 'Duplicado' WHEN 5 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '55667788000166', 'Indústria Alimentícia Central Ltda',
  '34567890000173', 'Distribuidora Alimentos Norte Ltda',
  NOW() - (random() * INTERVAL '180 days'),
  (2000 + random() * 28000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 38) AS s(i);

-- ---- CLIENTE c1040000 – TechSol – NFS-e serviços de TI
INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT
  gen_random_uuid(),
  'c1040000-0000-0000-0000-000000000004',
  CASE (i % 3) WHEN 0 THEN 'NFSe' WHEN 1 THEN 'NFSe' ELSE 'NFe' END,
  CASE (i % 6) WHEN 5 THEN 'Pendente' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '45678901000164', 'Tech Solutions do Brasil Ltda',
  '66778899000155', 'Cliente Tech Diverso S.A.',
  NOW() - (random() * INTERVAL '180 days'),
  (3000 + random() * 47000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 28) AS s(i);

-- ---- CLIENTE c1050000 – Saúde & Vida – NFS-e farmácia
INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT
  gen_random_uuid(),
  'c1050000-0000-0000-0000-000000000005',
  CASE (i % 2) WHEN 0 THEN 'NFe' ELSE 'NFSe' END,
  CASE (i % 9) WHEN 8 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '77889900000144', 'Laboratório Farmacêutico Nacional Ltda',
  '56789012000155', 'Farmácia Popular Saúde & Vida Ltda',
  NOW() - (random() * INTERVAL '180 days'),
  (500 + random() * 9500)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 22) AS s(i);

-- ---- CLIENTE c1060000 – Rápido SP – CT-e transporte
INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT
  gen_random_uuid(),
  'c1060000-0000-0000-0000-000000000006',
  CASE (i % 4) WHEN 0 THEN 'MDFe' WHEN 1 THEN 'CTe' WHEN 2 THEN 'CTe' ELSE 'NFe' END,
  CASE (i % 7) WHEN 6 THEN 'Alerta' WHEN 5 THEN 'Pendente' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '67890123000146', 'Transporte Rápido SP Eireli',
  '88990011000133', 'Contratante Logística Brasil Ltda',
  NOW() - (random() * INTERVAL '180 days'),
  (800 + random() * 12000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 30) AS s(i);

-- ---- CLIENTES DE CARLOS ALBERTO (c2) ----

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c2010000-0000-0000-0000-000000000001',
  CASE (i % 3) WHEN 0 THEN 'NFe' WHEN 1 THEN 'NFSe' ELSE 'NFe' END,
  CASE (i % 6) WHEN 5 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '78901234000137', 'Hotel Maravilha Rio Ltda',
  '99001122000122', 'Agência de Viagens Brasil Tour Ltda',
  NOW() - (random() * INTERVAL '150 days'),
  (2000 + random() * 38000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '150 days')
FROM generate_series(1, 25) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c2020000-0000-0000-0000-000000000002',
  CASE (i % 2) WHEN 0 THEN 'NFe' ELSE 'NFSe' END,
  CASE (i % 5) WHEN 4 THEN 'Pendente' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '89012345000128', 'Restaurante Sabor Carioca Ltda',
  '00112233000111', 'Distribuidora Bebidas RJ Ltda',
  NOW() - (random() * INTERVAL '150 days'),
  (500 + random() * 8000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '150 days')
FROM generate_series(1, 18) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c2030000-0000-0000-0000-000000000003',
  'NFe',
  CASE (i % 7) WHEN 6 THEN 'Duplicado' WHEN 5 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '90123456000119', 'Loja Virtual Moda Carioca S.A.',
  '11223344000100', 'Transportadora Flash RJ Eireli',
  NOW() - (random() * INTERVAL '150 days'),
  (300 + random() * 7000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '150 days')
FROM generate_series(1, 20) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c2040000-0000-0000-0000-000000000004',
  CASE (i % 2) WHEN 0 THEN 'NFSe' ELSE 'NFe' END,
  'Valido',
  rand_num_nfe(), rand_chave(),
  '01234567000100', 'Clinica Médica Saúde Total Ltda',
  '22334455000189', 'Operadora de Saúde BemEstar Ltda',
  NOW() - (random() * INTERVAL '60 days'),
  (1500 + random() * 18500)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '60 days')
FROM generate_series(1, 15) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c2050000-0000-0000-0000-000000000005',
  CASE (i % 3) WHEN 0 THEN 'CTe' WHEN 1 THEN 'NFe' ELSE 'MDFe' END,
  CASE (i % 8) WHEN 7 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '11234567000191', 'Construtora Belvedere RJ S.A.',
  '33445566000188', 'Fornecedor Materiais RJ Ltda',
  NOW() - (random() * INTERVAL '90 days'),
  (8000 + random() * 92000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '90 days')
FROM generate_series(1, 22) AS s(i);

-- ---- CLIENTES DE JOÃO PAULO (c3) ----

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c3010000-0000-0000-0000-000000000001',
  CASE (i % 3) WHEN 0 THEN 'NFe' WHEN 1 THEN 'NFe' ELSE 'CTe' END,
  CASE (i % 10) WHEN 9 THEN 'Alerta' WHEN 8 THEN 'Cancelado' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '21234567000182', 'Indústria de Calçados Nordeste Ltda',
  '44556677000177', 'Varejista Moda Nordeste S.A.',
  NOW() - (random() * INTERVAL '300 days'),
  (1200 + random() * 38000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '300 days')
FROM generate_series(1, 55) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c3020000-0000-0000-0000-000000000002',
  CASE (i % 4) WHEN 0 THEN 'NFe' WHEN 1 THEN 'NFe' WHEN 2 THEN 'CTe' ELSE 'MDFe' END,
  CASE (i % 8) WHEN 7 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '31234567000173', 'Agropecuária Sertão Verde Ltda',
  '55667788000166', 'Cooperativa Grãos do Nordeste',
  NOW() - (random() * INTERVAL '300 days'),
  (5000 + random() * 145000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '300 days')
FROM generate_series(1, 48) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c3030000-0000-0000-0000-000000000003',
  CASE (i % 3) WHEN 0 THEN 'NFe' WHEN 1 THEN 'CTe' ELSE 'MDFe' END,
  CASE (i % 6) WHEN 5 THEN 'Pendente' WHEN 4 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '41234567000164', 'Distribuidora de Combustíveis Nordeste Eireli',
  '66778899000155', 'Petrobras Distribuidora S.A.',
  NOW() - (random() * INTERVAL '270 days'),
  (10000 + random() * 190000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '270 days')
FROM generate_series(1, 42) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c3040000-0000-0000-0000-000000000004',
  CASE (i % 3) WHEN 0 THEN 'CTe' WHEN 1 THEN 'NFe' ELSE 'NFe' END,
  CASE (i % 9) WHEN 8 THEN 'Alerta' WHEN 7 THEN 'Duplicado' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '51234567000155', 'Supermercado Fortaleza Ltda',
  '77889900000144', 'Distribuidora Nordeste Alimentos Ltda',
  NOW() - (random() * INTERVAL '240 days'),
  (3000 + random() * 57000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '240 days')
FROM generate_series(1, 50) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c3050000-0000-0000-0000-000000000005',
  CASE (i % 2) WHEN 0 THEN 'NFe' ELSE 'CTe' END,
  CASE (i % 5) WHEN 4 THEN 'Alerta' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '61234567000146', 'Exportadora Frutas do Nordeste S.A.',
  '88990011000133', 'Importadora Internacional Ltda',
  NOW() - (random() * INTERVAL '210 days'),
  (15000 + random() * 185000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '210 days')
FROM generate_series(1, 36) AS s(i);

INSERT INTO documentos (id, cliente_id, tipo, status, numero, chave_acesso, cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total, tenant_id, created_at)
SELECT gen_random_uuid(),
  'c3060000-0000-0000-0000-000000000006',
  CASE (i % 4) WHEN 0 THEN 'NFe' WHEN 1 THEN 'CTe' WHEN 2 THEN 'MDFe' ELSE 'NFe' END,
  CASE (i % 7) WHEN 6 THEN 'Alerta' WHEN 5 THEN 'Pendente' ELSE 'Valido' END,
  rand_num_nfe(), rand_chave(),
  '71234567000137', 'Construtora Litoral Cearense Ltda',
  '99001122000122', 'Fornecedor Insumos Construção CE Ltda',
  NOW() - (random() * INTERVAL '180 days'),
  (7000 + random() * 143000)::numeric(18,2),
  '3be959ef-0faf-448b-a36c-5eda439971da',
  NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 40) AS s(i);

-- ============================================================
-- 7. COBRANÇAS DOS CONTADORES
-- ============================================================

INSERT INTO cobrancas_contador (
  id, contador_id, mes, ano,
  total_clientes, valor_por_cliente, valor_base,
  limite_xml_total, xmls_processados, xmls_excedentes, valor_excedente,
  valor_total, status, data_vencimento, data_pagamento, observacao,
  tenant_id, created_at
) VALUES
-- === Maria Fernanda – meses pagos ===
('e1010000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1, 2025, 4, 149.90, 599.60, 800, 312, 0, 0.00, 599.60, 1, '2025-02-05', '2025-02-03', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-01-31'),
('e1010000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 2, 2025, 5, 149.90, 749.50, 1000, 421, 0, 0.00, 749.50, 1, '2025-03-05', '2025-03-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-02-28'),
('e1010000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 3, 2025, 5, 149.90, 749.50, 1000, 498, 0, 0.00, 749.50, 1, '2025-04-05', '2025-04-03', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-03-31'),
('e1010000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 4, 2025, 6, 149.90, 899.40, 1200, 583, 0, 0.00, 899.40, 1, '2025-05-05', '2025-05-05', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-04-30'),
('e1010000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 5, 2025, 6, 149.90, 899.40, 1200, 647, 0, 0.00, 899.40, 1, '2025-06-05', '2025-06-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-05-31'),
('e1010000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 6, 2025, 6, 149.90, 899.40, 1200, 712, 112, 168.00, 1067.40, 1, '2025-07-05', '2025-07-04', 'Excedeu limite de XMLs em 112 unidades', '3be959ef-0faf-448b-a36c-5eda439971da', '2025-06-30'),
-- Mês atual pendente
('e1010000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 7, 2025, 6, 149.90, 899.40, 1200, 389, 0, 0.00, 899.40, 0, '2025-08-05', NULL, NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-07-31'),

-- === Carlos Alberto – meses pagos + cobrança ATRASADA ===
('e2010000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 3, 2025, 3, 99.90, 299.70, 300, 178, 0, 0.00, 299.70, 1, '2025-04-05', '2025-04-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-03-31'),
('e2010000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 4, 2025, 4, 99.90, 399.60, 400, 223, 0, 0.00, 399.60, 1, '2025-05-05', '2025-05-06', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-04-30'),
('e2010000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 5, 2025, 5, 99.90, 499.50, 500, 287, 0, 0.00, 499.50, 1, '2025-06-05', '2025-06-03', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-05-31'),
-- Junho ATRASADO
('e2010000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 6, 2025, 5, 99.90, 499.50, 500, 301, 1, 1.00, 500.50, 2, '2025-07-05', NULL, 'Aguardando regularização junto ao cliente', '3be959ef-0faf-448b-a36c-5eda439971da', '2025-06-30'),
-- Julho ATRASADO
('e2010000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 7, 2025, 5, 99.90, 499.50, 500, 198, 0, 0.00, 499.50, 2, '2025-08-05', NULL, NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-07-31'),

-- === João Paulo – histórico longo, ativo ===
('e3010000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 7, 2024, 3, 249.90, 749.70, 1500, 621, 0, 0.00, 749.70, 1, '2024-08-05', '2024-08-02', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2024-07-31'),
('e3010000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 8, 2024, 4, 249.90, 999.60, 2000, 812, 0, 0.00, 999.60, 1, '2024-09-05', '2024-09-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2024-08-31'),
('e3010000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 9, 2024, 5, 249.90, 1249.50, 2500, 1087, 0, 0.00, 1249.50, 1, '2024-10-05', '2024-10-03', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2024-09-30'),
('e3010000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003', 10, 2024, 6, 249.90, 1499.40, 3000, 1342, 0, 0.00, 1499.40, 1, '2024-11-05', '2024-11-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2024-10-31'),
('e3010000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000003', 11, 2024, 6, 249.90, 1499.40, 3000, 1589, 0, 0.00, 1499.40, 1, '2024-12-05', '2024-12-03', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2024-11-30'),
('e3010000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003', 12, 2024, 6, 249.90, 1499.40, 3000, 1723, 223, 446.00, 1945.40, 1, '2025-01-05', '2025-01-04', 'Dezembro: volume excedente de XMLs', '3be959ef-0faf-448b-a36c-5eda439971da', '2024-12-31'),
('e3010000-0000-0000-0000-000000000007', 'a3000000-0000-0000-0000-000000000003', 1, 2025, 6, 249.90, 1499.40, 3000, 1456, 0, 0.00, 1499.40, 1, '2025-02-05', '2025-02-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-01-31'),
('e3010000-0000-0000-0000-000000000008', 'a3000000-0000-0000-0000-000000000003', 2, 2025, 6, 249.90, 1499.40, 3000, 1398, 0, 0.00, 1499.40, 1, '2025-03-05', '2025-03-03', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-02-28'),
('e3010000-0000-0000-0000-000000000009', 'a3000000-0000-0000-0000-000000000003', 3, 2025, 6, 249.90, 1499.40, 3000, 1512, 0, 0.00, 1499.40, 1, '2025-04-05', '2025-04-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-03-31'),
('e3010000-0000-0000-0000-000000000010', 'a3000000-0000-0000-0000-000000000003', 4, 2025, 6, 249.90, 1499.40, 3000, 1634, 0, 0.00, 1499.40, 1, '2025-05-05', '2025-05-03', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-04-30'),
('e3010000-0000-0000-0000-000000000011', 'a3000000-0000-0000-0000-000000000003', 5, 2025, 6, 249.90, 1499.40, 3000, 1789, 0, 0.00, 1499.40, 1, '2025-06-05', '2025-06-04', NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-05-31'),
('e3010000-0000-0000-0000-000000000012', 'a3000000-0000-0000-0000-000000000003', 6, 2025, 6, 249.90, 1499.40, 3000, 1823, 323, 646.00, 2145.40, 1, '2025-07-05', '2025-07-04', 'Junho: volume excedente alto', '3be959ef-0faf-448b-a36c-5eda439971da', '2025-06-30'),
('e3010000-0000-0000-0000-000000000013', 'a3000000-0000-0000-0000-000000000003', 7, 2025, 6, 249.90, 1499.40, 3000, 892, 0, 0.00, 1499.40, 0, '2025-08-05', NULL, NULL, '3be959ef-0faf-448b-a36c-5eda439971da', '2025-07-31');

-- ============================================================
-- 8. ALERTAS
-- ============================================================

INSERT INTO alertas (id, documento_id, cliente_id, titulo, descricao, tipo, severidade, status, tenant_id, created_at)
SELECT
  gen_random_uuid(),
  d.id,
  d.cliente_id,
  CASE d.status
    WHEN 'Alerta'    THEN 'Documento com inconsistência'
    WHEN 'Duplicado' THEN 'Documento possivelmente duplicado'
    WHEN 'Cancelado' THEN 'Documento cancelado detectado'
    ELSE 'Aviso de documento'
  END,
  CASE d.status
    WHEN 'Alerta'    THEN 'O documento ' || d.numero || ' apresenta divergência nos valores ou dados cadastrais. Verifique com o emitente.'
    WHEN 'Duplicado' THEN 'O documento ' || d.numero || ' possui chave de acesso similar a outro já recebido. Confirme se é realmente duplicado.'
    WHEN 'Cancelado' THEN 'O documento ' || d.numero || ' foi cancelado pelo emitente. Verifique se há nova versão emitida.'
    ELSE 'Verificação pendente no documento ' || d.numero
  END,
  CASE d.status
    WHEN 'Alerta'    THEN 'inconsistencia'
    WHEN 'Duplicado' THEN 'duplicidade'
    WHEN 'Cancelado' THEN 'cancelamento'
    ELSE 'aviso'
  END,
  CASE d.status
    WHEN 'Duplicado' THEN 'alta'
    WHEN 'Cancelado' THEN 'alta'
    WHEN 'Alerta'    THEN 'media'
    ELSE 'info'
  END,
  'Ativo',
  '3be959ef-0faf-448b-a36c-5eda439971da',
  d.created_at + INTERVAL '5 minutes'
FROM documentos d
WHERE d.status IN ('Alerta', 'Duplicado', 'Cancelado')
  AND d.tenant_id = '3be959ef-0faf-448b-a36c-5eda439971da';

-- ============================================================
-- 9. REMOVE FUNÇÕES AUXILIARES
-- ============================================================
DROP FUNCTION IF EXISTS rand_chave();
DROP FUNCTION IF EXISTS rand_num_nfe();

COMMIT;

-- ============================================================
-- RESUMO DOS DADOS CRIADOS
-- ============================================================
SELECT '=== CONTADORES ===' AS info;
SELECT nome, email FROM contadores ORDER BY nome;

SELECT '=== CLIENTES POR CONTADOR ===' AS info;
SELECT ct.nome AS contador, count(cl.id) AS total_clientes
FROM contadores ct
LEFT JOIN clientes cl ON cl.contador_id = ct.id
GROUP BY ct.nome ORDER BY ct.nome;

SELECT '=== DOCUMENTOS POR CLIENTE ===' AS info;
SELECT cl.razao_social, count(d.id) AS docs, round(sum(d.valor_total)) AS valor_total
FROM clientes cl
LEFT JOIN documentos d ON d.cliente_id = cl.id
GROUP BY cl.razao_social
ORDER BY docs DESC;

SELECT '=== COBRANÇAS ===' AS info;
SELECT ct.nome, cc.mes, cc.ano,
  CASE cc.status WHEN 0 THEN 'Pendente' WHEN 1 THEN 'Pago' WHEN 2 THEN 'ATRASADO' END AS status,
  cc.valor_total
FROM cobrancas_contador cc
JOIN contadores ct ON ct.id = cc.contador_id
ORDER BY ct.nome, cc.ano, cc.mes;

SELECT '=== ALERTAS ===' AS info;
SELECT count(*) AS total_alertas FROM alertas;
