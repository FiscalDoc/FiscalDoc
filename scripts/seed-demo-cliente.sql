-- ============================================================
--  VeloXML — Seed de Demonstração Comercial (Cliente único)
-- ------------------------------------------------------------
--  Cria UM cliente fictício completo, navegável no perfil Cliente
--  (dashboard, pedidos/NF-e, cadastros, financeiro), com dados
--  100% fictícios espalhados de 01/05 do ano corrente até hoje.
--
--  NÃO apaga nem altera nenhum outro dado do banco — só insere
--  (ou substitui, se já existir) este cliente isolado, então é
--  seguro rodar em cima de uma base que já tem outros dados/seeds.
--  Rodar de novo recria os dados deste cliente do zero (idempotente).
--
--  Login de demonstração:
--    e-mail: demo@veloxml.com.br
--    senha:  Demo@2026
--
--  Cliente sem certificado digital nem Focus NFe configurado de
--  propósito — os pedidos "Emitido" já vêm com Documento/NF-e
--  fictício vinculado direto no banco, sem passar pelo emissor
--  real (SEFAZ), então não é possível (nem necessário) tentar
--  emitir de verdade a partir desses dados na demo.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION rand_chave44() RETURNS text AS $$
  SELECT
    lpad((floor(random()*9999999999))::bigint::text, 10, '0') ||
    lpad((floor(random()*9999999999))::bigint::text, 10, '0') ||
    lpad((floor(random()*9999999999))::bigint::text, 10, '0') ||
    lpad((floor(random()*9999999999))::bigint::text, 10, '0') ||
    lpad((floor(random()*9999))::int::text, 4, '0');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION rand_num_doc() RETURNS text AS $$
  SELECT lpad((floor(random() * 999999 + 1))::text, 9, '0');
$$ LANGUAGE sql;

BEGIN;

DO $$
DECLARE
  v_tenant_id      uuid;
  v_cliente_id     uuid := 'd0f00000-0000-0000-0000-000000000001';
  v_user_id        uuid := 'd0f00000-0000-0000-0000-000000000002';
  v_cliente_estado text := 'SP';

  v_data_inicio    timestamptz;
  v_data_fim       timestamptz := now();

  v_qtd_pedidos    int := 130;
  v_qtd_avulsas    int := 15;

  v_dest_id        uuid;
  v_dest_nome      varchar;
  v_dest_doc       varchar;
  v_dest_estado    varchar;

  v_pedido_id      uuid;
  v_pedido_numero  int;
  v_documento_id   uuid;
  v_data           timestamptz;
  v_total          numeric(18,2);
  v_qtd_itens      int;
  v_rand           numeric;
  v_bucket         text;
  v_doc_status     varchar;
  v_cfop           varchar;

  v_cr_status      int;
  v_cr_venc        timestamptz;
  v_cr_pgto        timestamptz;
  v_cr_forma       varchar;
  v_cr_desc        varchar;

  v_forma_pagto    varchar;
  v_meio_pagto     varchar;

  i int;
  j int;
