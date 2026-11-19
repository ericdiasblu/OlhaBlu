# Arquitetura da aplicação de ocorrências urbanas

**Projeto Aplicado AEX — SENAI**  
**Versão 1.2 consolidada — 18 de novembro de 2026**  
**Integrantes:** Eric Dias, Kaio Levi Pollhein, Matheus Howe Habeck e Max Augusto Leal da Silva.  
**Finalidade:** orientar a criação do primeiro esqueleto, as regras de negócio e a implantação. A infraestrutura descrita ainda não foi provisionada ou testada na VM.

## 1 Contexto e decisões consolidadas

A aplicação permite consultar e comunicar situações de perigo em Blumenau por meio de um mapa colaborativo. O usuário pode estar em casa, consultar outra região ou apenas abrir o mapa. Não precisa definir um destino, iniciar uma viagem ou estar em movimento. A referência ao Waze é o compartilhamento e a confirmação de relatos pela comunidade.

Os documentos de pesquisa registram informações dispersas entre redes sociais, mensagens e canais oficiais. O resumo expandido cita 27 participantes, dos quais 74,1% relataram dificuldades de deslocamento. A proposta reconhece a existência do AlertaBlu e busca facilitar a comunicação comunitária. A amostra por conveniência não representa estatisticamente toda a população.

Adota-se a arquitetura web responsiva apresentada no documento técnico do Claude: React com Vite, TypeScript, FastAPI, MySQL, Mapbox e Azure Blob Storage. Essa escolha substitui a recomendação inicial de aplicativo nativo com Expo e Supabase. O projeto conceitual acadêmico precisa ser atualizado para registrar a escolha web responsiva.

Frontend, API e banco serão executados em containers na mesma VM Azure, com um compose.yaml principal. O frontend estático será servido pelo Caddy, que também termina HTTPS e encaminha /api para a API. O Blob Storage continua sendo um serviço Azure externo à VM; “tudo na VM” refere-se aos serviços executáveis da aplicação, não à substituição do armazenamento gerenciado de fotos.

### 1.1 Parecer sobre o documento recebido

A separação web/api/db, o proxy único, a persistência e o uso de redes Docker são adequados ao MVP. FastAPI e MySQL atendem ao cadastro, à moderação e às consultas geográficas simples previstas, sem exigir um serviço geográfico separado. A principal dificuldade é implementar regras consistentes de participação, atualização e alertas.

| Ponto da versão recebida | Tratamento nesta versão |
| --- | --- |
| Destino e rotas exclusivas de celular | Retirados do MVP conforme esclarecimento do usuário. RF11 permanece rastreado como adiado. |
| Qualquer usuário altera situação | Substituído por contribuições sujeitas à proximidade ou moderação e transições controladas pelo servidor. |
| Moderação fora do MVP | Incluída uma fila mínima real; necessária para relatos remotos. |
| mysqladmin ping | Substituído por SELECT 1 autenticado no banco da aplicação. Ping pode retornar sucesso mesmo com acesso negado [7]. |
| Health check da administração do Caddy | Substituído por uma rota interna que verifica a existência do frontend. |
| Expiração renovada por qualquer edição | Atualidade passa a depender de confirmação aceita, não de edição cosmética. |
| Polling incremental sem remoções | MVP usa snapshots paginados da área visível, evitando marcadores antigos após resolução ou expiração. |
| Negação NSG em prioridade 4000 como opcional equivalente | Explicado seu efeito adicional: ela também sobrepõe liberações padrão da VNet. |
| Desenvolvimento altera rede internal por obrigação | Removida a afirmação genérica; preferem-se ferramentas pela própria rede Docker, sem publicar banco. |

## 2 Escopo e rastreabilidade

O marco de apresentação de 01/12/2026 e a indicação de duas pessoas programando são informações do documento recebido, ainda sujeitas à confirmação operacional do grupo. O cronograma abaixo é uma proposta, não uma garantia de conclusão.

| Requisito | Entrega planejada |
| --- | --- |
| RF01 mapa | Mapa e lista sincronizados; abre em Blumenau ou na localização autorizada. |
| RF02 registro | Tipo, descrição, local e fotos opcionais; publicação direta ou envio para moderação. |
| RF03 alertas | Alertas dentro do app e Web Push quando suportado; sem rota ou destino. |
| RF04 detalhes | Origem, situação, confirmação, atualidade, datas, descrição e fotos. |
| RF05 região | Busca de bairro/endereço e movimentação livre do mapa, inclusive sem GPS. |
| RF06 situação | Ativa ou resolvida; expiração e moderação modeladas separadamente. |
| RF07 filtros | Tipo, situação e área visível; paginação explícita. |
| RF08 datas | Armazenamento UTC; exibição em America/Sao_Paulo. |
| RF09 preferências | Consentimento e ativação/desativação mínimos. Tipos e bairros favoritos ficam para evolução. |
| RF10 denúncias | Fluxo mínimo de denúncia e análise por moderador. |
| RF11 rotas | Adiado. Não haverá destino, Directions, navegação ou rastreamento de trajeto no MVP. |
| RF12 verificação | Origem e confirmação comunitária visíveis; aprovação de moderação não equivale a selo oficial. |

Dados oficiais reais não serão integrados sem uma fonte autorizada identificada. Seeds de demonstração terão indicação explícita de simulação. A disponibilidade de um token Mapbox não assegura gratuidade ilimitada: cotas e restrições devem ser verificadas na conta antes da implantação.

## 3 Regras de participação e moderação

### 3.1 Consulta e identidade

