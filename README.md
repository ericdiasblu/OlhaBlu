# AEX | Ocorrências urbanas

O estado do projeto, as pendências, as decisões e o histórico ficam no vault Obsidian em `AEX/`. Comece pela [central do projeto](AEX/Inicio%20AEX.md).

Base da aplicação web colaborativa de Blumenau. O objetivo desta entrega é iniciar o desenvolvimento com uma aplicação executável e camadas organizadas. A referência principal é `docs/final/Documento_de_Arquitetura_Ocorrencias_Urbanas.md`, versão 1.2. Os sete PDFs de pesquisa foram considerados; decisões técnicas antigas de aplicativo móvel e rotas cedem à arquitetura final web.

## O que esta base entrega

- React + Vite + TypeScript, Tailwind e componentes no padrão shadcn/ui.
- Tela responsiva de consulta, filtros, estados de carregamento/erro/vazio e detalhes na lista.
- Mapbox GL JS integrado, habilitado ao configurar um token público. Sem token, a lista continua utilizável e o mapa informa sua indisponibilidade.
- FastAPI com módulos de API, schemas, serviços, repositórios, modelos e configuração.
- SQLAlchemy + PyMySQL para MySQL 8.4, Alembic e primeira migração com usuários, tipos e ocorrências.
- Consulta pública real do banco: catálogo, listagem por área e detalhes publicados. Sem endpoints de escrita nesta etapa.
- Atualização da área consultada a cada 15 segundos com a aba visível e rede disponível. Os marcadores são substituídos pelo conjunto atual.
- Dockerfiles com múltiplos estágios, Compose e Caddy para iniciar a aplicação completa em containers.
- Dependências fixadas em `frontend/package-lock.json` e `backend/requirements.txt`, este último com hashes.

## Iniciar localmente, sem Docker

Requisitos: Node.js 22.12+ (referência fixada em 24.4.0), npm e Python 3.13 (referência 3.13.5). Os comandos abaixo são executados na raiz `AEX`, em PowerShell. Não é necessário ativar scripts PowerShell de ambientes virtuais.

Na primeira instalação:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install --require-hashes -r backend/requirements.txt
node frontend/scripts/check-npm-sources.mjs
npm --prefix frontend ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Copie os exemplos somente na primeira vez, preservando seus arquivos `.env` existentes. Neste workspace as dependências já foram instaladas durante a preparação da base.

Inicie frontend e API no mesmo terminal:

```powershell
npm run dev
```