BEGIN
  -- --------------------------------------------------------
  -- 0. Tenant (instalação single-tenant — pega o do admin)
  -- --------------------------------------------------------
  SELECT tenant_id INTO v_tenant_id FROM users WHERE perfil = 'Administrador' ORDER BY created_at LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário Administrador encontrado — rode o boot da aplicação (AppSeeder) antes deste script.';
  END IF;

  v_data_inicio := make_date(extract(year from current_date)::int, 5, 1)::timestamptz;

  -- --------------------------------------------------------
  -- 1. Limpeza idempotente (só toca nos dados deste cliente demo)
  -- --------------------------------------------------------
  DELETE FROM alertas WHERE cliente_id = v_cliente_id;
  DELETE FROM contas_receber WHERE cliente_id = v_cliente_id;
  DELETE FROM pedidos WHERE cliente_id = v_cliente_id;
  DELETE FROM documentos WHERE cliente_id = v_cliente_id;
  DELETE FROM produtos WHERE cliente_id = v_cliente_id;
  DELETE FROM destinatarios WHERE cliente_id = v_cliente_id;
  DELETE FROM transportadoras WHERE cliente_id = v_cliente_id;
  DELETE FROM users WHERE cliente_id = v_cliente_id;
  DELETE FROM clientes WHERE id = v_cliente_id;

  -- --------------------------------------------------------
  -- 2. CLIENTE + USUÁRIO DE LOGIN
  -- --------------------------------------------------------
  INSERT INTO clientes (
    id, tenant_id, created_at, razao_social, nome_fantasia, cnpj, email, telefone,
    logradouro, numero, complemento, bairro, cidade, estado, cep,
    ativo, app_key, contador_id, regime_tributario, inscricao_estadual, serie_nfe, nfe_habilitado
  ) VALUES (
    v_cliente_id, v_tenant_id, v_data_inicio, 'Sabor & Grãos Distribuidora de Alimentos Ltda', 'Sabor & Grãos',
    '12345678000195', 'contato@saboregraos.com.br', '(11) 4002-8922',
    'Av. das Nações, 1200', '1200', 'Galpão 4', 'Vila Leopoldina', 'São Paulo', 'SP', '05311000',
    true, md5(random()::text), NULL, 'Simples Nacional', '110042490114', '1', false
  );

  INSERT INTO users (
    id, tenant_id, created_at, nome, email, password_hash, perfil, ativo, senha_definida, cliente_id
  ) VALUES (
    v_user_id, v_tenant_id, now(), 'Usuário Demonstração', 'demo@veloxml.com.br',
    crypt('Demo@2026', gen_salt('bf', 11)), 'Cliente', true, true, v_cliente_id
  );

  -- --------------------------------------------------------
  -- 3. PRODUTOS (distribuição de alimentos)
  -- --------------------------------------------------------
  CREATE TEMP TABLE tmp_produtos (
    id uuid, descricao varchar, unidade varchar, preco_unitario numeric,
    ncm varchar, cst_icms varchar, cst_pis varchar, cst_cofins varchar,
    aliquota_icms numeric, aliquota_pis numeric, aliquota_cofins numeric
  ) ON COMMIT DROP;

  INSERT INTO produtos (
    id, tenant_id, created_at, cliente_id, codigo, descricao, ncm, unidade, preco_unitario, cfop,
    aliquota_icms, aliquota_pis, aliquota_cofins, cst_icms, cst_pis, cst_cofins,
    aliquota_ipi, icms_origem, valor_custo, percentual_imposto, ativo
  )
  SELECT gen_random_uuid(), v_tenant_id, v_data_inicio, v_cliente_id, p.codigo, p.descricao, p.ncm, p.unidade, p.preco,
    '5102', 18.00, 1.65, 7.60, '00', '01', '01', 0, 0, round(p.preco * 0.62, 2), 0, true
  FROM (VALUES
    ('PROD001', 'Arroz Branco Tipo 1 5kg',        'PC', 24.90, '10063021'),
    ('PROD002', 'Feijão Carioca 1kg',             'PC', 7.50,  '07133399'),
    ('PROD003', 'Açúcar Refinado 5kg',            'PC', 19.90, '17019900'),
    ('PROD004', 'Óleo de Soja 900ml',             'UN', 8.20,  '15079011'),
    ('PROD005', 'Café Torrado e Moído 500g',      'PC', 14.50, '09012110'),
    ('PROD006', 'Leite Integral UHT 1L',          'UN', 5.30,  '04012000'),
    ('PROD007', 'Farinha de Trigo 5kg',           'PC', 22.00, '11010010'),
    ('PROD008', 'Macarrão Espaguete 500g',        'PC', 4.80,  '19021900'),
    ('PROD009', 'Molho de Tomate 340g',           'UN', 3.20,  '20029000'),
    ('PROD010', 'Refrigerante Cola 2L',           'UN', 8.90,  '22021000'),
    ('PROD011', 'Água Mineral 1,5L (fardo c/6)',  'FD', 12.00, '22011000'),
    ('PROD012', 'Sabão em Pó 1kg',                'PC', 15.90, '34022090'),
    ('PROD013', 'Detergente Líquido 500ml',       'UN', 2.50,  '34022090'),
    ('PROD014', 'Papel Higiênico 12 rolos',       'PC', 21.90, '48181000'),
    ('PROD015', 'Biscoito Recheado 130g',         'UN', 3.10,  '19053100'),
    ('PROD016', 'Extrato de Tomate 340g',         'UN', 3.80,  '20029000')
  ) AS p(codigo, descricao, unidade, preco, ncm);

  INSERT INTO tmp_produtos (id, descricao, unidade, preco_unitario, ncm, cst_icms, cst_pis, cst_cofins, aliquota_icms, aliquota_pis, aliquota_cofins)
  SELECT id, descricao, unidade, preco_unitario, ncm, cst_icms, cst_pis, cst_cofins, aliquota_icms, aliquota_pis, aliquota_cofins
  FROM produtos WHERE cliente_id = v_cliente_id;

  -- --------------------------------------------------------
  -- 4. DESTINATÁRIOS (clientes finais da distribuidora)
  -- --------------------------------------------------------
  CREATE TEMP TABLE tmp_destinatarios (id uuid, razao_social varchar, cpf_cnpj varchar, estado varchar) ON COMMIT DROP;

  INSERT INTO destinatarios (id, tenant_id, created_at, cliente_id, razao_social, cpf_cnpj, email, telefone, cidade, estado, ativo)
  SELECT gen_random_uuid(), v_tenant_id, v_data_inicio + (random() * interval '20 days'), v_cliente_id,
    d.nome, d.doc, lower(replace(d.nome, ' ', '.')) || '@exemplo.com.br', '(11) 9' || lpad((floor(random()*99999999))::text, 8, '0'),
    d.cidade, d.uf, true
  FROM (VALUES
    ('Mercearia Bom Preço Ltda',           '23456789000102', 'São Paulo', 'SP'),
    ('Padaria Pão Dourado Ltda',           '34567890000113', 'São Paulo', 'SP'),
    ('Restaurante Sabor Caseiro Ltda',     '45678901000124', 'Osasco', 'SP'),
    ('Mercadinho da Esquina Ltda',         '56789012000135', 'Guarulhos', 'SP'),
    ('Distribuidora Center Sul Alimentos', '67890123000146', 'Santo André', 'SP'),
    ('Lanchonete Point do Sabor Ltda',     '78901234000157', 'Rio de Janeiro', 'RJ'),
    ('Restaurante Cantina Italiana Ltda',  '89012345000168', 'Niterói', 'RJ'),
    ('Mercado Nova Era Ltda',              '90123456000179', 'Duque de Caxias', 'RJ'),
    ('Padaria e Confeitaria Doce Vida',    '01234567000180', 'Belo Horizonte', 'MG'),
    ('Mercearia São José Ltda',            '11234567000101', 'Contagem', 'MG'),
    ('Restaurante Fazenda Grill Ltda',     '21234567000112', 'Uberlândia', 'MG'),
    ('Empório Sabores do Sul Ltda',        '31234567000123', 'Porto Alegre', 'RS'),
    ('Supermercado Vale Verde Ltda',       '41234567000134', 'Caxias do Sul', 'RS'),
    ('Mercadinho Popular Ltda',            '51234567000145', 'Curitiba', 'PR'),
    ('Restaurante Cantina do Chef Ltda',   '61234567000156', 'Londrina', 'PR'),
    ('Padaria Trigo Dourado Ltda',         '71234567000167', 'Florianópolis', 'SC'),
    ('Mercearia Boa Vista Ltda',           '81234567000178', 'Joinville', 'SC'),
    ('Distribuidora Nordeste Alimentos',   '91234567000189', 'Salvador', 'BA'),
    ('Restaurante Sabor Baiano Ltda',      '02234567000190', 'Feira de Santana', 'BA'),
    ('Ana Paula Ribeiro',                  '12345678901',    'São Paulo', 'SP'),
    ('Carlos Eduardo Souza',               '23456789012',    'São Paulo', 'SP'),
    ('Juliana Martins Costa',              '34567890123',    'Rio de Janeiro', 'RJ')
  ) AS d(nome, doc, cidade, uf);

  INSERT INTO tmp_destinatarios (id, razao_social, cpf_cnpj, estado)
  SELECT id, razao_social, cpf_cnpj, estado FROM destinatarios WHERE cliente_id = v_cliente_id;

  -- --------------------------------------------------------
  -- 5. TRANSPORTADORAS
  -- --------------------------------------------------------
  INSERT INTO transportadoras (id, tenant_id, created_at, cliente_id, razao_social, cpf_cnpj, telefone, cidade, estado, ativo)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_data_inicio, v_cliente_id, 'Transportes Rápido Norte Ltda', '13579246000110', '(11) 3344-5566', 'Guarulhos', 'SP', true),
    (gen_random_uuid(), v_tenant_id, v_data_inicio, v_cliente_id, 'LogExpress Transportes Ltda',   '24681357000121', '(11) 4455-6677', 'Osasco', 'SP', true),
    (gen_random_uuid(), v_tenant_id, v_data_inicio, v_cliente_id, 'Rodoviário Sul Cargas Ltda',     '35792468000132', '(41) 5566-7788', 'Curitiba', 'PR', true);

  -- --------------------------------------------------------
  -- 6. PEDIDOS + ITENS + DOCUMENTOS (NF-e) + CONTAS A RECEBER
  -- --------------------------------------------------------
  CREATE TEMP TABLE tmp_item_buffer (
    produto_id uuid, descricao varchar, unidade varchar, quantidade numeric,
    preco_unitario numeric, valor_total numeric, ncm varchar, cfop varchar,
    cst_icms varchar, cst_pis varchar, cst_cofins varchar,
    aliquota_icms numeric, aliquota_pis numeric, aliquota_cofins numeric
  ) ON COMMIT DROP;

  FOR i IN 1..v_qtd_pedidos LOOP
    -- destinatário aleatório
    SELECT id, razao_social, cpf_cnpj, estado INTO v_dest_id, v_dest_nome, v_dest_doc, v_dest_estado
    FROM tmp_destinatarios ORDER BY random() LIMIT 1;

    v_cfop := CASE WHEN v_dest_estado = v_cliente_estado THEN '5102' ELSE '6102' END;

    -- data de emissão espalhada em todo o período (maio -> hoje)
    v_data := v_data_inicio + (random() * (v_data_fim - v_data_inicio));

    -- decide o "destino" do pedido
    v_rand := random();
    IF v_rand < 0.83 THEN
      v_bucket := 'emitido';
    ELSIF v_rand < 0.93 THEN
      v_bucket := 'rascunho';
      v_data := now() - (random() * interval '15 days'); -- rascunhos são recentes
    ELSE
      v_bucket := 'cancelado';
    END IF;

    -- monta de 1 a 4 itens
    TRUNCATE tmp_item_buffer;
    v_qtd_itens := 1 + floor(random() * 4)::int;
    FOR j IN 1..v_qtd_itens LOOP
      INSERT INTO tmp_item_buffer (produto_id, descricao, unidade, quantidade, preco_unitario, valor_total, ncm, cfop, cst_icms, cst_pis, cst_cofins, aliquota_icms, aliquota_pis, aliquota_cofins)
      SELECT id, descricao, unidade, qtd, preco_unitario, round(qtd * preco_unitario, 2), ncm, v_cfop, cst_icms, cst_pis, cst_cofins, aliquota_icms, aliquota_pis, aliquota_cofins
      FROM (
        SELECT *, (1 + floor(random() * 15))::numeric AS qtd
        FROM tmp_produtos ORDER BY random() LIMIT 1
      ) t;
    END LOOP;

    SELECT sum(valor_total) INTO v_total FROM tmp_item_buffer;

    v_forma_pagto := (ARRAY['AVista', 'APrazo'])[1 + floor(random() * 2)::int];
    v_meio_pagto := (ARRAY['Pix', 'Cartao', 'Boleto', 'Dinheiro'])[1 + floor(random() * 4)::int];

    v_documento_id := NULL;

    IF v_bucket = 'emitido' THEN
      v_doc_status := CASE WHEN random() < 0.90 THEN 'Valido' ELSE 'Alerta' END;
      v_documento_id := gen_random_uuid();

      INSERT INTO documentos (
        id, tenant_id, created_at, cliente_id, tipo, status, origem_importacao, numero, chave_acesso,
        cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total,
        valor_produtos, valor_desconto, valor_frete, valor_seguro, valor_outras_despesas,
        valor_base_calculo_icms, valor_icms, valor_ipi, valor_pis, valor_cofins, valor_aprox_tributos
      ) VALUES (
        v_documento_id, v_tenant_id, v_data, v_cliente_id, 'NFe', v_doc_status, 'FocusNfe', rand_num_doc(), rand_chave44(),
        '12345678000195', 'Sabor & Grãos Distribuidora de Alimentos Ltda', v_dest_doc, v_dest_nome, v_data, v_total,
        v_total, 0, 0, 0, 0,
        v_total, round(v_total * 0.18, 2), 0, round(v_total * 0.0165, 2), round(v_total * 0.076, 2),
        round(v_total * (0.18 + 0.0165 + 0.076), 2)
      );

      INSERT INTO pedidos (
        id, tenant_id, created_at, cliente_id, destinatario_id, status, valor_total,
        natureza_operacao, finalidade_emissao, modalidade_frete, forma_pagamento, meio_pagamento,
        documento_id, consumidor_final, presenca_comprador, valor_frete, valor_seguro, valor_outras_despesas
      ) VALUES (
        gen_random_uuid(), v_tenant_id, v_data, v_cliente_id, v_dest_id, 'Emitido', v_total,
        'Venda de mercadoria', 'Normal', 'SemFrete', v_forma_pagto, v_meio_pagto,
        v_documento_id, true, 9, 0, 0, 0
      ) RETURNING id, numero INTO v_pedido_id, v_pedido_numero;

    ELSIF v_bucket = 'rascunho' THEN
      INSERT INTO pedidos (
        id, tenant_id, created_at, cliente_id, destinatario_id, status, valor_total,
        natureza_operacao, finalidade_emissao, modalidade_frete, forma_pagamento, meio_pagamento,
        consumidor_final, presenca_comprador, valor_frete, valor_seguro, valor_outras_despesas
      ) VALUES (
        gen_random_uuid(), v_tenant_id, v_data, v_cliente_id, v_dest_id, 'Rascunho', v_total,
        'Venda de mercadoria', 'Normal', 'SemFrete', v_forma_pagto, v_meio_pagto,
        true, 9, 0, 0, 0
      ) RETURNING id, numero INTO v_pedido_id, v_pedido_numero;

    ELSE -- cancelado
      IF random() < 0.5 THEN
        v_documento_id := gen_random_uuid();
        INSERT INTO documentos (
          id, tenant_id, created_at, cliente_id, tipo, status, origem_importacao, numero, chave_acesso,
          cnpj_emitente, nome_emitente, cnpj_destinatario, nome_destinatario, data_emissao, valor_total,
          motivo_cancelamento, data_cancelamento, protocolo_cancelamento
        ) VALUES (
          v_documento_id, v_tenant_id, v_data, v_cliente_id, 'NFe', 'Cancelado', 'FocusNfe', rand_num_doc(), rand_chave44(),
          '12345678000195', 'Sabor & Grãos Distribuidora de Alimentos Ltda', v_dest_doc, v_dest_nome, v_data, v_total,
          'Cancelado a pedido do cliente', v_data + interval '2 hours', lpad((floor(random()*999999999999999))::text, 15, '0')
        );
      END IF;

      INSERT INTO pedidos (
        id, tenant_id, created_at, cliente_id, destinatario_id, status, valor_total,
        natureza_operacao, finalidade_emissao, modalidade_frete, forma_pagamento, meio_pagamento,
        documento_id, consumidor_final, presenca_comprador, valor_frete, valor_seguro, valor_outras_despesas
      ) VALUES (
        gen_random_uuid(), v_tenant_id, v_data, v_cliente_id, v_dest_id, 'Cancelado', v_total,
        'Venda de mercadoria', 'Normal', 'SemFrete', v_forma_pagto, v_meio_pagto,
        v_documento_id, true, 9, 0, 0, 0
      ) RETURNING id, numero INTO v_pedido_id, v_pedido_numero;
    END IF;

    INSERT INTO pedido_itens (
      id, tenant_id, created_at, pedido_id, produto_id, descricao, unidade, quantidade, preco_unitario,
      desconto, valor_total, cfop, ncm, aliquota_icms, aliquota_pis, aliquota_cofins, cst_icms, cst_pis, cst_cofins,
      aliquota_ipi, icms_origem
    )
    SELECT gen_random_uuid(), v_tenant_id, v_data, v_pedido_id, produto_id, descricao, unidade, quantidade, preco_unitario,
      0, valor_total, cfop, ncm, aliquota_icms, aliquota_pis, aliquota_cofins, cst_icms, cst_pis, cst_cofins,
      0, 0
    FROM tmp_item_buffer;

    -- conta a receber, pra pedidos efetivamente emitidos (Válido ou Alerta)
    IF v_bucket = 'emitido' AND random() < 0.70 THEN
      v_cr_venc := v_data + interval '30 days';
      v_cr_pgto := NULL;
      v_cr_forma := NULL;

      IF v_cr_venc < now() THEN
        IF random() < 0.75 THEN
          v_cr_status := 1; -- Pago
          v_cr_pgto := v_cr_venc - (floor(random() * 6))::int * interval '1 day';
          v_cr_forma := (ARRAY['Pix', 'Boleto', 'Cartão', 'Dinheiro'])[1 + floor(random() * 4)::int];
        ELSE
          v_cr_status := 0; -- Pendente vencido = "Atrasado" (calculado na listagem)
        END IF;
      ELSE
        v_cr_status := 0; -- Pendente, ainda a vencer
      END IF;

      IF random() < 0.04 THEN
        v_cr_status := 2; -- Cancelado
        v_cr_pgto := NULL;
      END IF;

      INSERT INTO contas_receber (
        id, tenant_id, created_at, cliente_id, destinatario_id, pedido_id, descricao,
        valor_total, data_vencimento, data_pagamento, status, forma_pagamento
      ) VALUES (
        gen_random_uuid(), v_tenant_id, v_data, v_cliente_id, v_dest_id, v_pedido_id,
        'Venda de mercadorias - Pedido nº ' || v_pedido_numero,
        v_total, v_cr_venc, v_cr_pgto, v_cr_status, v_cr_forma
      );
    END IF;
  END LOOP;

  -- --------------------------------------------------------
  -- 7. CONTAS A RECEBER AVULSAS (sem pedido vinculado)
  -- --------------------------------------------------------
  FOR i IN 1..v_qtd_avulsas LOOP
    SELECT id INTO v_dest_id FROM tmp_destinatarios ORDER BY random() LIMIT 1;
    v_data := v_data_inicio + (random() * (v_data_fim - v_data_inicio));
    v_cr_venc := v_data + ((5 + floor(random() * 40)))::int * interval '1 day';
    v_cr_desc := (ARRAY[
      'Fatura avulsa - reposição de estoque',
      'Serviço de entrega expressa',
      'Acerto de conta anterior',
      'Venda balcão sem pedido formal',
      'Taxa de entrega especial'
    ])[1 + floor(random() * 5)::int];

    v_cr_pgto := NULL;
    v_cr_forma := NULL;
    IF v_cr_venc < now() THEN
      IF random() < 0.7 THEN
        v_cr_status := 1;
        v_cr_pgto := v_cr_venc - (floor(random() * 6))::int * interval '1 day';
        v_cr_forma := (ARRAY['Pix', 'Boleto', 'Cartão', 'Dinheiro'])[1 + floor(random() * 4)::int];
      ELSE
        v_cr_status := 0;
      END IF;
    ELSE
      v_cr_status := 0;
    END IF;

    INSERT INTO contas_receber (
      id, tenant_id, created_at, cliente_id, destinatario_id, descricao,
      valor_total, data_vencimento, data_pagamento, status, forma_pagamento
    ) VALUES (
      gen_random_uuid(), v_tenant_id, v_data, v_cliente_id, v_dest_id, v_cr_desc,
      round((150 + random() * 2850)::numeric, 2), v_cr_venc, v_cr_pgto, v_cr_status, v_cr_forma
    );
  END LOOP;

  -- --------------------------------------------------------
  -- 8. ALERTAS (a partir dos documentos problemáticos deste cliente)
  -- --------------------------------------------------------
  INSERT INTO alertas (id, documento_id, cliente_id, titulo, descricao, tipo, severidade, status, tenant_id, created_at)
  SELECT
    gen_random_uuid(), d.id, d.cliente_id,
    CASE d.status WHEN 'Alerta' THEN 'Documento com inconsistência' ELSE 'Documento cancelado detectado' END,
    CASE d.status
      WHEN 'Alerta' THEN 'O documento ' || d.numero || ' apresenta divergência nos valores ou dados cadastrais. Verifique com o emitente.'
      ELSE 'O documento ' || d.numero || ' foi cancelado. Verifique se há nova versão emitida.'
    END,
    CASE d.status WHEN 'Alerta' THEN 'inconsistencia' ELSE 'cancelamento' END,
    CASE d.status WHEN 'Alerta' THEN 'media' ELSE 'alta' END,
    'Ativo', v_tenant_id, d.created_at + interval '5 minutes'
  FROM documentos d
  WHERE d.cliente_id = v_cliente_id AND d.status IN ('Alerta', 'Cancelado');

