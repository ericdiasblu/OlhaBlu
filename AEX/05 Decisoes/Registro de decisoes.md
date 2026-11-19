# Registro de decisões

[[Inicio AEX]] · [[01 Produto/Requisitos e escopo]] · [[06 Historico/Linha do tempo]]

## D01 · Plataforma web responsiva

**Vigente na arquitetura v1.2.** O projeto conceitual começou como aplicativo móvel. A conversa técnica explorou Android com Expo, Spring Boot e PostGIS, e também uma direção Expo/Supabase. O desenho consolidado usa React, Vite, TypeScript, Tailwind e shadcn/ui no cliente, FastAPI e MySQL 8.4 no backend, Mapbox no mapa e Azure Blob na etapa de fotos. A escolha web permite acesso pelo navegador em celular e desktop. [[06 Historico/2026-11-18 - Arquitetura v1.2]]

## D02 · Explorar o mapa sem destino

**Decisão de produto.** A contribuição comunitária motivou a referência ao Waze. A pessoa pode consultar de casa ou explorar outra região. O MVP adia RF11 e abre sem navegação, rota ou destino. [[01 Produto/Requisitos e escopo]] · [[02 Frontend/Mapa e consulta]]

## D03 · Consulta pública e publicação moderada

**Regra de publicação decidida por Eric.** Proximidade ou passagem recente permite contribuição direta quando o servidor valida a evidência. Contribuições distantes passam pela moderação antes de ficarem públicas. Essa regra se aplica a novos relatos e contribuições sobre relatos existentes.

**Escolha da base.** Leitura pública implementada, conta para escrita planejada. O grupo ainda deve ratificar a leitura pública e os parâmetros iniciais. [[03 Backend/Publicacao e moderacao]]

## D04 · Separar origem, visibilidade e atualidade

**Vigente na arquitetura.** Situação, moderação, origem, confirmação e atualidade são dimensões próprias. Aprovar moderação permite publicar um relato comunitário. Confirmação de vizinhos registra a participação da comunidade. Fonte oficial exige origem autorizada e identificada. Um dado expirado fica fora do mapa padrão e conserva a situação anterior. [[03 Backend/Banco e migracoes]]

## D05 · Azure com Compose, Caddy e redes isoladas

**Direção de infraestrutura aprovada.** VM Azure com DNS, HTTPS e três serviços Docker. API e banco ficam sem portas do host. Health checks encadeiam a inicialização. Blob permanece serviço gerenciado externo. Depois da arquitetura v1.2, os Dockerfiles passaram a usar múltiplos estágios e o Compose recebeu modo HTTP local para outro PC. [[04 Infra/Infraestrutura]]

## D06 · Registro oficial do npm

**Aplicada ao código.** O npm oficial é a origem permitida. O lockfile fixa artefatos e SHA-512, com checagem no build Docker e CI. Registre alertas e resultados ao trocar versões. [[02 Frontend/Dependencias Node]]

## D07 · Vault como memória de trabalho

**Solicitado por Eric.** O Obsidian concentra contexto, decisões, pendências, histórico e ligações por área. O README continua como porta de entrada para rodar a aplicação e aponta para o vault. [[00 Projeto/Como usar e levar o vault]]

## Decisões pendentes

- Confirmar política de leitura pública e parâmetros de proximidade/atualidade com o grupo.
- Definir responsável pela fila e o tratamento de confirmações conflitantes.
- Confirmar data da demonstração, disponibilidade Azure, orçamento e responsável pelo deploy.
- Definir fonte autorizada e forma de atribuição antes de integrar dados oficiais.

As ações correspondentes ficam em [[00 Projeto/Pendencias e proximos passos]].
