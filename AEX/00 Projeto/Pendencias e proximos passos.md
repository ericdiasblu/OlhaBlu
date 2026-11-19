# Pendências e próximos passos

[[Inicio AEX]] · [[00 Projeto/Estado e verificacoes]] · [[05 Decisoes/Registro de decisoes]]

Marque uma tarefa quando houver evidência do resultado. Registre a evidência na área ou na [[06 Historico/Linha do tempo]]. A ordem abaixo é uma proposta de execução, ajustável pelo grupo.

## 1 · Validar a base em outro computador

- [ ] **INF-01** Clonar ou atualizar o repositório no computador de destino. Conferir a revisão e abrir o vault interno no Obsidian. [[04 Infra/GitHub e automacao]]
- [ ] **INF-02** Subir a aplicação em Docker Engine com Compose v2. Confirmar `db`, `api` e `web` saudáveis e obter os sete tipos em `/api/occurrence-types`. Executar também o job Compose do CI quando a revisão estiver no GitHub. [[04 Infra/Docker e Caddy]]
- [ ] **FE-01** Configurar token público Mapbox e verificar mapa e lista no desktop e no celular. Mover e ampliar o mapa, aplicar filtros, selecionar marcador e comparar a área consultada. [[02 Frontend/Mapa e consulta]]
- [ ] **BE-01** Verificar migração em MySQL real e cenário com dados simulados, área vazia e queda do banco. Confirmar que a indisponibilidade volta como erro recuperável e que a consulta retoma após recuperação. [[03 Backend/Banco e migracoes]]

## 2 · Fechar decisões para começar a escrita

- [ ] **PROD-01** Confirmar com o grupo a leitura pública adotada no esqueleto e os valores iniciais de raio, janela, precisão, validade e votos. [[05 Decisoes/Registro de decisoes#D03 · Consulta pública e publicação moderada]]
- [ ] **PROD-02** Alinhar projeto conceitual e apresentação à escolha web responsiva. Confirmar data de entrega e responsáveis. [[01 Produto/Requisitos e escopo]]
- [ ] **BE-02** Implementar cadastro, login, logout, papel de moderador e sessão revogável com Argon2id e JWT curto.
- [ ] **BE-03** Implementar evidência temporária de localização e registro com decisão de publicação no servidor.
- [ ] **BE-04** Entregar junto da escrita a fila mínima de moderação e auditoria. Validar acesso do autor e do moderador aos relatos pendentes.
- [ ] **FE-02** Entregar a interface de conta, formulário de relato e acompanhamento da decisão, usando os contratos reais da API.

Detalhes e critérios de segurança no [[03 Backend/Publicacao e moderacao|fluxo de publicação e moderação]].

## 3 · Evoluir a consulta e o MVP

- [ ] **BE-05** Implementar confirmações independentes, resolução, denúncias e auditoria de mudanças.
- [ ] **FE-03** Implementar busca de bairro/endereço com Geocoding. Validar sincronização de área, limite de resultados e acessibilidade.
- [ ] **BE-06** Integrar Azure Blob privado com validação de fotos e URLs de leitura curtas.
- [ ] **BE-07** Implementar alertas no aplicativo e, depois, outbox e Web Push com consentimento e deduplicação.

## 4 · Implantar e demonstrar

- [ ] **INF-03** Definir VM, região, orçamento, IP administrativo e domínio efetivo da Azure.
- [ ] **INF-04** Configurar publicação de imagens no GHCR e instalação na VM. Validar DNS, HTTPS, portas e recuperação após reinício.
- [ ] **INF-05** Fazer backup e restaurar em ambiente isolado. Registrar evidências e preparar demonstração com dados simulados.

Consulte [[04 Infra/Azure e HTTPS]] para as portas, dependências e limites.