END $$;

COMMIT;

DROP FUNCTION IF EXISTS rand_chave44();
DROP FUNCTION IF EXISTS rand_num_doc();

-- ============================================================
-- RESUMO
-- ============================================================
SELECT '=== CLIENTE DEMO ===' AS info;
SELECT razao_social, cnpj, nfe_habilitado FROM clientes WHERE id = 'd0f00000-0000-0000-0000-000000000001';

SELECT '=== LOGIN ===' AS info;
SELECT email, perfil FROM users WHERE id = 'd0f00000-0000-0000-0000-000000000002';

SELECT '=== CADASTROS ===' AS info;
SELECT
  (SELECT count(*) FROM produtos WHERE cliente_id = 'd0f00000-0000-0000-0000-000000000001') AS produtos,
  (SELECT count(*) FROM destinatarios WHERE cliente_id = 'd0f00000-0000-0000-0000-000000000001') AS destinatarios,
  (SELECT count(*) FROM transportadoras WHERE cliente_id = 'd0f00000-0000-0000-0000-000000000001') AS transportadoras;

SELECT '=== PEDIDOS POR STATUS ===' AS info;
SELECT status, count(*) AS qtd, round(sum(valor_total)) AS valor_total
FROM pedidos WHERE cliente_id = 'd0f00000-0000-0000-0000-000000000001'
GROUP BY status ORDER BY status;

SELECT '=== DOCUMENTOS (NF-e) POR STATUS ===' AS info;
SELECT status, count(*) AS qtd, round(sum(valor_total)) AS valor_total
FROM documentos WHERE cliente_id = 'd0f00000-0000-0000-0000-000000000001'
GROUP BY status ORDER BY status;

SELECT '=== CONTAS A RECEBER POR STATUS ===' AS info;
SELECT
  CASE status WHEN 0 THEN 'Pendente/Atrasado' WHEN 1 THEN 'Pago' WHEN 2 THEN 'Cancelado' END AS status,
  count(*) AS qtd, round(sum(valor_total)) AS valor_total
FROM contas_receber WHERE cliente_id = 'd0f00000-0000-0000-0000-000000000001'
GROUP BY status ORDER BY status;

SELECT '=== ALERTAS ===' AS info;
SELECT count(*) AS total_alertas FROM alertas WHERE cliente_id = 'd0f00000-0000-0000-0000-000000000001';