Abra [a aplicação local](http://127.0.0.1:5173) e [a documentação da API](http://127.0.0.1:8000/api/docs). Encerre com `Ctrl+C`. Para iniciar separadamente, use `npm run dev:web` e `npm run dev:api` em dois terminais.

No Linux/macOS, substitua `backend/.venv/Scripts/python.exe` por `backend/.venv/bin/python` e `Copy-Item` por `cp`. O comando `npm run dev` reconhece automaticamente o caminho do ambiente virtual.

### Conectar o MySQL

A interface e a API iniciam sem banco configurado. A consulta de ocorrências retorna HTTP 503 nessa condição e a interface mostra uma mensagem recuperável; isso não é tratado como uma lista vazia. `/api/info`, `/health/live` e a documentação continuam disponíveis.

Para habilitar a consulta persistida, use uma instalação local de MySQL 8.4 ou um servidor de desenvolvimento já disponível. `infra/mysql/create-database.example.sql` contém uma referência para criação manual do banco e usuário local, com senha a substituir. Preencha `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` em `backend/.env`.

Em seguida, na raiz do projeto:

```powershell
Set-Location backend
.venv/Scripts/python.exe -m alembic upgrade head
Set-Location ..
npm run dev
```

A migração cria somente o esquema e os sete tipos de ocorrências. Não cria contas com senha padrão nem relatos fictícios. O backend não usa `create_all()` na inicialização e não tenta aplicar migrações silenciosamente no desenvolvimento local.

### Habilitar o mapa

Preencha `VITE_MAPBOX_TOKEN` em `frontend/.env` com um token público Mapbox permitido para o domínio local e reinicie o Vite. O mapa abre em Blumenau, permite pan/zoom e sincroniza a área visível com a listagem. O controle de localização pede permissão somente ao ser acionado e não envia nem armazena a posição na API.

A home usa **Mapbox Standard** no tema monocromático. Para o mapa interativo, crie um token público dedicado com os escopos `styles:read` e `fonts:read`. Para produção, restrinja o token aos domínios em que a aplicação será publicada. Use um token público separado para desenvolvimento local. A integração atual usa apenas leitura e dispensa token secreto. Caso uma futura automação de servidor precise escrever estilos ou publicar dados, mantenha o token secreto fora de qualquer variável `VITE_*` e conceda somente os escopos da operação. [Documentação de tokens do Mapbox](https://docs.mapbox.com/accounts/guides/tokens/)

Em produção, o token é um argumento de build, pois variáveis `VITE_*` são incorporadas ao JavaScript. Não coloque credenciais privadas nessas variáveis. O build não exige um token para compilar.

### Dados opcionais para desenvolvimento

Depois de preparar o MySQL e aplicar a migração, é possível inserir **três relatos explicitamente SIMULADOS**, somente com `APP_ENV=development`:

```powershell
Set-Location backend
.venv/Scripts/python.exe -m app.commands.demo --confirm-simulated
```

Para remover somente os três registros dessa carga:

```powershell
.venv/Scripts/python.exe -m app.commands.demo --confirm-simulated --remove
```

A carga é optativa e nunca é executada ao iniciar a aplicação. Reexecutá-la atualiza esses exemplos e sua data; não altera relatos reais. A interface mostra a identificação SIMULAÇÃO.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `frontend/src/app/` | Composição da aplicação e layout inicial. |
| `frontend/src/features/map/` | Mapa, marcadores, área visível e indisponibilidade. |
| `frontend/src/features/occurrences/` | Tipos TypeScript, consulta, filtros e cards. |
| `frontend/src/components/ui/` | Componentes reutilizáveis no padrão shadcn/ui. |
| `frontend/src/lib/` | Cliente HTTP e utilitários compartilhados. |
| `backend/app/api/routes/` | Contratos HTTP e validação de entrada. |
| `backend/app/schemas/` | Schemas Pydantic de entrada e resposta. |
| `backend/app/services/` | Regras de aplicação e conversão pública. |
| `backend/app/repositories/` | Consultas SQLAlchemy. |
| `backend/app/models/` | Modelo persistente inicial. |
| `backend/app/core/` | Configuração por ambiente. |
| `backend/app/db/` | Base declarativa, engine e sessões. |
| `backend/app/commands/` | Comandos explícitos de desenvolvimento. |
| `backend/alembic/` | Migrações versionadas. |
| `infra/` | Configurações de Caddy e referência de MySQL local. |
| `scripts/` | Inicialização local conjunta. |
| `.github/workflows/` | Build futuro em CI, sem deploy. |
| `docs/` | Pesquisa original, arquitetura consolidada e guia desta base. |

## API inicial

| Método e caminho | Comportamento |
| --- | --- |
| `GET /api/info` | Identificação pública e capacidades desta base. Não depende do banco. |
| `GET /api/occurrence-types` | Catálogo habilitado no MySQL. |
| `GET /api/occurrences` | Somente publicados, aprovados e correspondentes à área e aos filtros. |
| `GET /api/occurrences/{uuid}` | Detalhes de uma ocorrência publicada; autor não é exposto. |
| `GET /health/live` | Processo HTTP disponível. |
| `GET /health/ready` | Banco acessível com `SELECT 1` e revisão Alembic atual; caso contrário 503. |
| `GET /api/docs` | OpenAPI interativa somente no desenvolvimento. |

Exemplo: `/api/occurrences?bbox=-49.15,-27.00,-48.98,-26.82&status=active&freshness=current&limit=100`.

`bbox` usa oeste,sul,leste,norte. `type_id` filtra um tipo. `status` aceita `active` ou `resolved`; `freshness` aceita `current`, `expired` ou `all`. A API oferece `cursor`, limite máximo 200, `next_cursor` e `has_more`. A interface consulta até 100 resultados e pede zoom se houver mais, evitando esconder esse limite.

Datas são armazenadas em UTC e a API inclui o fuso nas respostas; o frontend apresenta America/Sao_Paulo. Ativa, resolvida, moderação e expiração permanecem dimensões separadas. O prazo inicial de atualidade é configurável em `OCCURRENCE_TTL_HOURS=48`.

## Próximos incrementos

1. Conta e autenticação com Argon2id/JWT e sessões revogáveis.
2. Evidência temporária de localização e registro publicado/pendente.
3. Fila de moderação, confirmações, denúncias e auditoria.
4. Fotos em Azure Blob privado.
5. Alertas no aplicativo, outbox e Web Push.
6. Busca de endereço/região por Geocoding e refinamentos de acessibilidade.

O esqueleto não implementa esses fluxos nem oferece botões que simulem suas ações. Relatos remotos continuarão dependendo de moderação quando a escrita for implementada; origem oficial não poderá ser atribuída pelo cliente. Não há navegação por destino, rastreamento de trajeto ou solicitação automática de GPS.

## Executar com Docker Compose

Use Docker Engine com containers Linux, BuildKit e o plugin Docker Compose v2. No Windows ou macOS, o Docker Desktop atende a esses requisitos em modo Linux. O primeiro build precisa de acesso ao Docker Hub, npm e PyPI.

Na raiz, copie `.env.example` para `.env` na primeira execução e preencha `DB_PASSWORD` e `DB_ROOT_PASSWORD` com senhas distintas. Use `Copy-Item .env.example .env` no PowerShell ou `cp .env.example .env` no Linux/macOS.

~~~sh
docker compose config --quiet
docker compose up --build --wait --wait-timeout 240
docker compose ps
~~~

Abra [a aplicação local](http://127.0.0.1:8080) e [o catálogo da API](http://127.0.0.1:8080/api/occurrence-types). O MySQL inicializa o banco no volume e a API aplica as migrações antes de liberar o frontend. Os builds da API e do frontend usam o contexto da raiz. A imagem da API recebe as dependências e o código de execução. A imagem web recebe os arquivos compilados e a configuração do Caddy.

O Compose publica somente as portas do Caddy, em loopback por padrão. Se a porta HTTP estiver ocupada, ajuste `WEB_HTTP_PORT` no `.env`. Para ativar o mapa, informe o token público em `VITE_MAPBOX_TOKEN` e execute novamente o comando de subida com `--build`.

Use `docker compose logs db api web` para diagnosticar falhas e `docker compose down` para encerrar preservando os volumes. As senhas do MySQL são aplicadas na criação do volume. Se o banco já existir, mantenha as credenciais cadastradas nele ou altere-as no próprio MySQL.

Para servir HTTPS público, configure `DOMAIN` com o domínio real, `ACME_EMAIL` com o e-mail de contato, `WEB_BIND_IP=0.0.0.0`, `WEB_HTTP_PORT=80` e `WEB_HTTPS_PORT=443`. Aponte o DNS para o servidor e libere TCP 80 e 443. O Caddy solicita o certificado pelo Let's Encrypt.

Para compilar apenas o frontend fora do Docker, use `npm run build`. Os arquivos compilados ficam em `frontend/dist/`.

O frontend usa o registro público `registry.npmjs.org`. Antes da instalação, o CI e o Docker verificam a origem e os hashes SHA-512 do lockfile. Para consultar alertas conhecidos e verificar as assinaturas do npm na instalação local, use `npm --prefix frontend audit` e `npm --prefix frontend audit signatures`.

Detalhes de decisões e rastreabilidade dos documentos: [docs/BASE_INICIAL.md](docs/BASE_INICIAL.md).