Recomenda-se consulta pública do mapa e detalhes publicados. Registrar, contribuir e denunciar exige conta autenticada. Como a versão recebida deixava a consulta pública em aberto, essa é uma decisão proposta para o esqueleto, passível de ajuste pelo grupo. O nome e o e-mail do autor não serão públicos. Moderadores usam papel separado, atribuído por procedimento administrativo; cadastro comum nunca pode escolher esse papel.

### 3.2 Proximidade como condição de publicação

O usuário definiu que uma contribuição direta exige estar próximo ou ter passado recentemente pelo local. Quem está distante pode relatar algo visto na televisão ou em outra fonte, mas depende de aprovação antes da publicação. A regra vale para novos relatos e contribuições sobre ocorrências existentes.

| Condição | Resultado |
| --- | --- |
| Evidência recente de localização dentro do raio, com precisão suficiente | Publicação comunitária direta ou contribuição elegível. |
| Distante, sem evidência recente, sem GPS ou com precisão insuficiente | Envio pendente, restrito ao autor e aos moderadores. |
| Relato remoto aprovado | Publicação com origem comunitária e aprovação registrada. |
| Relato rejeitado | Não publicado; motivo acessível ao autor e trilha de auditoria. |

O servidor calcula a distância ao ponto da ocorrência com longitude e latitude na ordem correta, por exemplo usando ST_Distance_Sphere. O cliente não escolhe moderation_status nem declara que passou pelo local. Evidências são enviadas por endpoint autenticado e recebem horário de recebimento do servidor. O horário fornecido pelo dispositivo não é autoridade para aceitar uma passagem antiga.

Geolocalização de navegador é um indício, não prova incontestável: pode ser imprecisa ou manipulada. A interface deve dizer “proximidade elegível”, não “presença comprovada”. Detectar coordenadas inválidas, amostras antigas, precisão insuficiente e deslocamentos incompatíveis; aplicar limites de uso. Esses controles reduzem abuso sem prometer eliminar falsificação.

O MVP coleta localização somente com permissão, enquanto o app está aberto. Não acompanha pessoas em segundo plano. Uma passagem anterior só pode ser considerada se houve evidência registrada durante o uso. Evidências temporárias são privadas e removidas após a janela de retenção; não se mantém histórico permanente de trajetos.

### 3.3 Parâmetros iniciais propostos

Os números abaixo são valores de partida para teste, não decisões já aprovadas pelo usuário. Devem ficar em configuração do servidor, documentados e ajustáveis sem alterar o frontend.

| Parâmetro | Valor inicial proposto | Finalidade |
| --- | --- | --- |
| CONTRIBUTION_RADIUS_M | 300 m | Raio para contribuição direta. |
| CONTRIBUTION_WINDOW_MIN | 30 min | Idade máxima da evidência recebida. |
| LOCATION_MAX_ACCURACY_M | 100 m | Limite inicial de incerteza aceitável. |
| ALERT_RADIUS_M | 1000 m | Raio dos alertas de proximidade, distinto do raio de contribuição. |
| ALERT_LOCATION_TTL_MIN | 30 min | Validade da posição usada para alertar. |
| OCCURRENCE_TTL_HOURS | 48 h | Ausência de confirmação aceita faz expirar a atualidade. |
| RESOLUTION_CONFIRMATIONS | 2 usuários | Proposta de confirmações independentes para encerramento comunitário. |
| MAX_OCCURRENCES_PER_HOUR | 10 | Limite inicial de novos relatos por conta, com proteção adicional por IP. |

Para uma amostra com precisão conhecida, considerar elegível somente se distância calculada mais a incerteza estimada estiver dentro do raio, ou encaminhar à moderação. A aplicação não deve aumentar automaticamente o raio para acomodar GPS ruim.

### 3.4 Confirmações e encerramento

As ações são “Ainda está acontecendo”, “Não está mais acontecendo” e “Denunciar informação”. Um usuário tem um voto corrente por ocorrência; repetições da mesma conta não acumulam confirmações nem renovam indefinidamente a validade. Uma nova manifestação exige evidência recente e uma janela de repetição controlada.

Uma contribuição remota fica pendente e não altera a situação, a validade ou os alertas até ser aceita. Dois votos independentes para resolução são uma proposta para o MVP, não uma garantia de verdade. Conflitos entre confirmações de atividade e resolução devem ir para análise. O moderador pode encerrar ou reativar com justificativa auditada. O autor também solicita encerramento pelo mesmo fluxo; autoria não dispensa a regra de proximidade ou aprovação.

Editar descrição, anexar foto ou denunciar não renova last_confirmed_at. Alterações de localização e tipo exigem nova avaliação de elegibilidade. Se uma edição for remota, a versão publicada permanece visível até decisão do moderador; o texto pendente não substitui imediatamente o público.

### 3.5 Estados independentes

| Dimensão | Valores e significado |
| --- | --- |
| Situação | active ou resolved. |
| Moderação | pending, approved, rejected ou hidden. approved significa aceito para publicação. |
| Origem | community ou official. Demonstração usa campo is_simulated separado. |
| Confirmação | Sem confirmação adicional ou confirmada pela comunidade; não equivale a fonte oficial. |
| Atualidade | current ou expired, calculada pela última confirmação aceita. |

Uma ocorrência ativa publicada há mais de 48 h sem confirmação aceita fica “Sem confirmação recente”, fora do mapa padrão. Isso não significa que o risco terminou. Resolvidas e expiradas podem ser consultadas por filtro. Não apagar histórico para esconder desatualização.

### 3.6 Fila mínima de moderação

