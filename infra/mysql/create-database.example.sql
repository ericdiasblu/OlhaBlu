-- Referência para um MySQL 8.4 LOCAL já instalado.
-- Execute como administrador depois de substituir a senha abaixo.
-- Não executar automaticamente e não usar esta senha de exemplo.
CREATE DATABASE IF NOT EXISTS ocorrencias
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER 'ocorrencias'@'127.0.0.1'
  IDENTIFIED BY 'SUBSTITUA_POR_UMA_SENHA_LOCAL';

GRANT ALL PRIVILEGES ON ocorrencias.* TO 'ocorrencias'@'127.0.0.1';
