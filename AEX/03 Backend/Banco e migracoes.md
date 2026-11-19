# Banco e migrações

[[03 Backend/Backend]] · [[03 Backend/Publicacao e moderacao]] · [[04 Infra/Docker e Caddy]]

MySQL 8.4 usa InnoDB, utf8mb4 e UTC. A primeira revisão Alembic `0001_initial` cria `users`, `occurrence_types` e `occurrences`. Ela insere os tipos alagamento, acidente, árvore caída, incêndio, deslizamento, via danificada e falta de energia. O SQL da migração foi gerado sem conexão ao banco.

O modelo separa situação, estado da moderação, origem e atualidade. A leitura pública exige aprovação e data de publicação. Por padrão, uma ocorrência ativa sem confirmação recente sai da consulta padrão após o TTL configurado, hoje 48 horas. Expiração preserva a situação anterior e o histórico. A tabela de usuários prepara autoria, e o login ainda precisa ser implementado.

## Desenvolvimento

- Defina `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` em `backend/.env` para iniciar fora do Docker. A referência SQL para criação manual está em `infra/mysql/create-database.example.sql`.
- Aplique `python -m alembic upgrade head` no ambiente Python do backend. No Compose, a API aplica a revisão antes de iniciar o Uvicorn.
- Para inserir exemplos, rode `python -m app.commands.demo --confirm-simulated` com `APP_ENV=development`. Acrescente `--remove` para remover os três exemplos. Eles são marcados como **SIMULAÇÃO**.
- Crie nova revisão para cada mudança de esquema depois que uma migração for compartilhada.

As revisões futuras devem criar sessões, evidências, contribuições, votos, auditoria, fotos, assinaturas, alertas e outbox conforme cada fluxo entrar. Validação com banco real em **BE-01** em [[00 Projeto/Pendencias e proximos passos]].