O painel restrito apresenta relato ou contribuição, motivo de encaminhamento, fonte declarada, evidência disponível e histórico. O moderador aprova, rejeita ou solicita correção, com justificativa. Aprovar relato pendente gera um evento de publicação e só então permite alertas. Denúncia de falsidade não é voto de resolução. Conteúdo denunciado não desaparece automaticamente por uma única denúncia.

Um moderador revisa relatos remotos, mas não é autoridade pública por esse motivo. Não oferecer selo “oficial” para contas comuns ou para aprovação administrativa. A integração oficial futura precisa registrar instituição, referência externa e horário de atualização.

## 4 Stack e limites da arquitetura

| Camada | Escolha |
| --- | --- |
| Cliente | React, Vite e TypeScript; shadcn/ui, Tailwind e componentes acessíveis. |
| Mapa e busca | Mapbox GL JS e Geocoding; token público restrito ao domínio e às permissões necessárias. |
| API | Python com FastAPI, Pydantic, SQLAlchemy e Alembic. |
| Banco | MySQL 8.4 LTS, InnoDB, utf8mb4, UTC; driver PyMySQL. |
| Autenticação | Hash Argon2id; JWT de acesso com validade curta; autorização por papel no servidor. |
| Fotos | Azure Blob privado, leitura por SAS curta; credencial somente na API. |
| Atualização | Polling de 15 s enquanto aba visível e usuário conectado; retomada com snapshot. |
| Push | Service Worker e VAPID; fallback dentro do aplicativo. |
| Operação | Ubuntu LTS, Docker Engine, Compose v2, Caddy e GHCR. |

Fixar versões concretas e lockfiles no esqueleto. Em produção, usar tags de release ou SHA e, quando disponível, digests, sem latest como padrão. PostgreSQL/PostGIS continua uma alternativa se surgirem consultas geográficas mais complexas, mas não é necessário trocar o banco antes do MVP.

MySQL por caixa delimitadora e refinamento por distância é adequado ao volume acadêmico. Um índice composto latitude/longitude não substitui automaticamente um índice espacial nem garante desempenho. Medir consultas com dados representativos e EXPLAIN antes de prometer escala.

## 5 Componentes e contratos

