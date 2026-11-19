# Docker e Caddy

[[04 Infra/Infraestrutura]] · [[04 Infra/Azure e HTTPS]] · [[03 Backend/Banco e migracoes]]

`compose.yaml` reúne `db`, `api` e `web`. MySQL recebe tráfego somente na `backend_net` interna. A API também entra na `frontend_net` para receber o proxy. Apenas o Caddy publica portas do host.

O banco verifica acesso autenticado com `SELECT 1`. A API aplica as migrações e só fica pronta quando alcança o banco com a revisão atual. O web começa após a API saudável e verifica a presença do HTML compilado. `restart: unless-stopped` mantém os serviços configurados para reiniciar. O arranque após reboot ainda é um cenário a validar.

- Backend em múltiplos estágios · Python slim instala dependências com hashes no ambiente virtual. A imagem final recebe o ambiente, o código e Alembic, executando como usuário sem privilégios de root.
- Frontend em múltiplos estágios · Node instala e compila. A imagem Caddy recebe `dist` e a configuração. A origem npm é verificada antes da instalação.
- Compose e Caddy aceitos em HTTP local e no modo HTTPS público. As imagens base estão disponíveis para Linux x64 e ARM64 e as dependências Python foram verificadas para as duas arquiteturas. O teste integrado de containers segue pendente.

## Subir em outro PC

1. Use Docker Engine ou Docker Desktop em modo Linux, com BuildKit e Compose v2.
2. Na raiz, copie `.env.example` para `.env` e preencha `DB_PASSWORD` e `DB_ROOT_PASSWORD` com senhas distintas. Deixe `DOMAIN` vazio para o modo local.
3. Execute os comandos abaixo e abra [a aplicação local](http://127.0.0.1:8080).

~~~sh
docker compose config --quiet
docker compose up --build --wait --wait-timeout 240
docker compose ps
~~~

Confira [o catálogo de ocorrências](http://127.0.0.1:8080/api/occurrence-types). A resposta deve trazer sete tipos. Caso a porta já seja usada, ajuste `WEB_HTTP_PORT`. Em falha, consulte `docker compose logs db api web`. Use `docker compose down` para encerrar preservando o banco. A opção `-v` remove os volumes e fica reservada para ambientes descartáveis.

O token Mapbox é incorporado no build. Configure `VITE_MAPBOX_TOKEN` no arquivo da raiz e repita a subida com `--build` para habilitar o mapa. [[02 Frontend/Mapa e consulta]].
