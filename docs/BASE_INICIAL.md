# Base inicial implementada

## Leitura documental

| Documento analisado | Aplicação nesta estrutura |
| --- | --- |
| Problema de pesquisa.pdf | Consulta simples por localização, sem substituir o AlertaBlu ou alegar informação oficial. |
| Projeto informacional (1).pdf | RF01/RF04/RF05/RF06/RF07/RF08 orientam mapa, consulta pública, filtros, origem e datas. Demais requisitos serão incrementos. |
| Projeto conceitual (1).pdf | Organização centrada no mapa. A antiga escolha móvel foi substituída pela arquitetura final web. |
| Resumo expandido - Projeto Aplicado AEX (3).pdf | Contexto de Blumenau e finalidade comunitária, com a pesquisa como fundamento e não como dados de ocorrências. |
| Texto sobre coleta de dados.pdf | Dados da pesquisa não são publicados como relatos nem importados para o banco da aplicação. |
| fichamento_academico.pdf | Clareza de origem, atualidade e simplicidade de uso; sem selo de verdade automática. |
| Artigo 3 sobre enchentes que pode ser usado para inspiracao.pdf | Referência de aprendizagem e prototipagem social; não impõe sua stack ou suas integrações à solução. |
| final/Documento_de_Arquitetura_Ocorrencias_Urbanas.md e .pdf | Referência técnica principal, versão 1.2: React/Vite/TypeScript, Tailwind/shadcn, FastAPI, MySQL, Mapbox, Azure Blob futuro e Caddy. |

Os PDFs e a arquitetura consolidada foram preservados. O guia descreve a implementação incremental; não altera o escopo final do produto.

## Corte desta entrega

Aplicação de consulta como primeiro ponto de partida. A UI conecta ao backend pelo proxy `/api` do Vite e pelo Caddy no cenário futuro. A API faz leitura real com SQLAlchemy, retornando apenas ocorrências aprovadas e publicadas. Os contratos públicos usam lista explícita de campos, sem serializar usuários.

O banco inicial contém `users`, `occurrence_types` e `occurrences`. A tabela de usuários prepara a relação futura de autoria, sem implementar autenticação. `user_id` pode ser nulo para a carga de demonstração. Antes de habilitar cadastro de relatos reais, exigir autoria autenticada e implementar elegibilidade, moderação e auditoria numa mesma entrega.

As demais entidades da arquitetura (sessões, evidências, contribuições, votos, decisões de moderação, fotos, assinaturas, alertas e outbox) serão adicionadas em novas migrações junto de seus fluxos. Isso evita criar contratos falsamente funcionais ou antecipar todo o MVP.

## Convenções de extensão

- Um domínio novo começa com router, schemas, serviço e repositório quando houver necessidade de persistência.
- Rotas validam HTTP; regras ficam em serviços; consultas ficam nos repositórios. Transações de escrita futuras devem ser coordenadas pelo serviço.
- Migrações existentes permanecem imutáveis após uso compartilhado. Mudanças de modelo exigem uma nova revisão Alembic.
- No frontend, telas e hooks específicos ficam em `features/<dominio>`; componentes compartilhados ficam em `components/ui`.
- Não criar endpoints de escrita, mocks automáticos ou dados de emergência fictícios sem os respectivos fluxos.
- As credenciais de serviços externos ficam exclusivamente no backend. Mapbox usa token público restrito.

## Condições da execução local

| Disponibilidade | Resultado esperado |
| --- | --- |
| Sem MySQL e sem token Mapbox | Frontend e API iniciam; UI mostra indisponibilidade de consulta e configuração do mapa. `/api/info` e `/health/live` funcionam; `/health/ready` retorna 503. |
| MySQL com migração aplicada, sem token Mapbox | Catálogo, consulta, filtros e detalhes pela lista funcionam. Mapa apresenta indisponibilidade. |
| MySQL com migração aplicada e token Mapbox válido | Mapa e lista sincronizam a área visível; marcadores abrem o detalhe na lista. |
| Carga de demonstração opcional | Três registros SIMULADOS visíveis, identificados e removíveis por comando. |

O erro de banco não é convertido em sucesso com lista vazia. Ausência de relatos não significa ausência de perigo. A carga opcional nunca se apresenta como fonte oficial.

## Fora desta etapa

Execução de containers, testes de infraestrutura, acesso à Azure, implantação e suíte de testes. Os arquivos de infraestrutura estão preparados para continuidade. Argon2id/JWT, moderação, Blob, VAPID e Geocoding estão previstos e ainda não implementados.