O navegador acessa um único FQDN por HTTPS. Caddy serve o build estático e encaminha /api e /api/* para api:8000 sem remover o prefixo. A API acessa db:3306 na rede privada e serviços externos pela rede de aplicação. O navegador consulta Mapbox diretamente e recebe URLs SAS temporárias para fotos.

| Serviço | Responsabilidade | Redes | Portas do host |
| --- | --- | --- | --- |
| web | Caddy, HTTPS, arquivos React e proxy | frontend_net | 80/tcp e 443/tcp |
| api | Regras, autenticação, moderação, dados, fotos e alertas | frontend_net e backend_net | Nenhuma |
| db | Persistência MySQL | backend_net | Nenhuma |

frontend_net é bridge e permite saída da API e do Caddy. backend_net é bridge com internal: true. O banco não tem interface em frontend_net. O web não integra a rede do banco. A API conecta as duas camadas, sem atuar como roteador de pacotes. O host e administradores Docker ainda têm acesso aos containers: a separação não protege contra comprometimento da VM [3].

### 5.1 Modelo lógico mínimo

| Entidade | Campos e restrições principais |
| --- | --- |
| users | id, nome, email único, password_hash, role, created_at, disabled_at. |
| auth_sessions | id, user_id, token_id único, expires_at e revoked_at; permite revogar a sessão no logout. |
| occurrence_types | id, slug único, label, icon, enabled; catálogo inicial inclui alagamento, acidente, árvore caída, incêndio, deslizamento, via danificada e falta de energia. |
| occurrences | id, user_id, type_id, descrição, latitude, longitude, status, moderation_status, source, is_simulated, source_reference, created_at, updated_at, published_at, last_confirmed_at. |
| occurrence_photos | id, occurrence_id, blob_name, mime_type, size_bytes, created_at; nunca guardar SAS permanente. |
| occurrence_contributions | id, occurrence_id, user_id, action, proposed_payload, eligibility, moderation_status, evidence_id, created_at. |
| occurrence_votes | occurrence_id e user_id únicos em conjunto; voto vigente, accepted_at e evidence_id. |
| moderation_actions | entidade, moderador, decisão, justificativa e horário; trilha imutável pela API comum. |
| location_evidence | usuário, coordenadas, precisão e received_at; retenção curta e acesso privado. |
| push_subscriptions | usuário, endpoint único, p256dh, auth, enabled; não expor publicamente. |
| alerts | usuário, ocorrência, evento de publicação, read_at; unicidade para deduplicação. |
| push_outbox | alerta, assinatura, estado, tentativas, next_attempt_at e erro sanitizado. |

Usar chaves estrangeiras, transações e índices para moderação, bbox e datas. Uma confirmação aceita e a correspondente atualização de situação devem ocorrer na mesma transação. Eventos de publicação e alertas precisam de unicidade no banco, inclusive sob requisições simultâneas.

Remover evidências após a janela configurada e conservar somente o resultado resumido da elegibilidade na auditoria. Ao sair, revogar sessão e desativar a posição para alertas. A retenção curta também deve abranger backups e registros de log; coordenadas não entram nos logs de aplicação.

### 5.2 API prevista

| Método e caminho | Acesso e comportamento |
| --- | --- |
| POST /api/auth/register e /login | Público; validação e limite de tentativas; não retornar hash. |
| POST /api/auth/logout | Autenticado; revoga sessão e posição para alertas. |
| GET /api/auth/me | Dados privados da própria conta. |
| GET /api/occurrence-types | Catálogo público. |
| GET /api/occurrences | Snapshot publicado por bbox, tipo e situação; cursor, limite 200 e has_more. |
| GET /api/occurrences/{id} | Público para publicados; pendentes só para autor/moderador. |
| POST /api/occurrences | Autenticado; retorna publicado ou pendente segundo elegibilidade calculada. |
| PATCH /api/occurrences/{id} | Autor/moderador; edições remotas viram proposta pendente. |
| POST /api/occurrences/{id}/photos | Autenticado e autorizado; validação antes do Blob. |
| POST /api/occurrences/{id}/contributions | Autenticado; confirmação, resolução ou atualização sujeita às regras. |
| POST /api/occurrences/{id}/reports | Autenticado; denúncia de conteúdo inadequado. |
| POST /api/me/location-evidence | Autenticado; posição atual e precisão, com consentimento. |
| DELETE /api/me/location-evidence | Autenticado; descarta evidência e interrompe alertas por posição. |
| GET /api/me/submissions | Próprios registros e decisões de moderação. |
| GET /api/moderation/queue | Somente moderadores. |
| POST /api/moderation/{kind}/{id}/decision | Somente moderadores; decisão e justificativa auditadas. |
| GET /api/alerts | Próprios alertas; cursor e estado de leitura. |
| POST e DELETE /api/push/subscription | Próprias assinaturas; consentimento e cancelamento. |
| GET /health/live | Interno; processo HTTP disponível. |
| GET /health/ready | Interno; banco acessível, migrações aplicadas e inicialização concluída. |

Documentação OpenAPI em /api/docs apenas no desenvolvimento, ou protegida em produção. Erros sem SQL, segredos, nomes internos ou stack traces. Testar 401/403/404 e acesso a objetos de outras contas, não apenas o fluxo feliz.

## 6 Atualização e notificações

O app atualiza somente a área consultada; mover o mapa não muda a posição física usada na elegibilidade. A cada 15 s com aba visível, substitui o conjunto de ocorrências pelo snapshot atual, considerando paginação. Para mais de 200 resultados, continuar páginas ou pedir zoom, deixando o limite explícito. Respostas antigas de buscas canceladas não podem sobrescrever uma região mais recente.

Sem GPS, o mapa continua utilizável. Sem evidência válida de posição, não enviar alerta de proximidade. Uma pessoa parada em casa pode receber alertas com o app aberto e posição válida; não há requisito de movimento ou destino. Bairros favoritos são evolução independente, que poderá permitir alertas sem posição recente.

Somente a primeira publicação aceita de uma ocorrência ativa gera alertas a usuários elegíveis a até 1 km. Inserções pendentes, rejeições e edições cosméticas não geram alertas. Aplicar deduplicação por usuário e evento. Gravar alerta e tarefa na outbox em transação; o envio externo não faz parte da transação SQL.

Para o MVP, a API terá uma única réplica e um consumidor periódico da outbox no seu ciclo de vida. Limitar tentativas, usar backoff e remover assinaturas definitivamente inválidas. Reiniciar a API não pode apagar tarefas pendentes. Se houver mais réplicas, exigir claim transacional das tarefas ou separar um worker no Compose antes de escalar.

A meta de até 15 s refere-se ao próximo polling com aba ativa, rede disponível e processamento saudável, não a uma garantia de entrega push. Navegadores podem suspender abas; push exige suporte, consentimento e Service Worker. No iOS/iPadOS, validar instalação na tela inicial e compatibilidade no dispositivo real [10]. O servidor não recebe localização contínua com o app fechado, então a posição expira mesmo se a assinatura push continuar válida.

## 7 Docker Compose e prontidão

Um compose.yaml principal de produção terá três serviços permanentes. Todos usam restart: unless-stopped. A ordem é db saudável, api pronta para requisições e então web. depends_on com service_healthy controla a criação inicial pelo Compose; não monitora dependências continuamente nem garante a mesma barreira quando o Docker reinicia containers após reboot [1, 2].

Por isso a API precisa recuperar conexões com pool_pre_ping e backoff, e o proxy precisa tolerar indisponibilidade temporária. Um container unhealthy não é automaticamente reiniciado por essa política. restart atua sobre processo que termina, não sobre resultado negativo de health check. Habilitar Docker no boot e observar saúde após reiniciar a VM.

O banco verifica SELECT 1 com o usuário e banco da aplicação por TCP. A API expõe readiness que verifica conexão, revisão Alembic e inicialização; retorna 503 se indisponível. Serviços externos de mapas, Blob e push não devem impedir a prontidão básica do mapa e cadastro: suas falhas são tratadas por funcionalidade.

A API aplica migrações antes de iniciar Uvicorn na primeira arquitetura de réplica única. Falha de migração encerra o processo sem iniciar HTTP. Migrações devem ser compatíveis com rollback de aplicação; atualizar a imagem não desfaz alterações de banco. Nenhum processo web pode usar root do MySQL.

O web verifica http://127.0.0.1:8080/health/web, rota interna que só retorna 200 se /srv/index.html existe. Essa porta não é publicada. O teste verifica o frontend local; TLS público e proxy são verificados por smoke test externo separado.

### 7.1 Compose principal de referência

O exemplo é contrato para o esqueleto. As imagens de API e web ainda precisam ser construídas com os módulos e arquivos descritos. Não executar os placeholders como implantação pronta. O ambiente deve definir as variáveis obrigatórias; não há fallback para latest.

```yaml
name: ocorrencias

x-logging: &logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

services:
  db:
    image: mysql:8.4
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: ${DB_NAME:?required}
      MYSQL_USER: ${DB_USER:?required}
      MYSQL_PASSWORD: ${DB_PASSWORD:?required}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:?required}
      TZ: UTC
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - backend_net
    healthcheck:
      test:
        - CMD-SHELL
        - >-
          MYSQL_PWD="$${MYSQL_PASSWORD}"
          mysql --protocol=TCP -h 127.0.0.1
          --user="$${MYSQL_USER}"
          --database="$${MYSQL_DATABASE}"
          --connect-timeout=3 --execute="SELECT 1"
          >/dev/null 2>&1
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 60s
    logging: *logging

  api:
    image: ${API_IMAGE:?required}:${IMAGE_TAG:?required}
    restart: unless-stopped
    init: true
    command:
      - sh
      - -ec
      - >-
        alembic upgrade head &&
        exec uvicorn app.main:app --host 0.0.0.0
        --port 8000 --workers 1
    environment:
      DB_HOST: db
      DB_PORT: "3306"
      DB_NAME: ${DB_NAME:?required}
      DB_USER: ${DB_USER:?required}
      DB_PASSWORD: ${DB_PASSWORD:?required}
      JWT_SECRET: ${JWT_SECRET:?required}
      PUBLIC_BASE_URL: https://${DOMAIN:?required}
      AZURE_STORAGE_CONNECTION_STRING: ${AZURE_STORAGE_CONNECTION_STRING:?required}
      AZURE_STORAGE_CONTAINER: ${AZURE_STORAGE_CONTAINER:?required}
      VAPID_PUBLIC_KEY: ${VAPID_PUBLIC_KEY:?required}
      VAPID_PRIVATE_KEY: ${VAPID_PRIVATE_KEY:?required}
      VAPID_SUBJECT: mailto:${ACME_EMAIL:?required}
      CONTRIBUTION_RADIUS_M: "300"
      CONTRIBUTION_WINDOW_MIN: "30"
      LOCATION_MAX_ACCURACY_M: "100"
      ALERT_RADIUS_M: "1000"
      ALERT_LOCATION_TTL_MIN: "30"
      OCCURRENCE_TTL_HOURS: "48"
      RESOLUTION_CONFIRMATIONS: "2"
      MAX_OCCURRENCES_PER_HOUR: "10"
      TZ: UTC
    depends_on:
      db:
        condition: service_healthy
    networks:
      - frontend_net
      - backend_net
    healthcheck:
      test:
        - CMD
        - python
        - -c
        - >-
          import urllib.request;
          urllib.request.urlopen(
          'http://127.0.0.1:8000/health/ready', timeout=3)
      interval: 15s
      timeout: 5s
      retries: 8
      start_period: 60s
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    logging: *logging

  web:
    image: ${WEB_IMAGE:?required}:${IMAGE_TAG:?required}
    restart: unless-stopped
    init: true
    environment:
      DOMAIN: ${DOMAIN:?required}
      ACME_EMAIL: ${ACME_EMAIL:?required}
    depends_on:
      api:
        condition: service_healthy
    ports:
      - "80:80/tcp"
      - "443:443/tcp"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - frontend_net
    healthcheck:
      test:
        - CMD
        - wget
        - -q
        - -O
        - /dev/null
        - http://127.0.0.1:8080/health/web
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    security_opt:
      - no-new-privileges:true
    logging: *logging

networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true

volumes:
  mysql_data:
  caddy_data:
  caddy_config:
```

A imagem api deve incluir sh, Python, Alembic e dependências, executar como usuário sem privilégios e conter a configuração de migrations. A imagem web deve conter Caddy e wget; confirmar essa disponibilidade no build, sem presumir ferramentas em qualquer imagem. A versão mysql:8.4 é uma linha de manutenção; fixar digest no primeiro release homologado. Validar que os diretórios persistentes têm permissões corretas.

### 7.2 Caddyfile de referência

```caddyfile
{
    email {$ACME_EMAIL}
}

http://:8080 {
    root * /srv
    @ready {
        path /health/web
        file /index.html
    }
    respond @ready "ok" 200
    respond "not ready" 503
}

{$DOMAIN} {
    tls {
        issuer acme {
            dir https://acme-v02.api.letsencrypt.org/directory
        }
    }
    encode zstd gzip
    header X-Content-Type-Options nosniff
    header Referrer-Policy strict-origin-when-cross-origin
    @api path /api /api/*
    handle @api {
        request_body {
            max_size 20MB
        }
        reverse_proxy api:8000
    }
    handle {
        root * /srv
        try_files {path} /index.html
        file_server
    }
}
```

O prefixo /api é preservado; não usar handle_path neste contrato. Endpoints inexistentes de API retornam JSON 404, nunca index.html. A administração do Caddy continua apenas em loopback e não terá porta publicada nem regra de NSG. A porta 8080 é restrita ao container/rede Docker; a URI pública /health/web não é um endpoint de monitoramento.

Caddy emite e renova certificados automaticamente quando DNS, conectividade de entrada e saída e persistência estão corretos [4]. O issuer foi explicitado para usar Let's Encrypt. Durante experimentação de certificados, usar staging; o certificado de staging não será confiável no navegador. Depois validar emissão de produção. HTTP/3 fica fora da configuração inicial: não publicar 443/udp sem habilitar também sua regra NSG.

### 7.3 Build e ambiente

O frontend terá Dockerfile em duas etapas: Node com versão LTS fixada executa npm ci e npm run build; a imagem final Caddy recebe dist em /srv e o Caddyfile. Node não fica executando em produção. VITE_API_BASE_URL será /api. VITE_MAPBOX_TOKEN é configuração pública de build; defini-la apenas no environment do container Caddy não altera o JavaScript já compilado. Nunca colocar segredos em variáveis VITE_.

Variáveis obrigatórias do ambiente: DOMAIN, ACME_EMAIL, API_IMAGE, WEB_IMAGE, IMAGE_TAG, DB_NAME, DB_USER, DB_PASSWORD, DB_ROOT_PASSWORD, JWT_SECRET, AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER, VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY. DOMAIN contém somente o FQDN, sem https:// ou caminhos. Senhas distintas e aleatórias; DB_USER não pode ser root.

O .env de produção fica na VM com permissão 600 e fora do Git. Ele não é um cofre: pessoas com acesso ao Docker podem inspecionar os valores. Migrar a secrets/Key Vault e identidade gerenciada quando necessário. Não publicar saída de docker compose config, pois ela pode conter segredos; usar config --quiet para validação. Não registrar SAS, tokens, cookies, senhas ou coordenadas nos logs.

## 8 Azure e HTTPS

Usar uma VM Ubuntu LTS com IP público Standard estático e DNS label no recurso Public IP. A forma habitual é <label>.<regiao>.cloudapp.azure.com; com Domain Name Label Scope, Azure pode acrescentar um hash. Copiar o FQDN efetivamente retornado pelo portal/CLI para DOMAIN, sem construir o nome por suposição [5].

Não é necessário comprar domínio ou certificado. O DNS label não elimina os custos da VM, disco, IP, Blob e tráfego. Verificar saldo e limites Azure for Students no portal, criar orçamento e alerta, sem garantir que o crédito cobrirá qualquer configuração.

Pré-requisitos: DNS público resolvendo para o IP correto, nenhuma entrada AAAA incorreta, NSG permitindo TCP 80/443, portas livres no host, Docker com as portas publicadas, saída DNS e HTTPS funcionando e relógio sincronizado. Se houver firewall local, verificar também encaminhamento Docker e suas regras; não confiar apenas em ufw para bloquear portas publicadas.

O volume caddy_data mantém certificados e chaves e deve persistir em recriações. mysql_data mantém dados. Fazer backup antes de atualizações. Não executar docker compose down -v como rotina, pois remove volumes e pode causar perda de dados. Uma VM única não oferece alta disponibilidade; falha do host interrompe frontend, API e banco.

### 8.1 Regras de entrada do NSG

Associar inicialmente um NSG à NIC dedicada da VM. Se a sub-rede também tiver NSG, ambos precisam permitir o tráfego e suas regras efetivas devem ser verificadas. Não remover regras existentes sem entender outros serviços. A tabela é configuração desejada para a VM dedicada da aplicação, não autorização para alterar infraestrutura compartilhada.

Convenção adotada: <Acao>-<Servico>-Inbound-<Porta>-<Protocolo>-<Origem>. Nomes em inglês, sem espaços e com hífens. Esta é uma convenção do projeto, compatível com as restrições Azure; não é uma nomenclatura obrigatória da Microsoft [6].

Em todas as regras: direção Inbound, porta de origem *, destino igual ao IP privado da NIC da aplicação (/32) e descrição preenchida. O Azure avalia o destino após tradução do IP público para o privado. Para IPv6, se adotado, criar regras e DNS correspondentes; o MVP usa IPv4.

| Prior. | Nome | Protocolo e porta | Origem | Ação |
| --- | --- | --- | --- | --- |
| 100 | Allow-HTTPS-Inbound-443-TCP-Internet | TCP 443 | Service tag Internet | Allow |
| 110 | Allow-HTTP-Inbound-80-TCP-Internet | TCP 80 | Service tag Internet | Allow |
| 200 | Allow-SSH-Inbound-22-TCP-Admin | TCP 22 | IP público do administrador /32 | Allow |
| 4000 | Deny-All-Inbound | Any, porta * | Any | Deny |

Descrição da regra 100: “Acesso HTTPS ao frontend e API pelo Caddy”. Regra 110: “Validacao ACME e redirecionamento HTTP para HTTPS”. Regra 200: “Administracao por chave SSH a partir do IP autorizado”. Regra 4000: “Bloqueio de demais entradas para a VM dedicada”.

Não liberar 3306 (banco), 8000 (API), 8080 (health interno), 2019 (administração Caddy), 2375/2376 (Docker remoto), nem portas do Vite. Porta 22 nunca usa Internet, Any ou 0.0.0.0/0 como origem. Quando o IP administrativo mudar, atualizar somente o /32 autorizado. SSH usa chave, sem root remoto nem autenticação por senha.

A regra Deny-All-Inbound em 4000 é uma decisão de endurecimento para a VM dedicada. Ela também bloqueia acessos da VNet e probes de load balancer que seriam permitidos pelas regras padrão 65000/65001. Não é equivalente à negação padrão 65500. Se forem adicionados Bastion, balanceador, monitoramento ou administração privada, criar liberações específicas com prioridade menor que 4000 antes de ativar essa negação [6].

Reservar prioridade 120 para Allow-HTTP3-Inbound-443-UDP-Internet somente se HTTP/3 for habilitado e publicado no Compose. Manter a saída necessária para DNS, NTP, registros de imagens, ACME, Blob, push e atualizações. NSG é stateful; o retorno de conexões autorizadas não exige abrir portas de entrada efêmeras. Não abrir entrada para Mapbox, Blob ou serviços push.

### 8.2 Recursos e armazenamento

Usar nomes como rg-ocorrencias-prod-brs, vm-ocorrencias-prod-brs, pip-ocorrencias-prod-brs e nsg-ocorrencias-prod-brs se Brazil South estiver disponível. Storage Account precisa de nome único sem hífens. A região e o tamanho da VM dependem da assinatura. Recomenda-se começar com pelo menos 2 GiB de RAM e medir consumo; esse valor não é uma garantia de capacidade.

Container de fotos privado; API valida assinatura real do arquivo, tipo JPEG/PNG, dimensões e tamanho, remove metadados quando possível e gera nome aleatório. Limite inicial de três fotos de até 5 MB por ocorrência. URLs SAS de leitura com validade curta e sem permissão de escrita ou listagem. Validar no backend o total de fotos por ocorrência, inclusive em uploads paralelos. Arquivos pendentes nunca ficam acessíveis para consulta pública por ID.

## 9 Segurança e operação

HTTPS e mesma origem simplificam o cliente: não habilitar CORS amplo em produção. No desenvolvimento, permitir apenas origens explícitas. Hash Argon2id, expiração de tokens, proteção contra enumeração, rate limit de login e validação de autorização por objeto são obrigatórios. Proposta: token de acesso curto em memória; ao expirar, novo login no MVP. Se cookies forem adotados, exigir HttpOnly, Secure, SameSite e proteção CSRF para ações de escrita.

A API deve confiar em cabeçalhos de proxy somente de origens internas autorizadas. Definir isso no esqueleto e testar IP real antes de aplicar rate limit por IP; não confiar em X-Forwarded-For arbitrário. Aplicar política CSP compatível com Mapbox e Service Worker após teste, sem copiar uma política que impeça o mapa de funcionar.

O frontend não pode atribuir papel de moderador, origem oficial, resultado de elegibilidade ou contagem de confirmações. A moderação inicial terá uma conta administrativa criada por comando controlado, sem senha padrão no seed. Dados de demonstração devem ser removíveis e visualmente identificados.

Volumes não substituem backup. Agendar dump consistente do MySQL, cifrar ou usar armazenamento protegido e manter cópia fora da VM em container privado separado. Fazer restauração em banco isolado antes da apresentação. Guardar caddy_data de forma protegida; contém chaves privadas. Definir retenção curta para localização inclusive em backups, ou excluir a tabela efêmera dos dumps duradouros com procedimento de restauração documentado.

## 10 Implantação e recuperação

GitHub Actions fará validação, testes e build das imagens api e web com a mesma tag de commit, enviadas ao GHCR. O deploy inicial será manual por SSH a partir do /32 do administrador. Isso evita abrir SSH para todos os runners hospedados e dispensa instalar runner com poder Docker na VM de produção.

Runner self-hosted ou autenticação Azure por OIDC podem ser evoluções, com análise de permissões. Não abrir porta 22 para toda a internet em nome de CI/CD. Só armazenar no GitHub os segredos realmente usados pelo workflow; segredos operacionais da aplicação permanecem na VM.

Procedimento de produção: obter imagens homologadas, fazer backup, atualizar IMAGE_TAG e executar comandos abaixo na pasta de implantação. Eles são referência para execução futura, sem valores reais nesta versão.

```bash
docker compose --env-file .env -f compose.yaml config --quiet
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d --wait --wait-timeout 240
docker compose --env-file .env -f compose.yaml ps
```

Usar Compose v2 com suporte às opções acima. A primeira emissão TLS pode levar mais tempo que o health check local do web; verificar HTTPS público separadamente. Testar /api/occurrence-types e o carregamento real do mapa por HTTPS. Para rollback, voltar a tag anterior somente se o esquema continuar compatível. Não restaurar banco de produção automaticamente em falha de deploy.

No desenvolvimento, preferir ferramentas via docker compose exec ou containers auxiliares nas redes existentes. Se necessário, um compose.dev.yaml explícito publica portas somente em 127.0.0.1 e usa Vite com proxy /api. Nunca levar esse override à produção; invocar sempre -f compose.yaml no deploy. Não pressupor que .env de runtime muda configurações Vite compiladas.

Se o banco cair após a subida, readiness da API deve passar a 503 e voltar a 200 após recuperação. O web pode continuar healthy para arquivos estáticos enquanto a API está indisponível; a interface apresenta erro recuperável e não confirma gravações que falharam. O health check local não garante continuidade ponta a ponta.

## 11 Organização do primeiro esqueleto

| Caminho planejado | Conteúdo |
| --- | --- |
| frontend/ | React, Vite, mapa, autenticação, formulários, fila administrativa e Service Worker. |
| backend/app/ | Routers e serviços de auth, ocorrências, elegibilidade, moderação, fotos e alertas. |
| backend/alembic/ | Migrações versionadas e seed explícito de demonstração. |
| infra/caddy/Caddyfile | Proxy e health local, copiado para a imagem web. |
| compose.yaml | Produção com três serviços, duas redes e volumes. |
| compose.dev.yaml | Ajustes locais explicitamente selecionados. |
| .env.example | Apenas nomes e placeholders; nunca credenciais reais. |
| .github/workflows/ | Testes e imagens; deploy automatizado em evolução. |
| docs/final/ | Documento consolidado em Markdown e PDF. |

Primeiro incremento: banco com migração inicial, API live/ready, build React simples, Caddy e Compose. Segundo: catálogo, mapa e consulta pública. Terceiro: conta, evidência e registro publicado/pendente. Quarto: moderação e confirmações. Quinto: fotos, polling e alertas. Esse encadeamento prioriza a regra de confiança antes de divulgar notificações.

## 12 Critérios de aceite para o esqueleto e o MVP

- Compose valida sem interpolação ausente; api e db não publicam portas do host.
- Com db sem aceitar SELECT autenticado, api não inicia pela dependência de prontidão.
- Com api indisponível na primeira subida, web aguarda readiness; falhas posteriores são tratadas sem alegar recuperação automática por health check.
- Recriar containers preserva dados e certificados. Reiniciar a VM recupera os processos e a aplicação após reconexão.
- HTTP público redireciona para HTTPS; certificado é confiável e pertence ao FQDN real.
- Somente 80/443 são públicos; 22 acessível apenas da origem administrativa autorizada.
- Consulta do mapa funciona sem login, GPS, destino ou movimento, se mantida a proposta de leitura pública.
- Registro próximo elegível publica; registro distante ou sem localização fica pendente e não aparece no mapa nem gera alerta.
- Usuário comum não pode aprovar relato, forjar origem oficial ou ler pendências de terceiros.
- Contribuição aceita, votos independentes e decisão de moderação deixam trilha; edição cosmética não renova atualidade.
- Ocorrência expirada sai do mapa padrão sem ser declarada resolvida. Polling remove marcadores fora do conjunto atual.
- Alertas respeitam posição válida, raio, consentimento e deduplicação; falha push preserva o alerta no aplicativo.
- Backup é restaurado em ambiente isolado; seed simulado está identificado.

Validar testes unitários de distância, janela temporal e estados; integração de permissões, moderação e transações; smoke tests reais de HTTPS e redes na VM. O PDF e a configuração de referência não equivalem a esses testes de implantação.

Validação desta revisão: o YAML de referência foi analisado por parser, e foram conferidos os três serviços, políticas de reinício, dependências healthy, isolamento do banco e portas publicadas. O Caddyfile foi aceito por caddy validate com Caddy 2.11.9, usando domínio de teste, sem iniciar o servidor ou emitir certificados. Docker Engine não está disponível neste ambiente: docker compose config, subida real, health checks, migrações e conectividade Azure permanecem para a implementação. O PDF foi renderizado para inspeção de layout.

## 13 Dificuldade e plano de entrega

A versão com mapa, cadastro, proximidade, moderação e alertas tem dificuldade média a alta para uma equipe iniciante. Eliminar navegação reduz bastante o esforço em comparação com a arquitetura recebida, mas a fila de moderação e a consistência de estados são parte necessária do produto solicitado.

| Etapa | Marco sugerido se mantida a apresentação em 01/12 |
| --- | --- |
| 18 a 20/11 | Estrutura, Compose, HTTPS, migração inicial e teste na VM. |
| 21 a 23/11 | Mapa, consulta, conta e fluxo próximo/remoto com fila administrativa. |
| 24 a 26/11 | Confirmações, fotos, filtros, expiração, polling e alertas. |
| 27 a 28/11 | Congelar funcionalidades; corrigir acessibilidade e testar celular e desktop. |
| 29 a 30/11 | Restaurar backup, ensaiar e gravar demonstração de contingência. |
| 01/12 | Apresentação, se o marco for confirmado. |

Se faltar tempo, priorizar mapa, regra de publicação/moderação e alertas na tela; tratar Web Push como melhoria demonstrada somente quando testada. Não substituir moderação por limite de registros, pois isso viola a regra definida para relatos distantes.

Antes do esqueleto, preencher FQDN, região, IP administrativo, tamanho da VM, repositório e nomes das imagens. Ratificar leitura pública e parâmetros propostos (300 m, 30 min, precisão, 48 h e votos). Os valores não impedem preparar a estrutura configurável. Bairros favoritos, integração oficial e rotas ficam registrados como evolução, sem destino implícito no uso atual.

## 14 Fontes e histórico

Base documental: os sete PDFs de docs, a arquitetura versão 1.1 produzida com Claude e as definições do usuário nesta conversa. A origem recebida foi lida em suas 19 páginas. Esta versão consolida o material e corrige conflitos com as decisões mais recentes; não representa confirmação de provisionamento, cotas, custos ou benchmark.

Fontes técnicas oficiais conferidas em 18/11/2026:

1. Docker — Control startup and shutdown order in Compose: https://docs.docker.com/compose/how-tos/startup-order/
2. Docker — Compose services e restart: https://docs.docker.com/reference/compose-file/services/
3. Docker — Networking in Compose: https://docs.docker.com/compose/how-tos/networking/ e Bridge network driver: https://docs.docker.com/engine/network/drivers/bridge/
4. Caddy — Automatic HTTPS: https://caddyserver.com/docs/automatic-https e reverse_proxy: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
5. Microsoft Learn — Public IP addresses: https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses
6. Microsoft Learn — Manage network security groups: https://learn.microsoft.com/en-us/azure/virtual-network/manage-network-security-group e regras padrão: https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview
7. MySQL — mysqladmin e resultado do ping: https://dev.mysql.com/doc/refman/8.0/en/mysqladmin.html
8. Mapbox — Tokens: https://docs.mapbox.com/help/dive-deeper/access-tokens/
9. FastAPI — Behind a proxy: https://fastapi.tiangolo.com/advanced/behind-a-proxy/
10. WebKit — Web Push for Web Apps on iOS and iPadOS: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

Histórico: versão 1.1 recebida estabeleceu a stack web e a infraestrutura. Versão 1.2 mantém essa stack, consolida DNS Azure e HTTPS, aperfeiçoa Compose e NSG, remove destino do MVP e incorpora proximidade e moderação obrigatória para relatos remotos. Elaborado com apoio de Claude e ChatGPT; a revisão e o conteúdo final permanecem sob responsabilidade do grupo.
