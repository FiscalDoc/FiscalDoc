-- VeloXML — Inicialização do banco de dados
-- As tabelas são criadas via EF Core Migrations (Etapa 4)

\c veloxml

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Schema de auditoria (utilizado pelos audit logs)
CREATE SCHEMA IF NOT EXISTS audit;

SELECT 'VeloXML database initialized.' AS status;
