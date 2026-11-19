# AEX | Ocorrências urbanas

Base da aplicação web colaborativa de Blumenau. O objetivo desta entrega é iniciar o desenvolvimento com uma aplicação executável e camadas organizadas. A referência principal é `docs/final/Documento_de_Arquitetura_Ocorrencias_Urbanas.md`, versão 1.2. Os sete PDFs de pesquisa foram considerados; decisões técnicas antigas de aplicativo móvel e rotas cedem à arquitetura final web.

## O que esta base entrega

- React + Vite + TypeScript, Tailwind e componentes no padrão shadcn/ui.
- Tela responsiva de consulta, filtros, estados de carregamento/erro/vazio e detalhes na lista.
- Mapbox GL JS integrado, habilitado ao configurar um token público. Sem token, a lista continua utilizável e o mapa informa sua indisponibilidade.
- FastAPI com módulos de API, schemas, serviços, repositórios, modelos e configuração.
- SQLAlchemy + PyMySQL para MySQL 8.4, Alembic e primeira migração com usuários, tipos e ocorrências.
- Consulta pública real do banco: catálogo, listagem por área e detalhes publicados. Sem endpoints de escrita nesta etapa.
- Atualização da área consultada a cada 15 segundos com a aba visível e rede disponível. Os marcadores são substituídos pelo conjunto atual.
- Dockerfiles, Compose e Caddy preparados para a etapa futura de infraestrutura, sem execução de containers nesta entrega.
- Dependências fixadas em `frontend/package-lock.json` e `backend/requirements.txt`, este último com hashes.

## Iniciar localmente, sem Docker

Requisitos: Node.js 22.12+ (referência fixada em 24.4.0), npm e Python 3.13 (referência 3.13.5). Os comandos abaixo são executados na raiz `AEX`, em PowerShell. Não é necessário ativar scripts PowerShell de ambientes virtuais.

Na primeira instalação:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install --require-hashes -r backend/requirements.txt
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

## Infraestrutura preparada

`compose.yaml` mantém três serviços, redes separadas, volumes, reinício e dependências por health check. Apenas o web publica 80/443; API e banco ficam privados. Dockerfiles usam contexto da raiz. A configuração de Caddy preserva `/api` e mantém health checks fora do proxy público.

As variáveis da raiz `.env.example` são destinadas a essa etapa futura. Credenciais de Blob, JWT e VAPID não são exigidas agora, pois esses módulos ainda não existem. Não foi criado override Docker de desenvolvimento: o fluxo atual usa Python e Vite diretamente. Execução de containers, provisionamento Azure, DNS/HTTPS reais e testes integrados ficam fora desta entrega, conforme o escopo solicitado.

Para compilar o frontend: `npm run build`. A compilação gera `frontend/dist/`. Não foi adicionada suíte de testes nesta etapa.

Detalhes de decisões e rastreabilidade dos documentos: [docs/BASE_INICIAL.md](docs/BASE_INICIAL.md).
