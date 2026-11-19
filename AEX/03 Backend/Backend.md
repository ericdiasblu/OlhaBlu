# Backend

[[Inicio AEX]] · [[03 Backend/Banco e migracoes]] · [[03 Backend/Publicacao e moderacao]] · [[02 Frontend/Mapa e consulta]]

FastAPI e Pydantic expõem a consulta. SQLAlchemy e PyMySQL acessam MySQL 8.4. Alembic mantém as revisões.

| Caminho no repositório | Responsabilidade |
| --- | --- |
| `backend/app/main.py` | Criação da aplicação, documentação e tradução de falhas SQL |
| `backend/app/api/routes/` | Rotas, validação HTTP e checks |
| `backend/app/schemas/` | Contratos públicos |
| `backend/app/services/` | Regras de atualidade e transformação para resposta |
| `backend/app/repositories/` | Consultas SQLAlchemy |
| `backend/app/models/` e `backend/app/db/` | Tabelas, sessão e configuração do engine |
| `backend/alembic/` | Migrações versionadas |

## Contratos que existem

| Rota | Comportamento |
| --- | --- |
| `GET /api/info` | Metadados públicos, independente do banco |
| `GET /api/occurrence-types` | Catálogo habilitado |
| `GET /api/occurrences` | Publicados e aprovados por área e filtros, com cursor e limite de até 200 |
| `GET /api/occurrences/{uuid}` | Detalhe publicado, sem expor autor ou identificadores internos de moderação |
| `GET /health/live` | Processo disponível |
| `GET /health/ready` | Banco acessível e revisão Alembic igual ao head |
| `GET /api/docs` | Documentação em desenvolvimento |

O serviço inicia sem acesso ao banco. Nesse cenário, liveness e info respondem, enquanto a consulta e a prontidão retornam 503. Esse comportamento e o proxy do Vite foram observados localmente. A consulta persistida ainda precisa rodar contra MySQL real.

## Implementação futura

Os contratos de escrita estão planejados na arquitetura v1.2. Começar por autenticação e sessões, depois evidência de localização, publicação e fila de moderação. Consultar [[03 Backend/Publicacao e moderacao]] antes de abrir qualquer rota de escrita.
