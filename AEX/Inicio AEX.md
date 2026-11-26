---
aliases:
  - Central do projeto
tags:
  - aex
---

# AEX · Central do projeto

Projeto Aplicado do SENAI sobre comunicação comunitária de ocorrências urbanas em Blumenau. O mapa permite consultar a cidade antes de sair de casa ou durante um deslocamento, com acesso livre à região de interesse. [[01 Produto/Produto e pesquisa|Origem do problema e pesquisa]].

## Onde estamos

**Frontend de consulta e fluxos de demonstração testados.** O OlhaBlu oferece mapa limitado a Blumenau, busca dos 35 bairros, tema escuro e fluxos de conta, relatos, moderação e alertas. A leitura real via API, MySQL e Caddy ainda precisa de validação conjunta. A escrita e a sessão continuam simuladas. [[06 Historico/2026-11-25 - Refinos UX tema e mapa|Registro mais recente]].

O [repositório privado do projeto](https://github.com/ericdiasblu/OlhaBlu) usa a branch `main` e começou no commit `0f0fcbb`. Consulte [[04 Infra/GitHub e automacao|GitHub e automação]] para comparar a cópia de trabalho com o remoto.

## Retomar o trabalho

1. Abra [[00 Projeto/Pendencias e proximos passos|Pendências e próximos passos]] para ver o que bloqueia o próximo incremento.
2. Consulte a área que vai mudar. Cada nota aponta para o código, as decisões e os critérios de validação.
3. Registre o resultado em [[06 Historico/Linha do tempo|Linha do tempo]]. Quando uma decisão mudar, atualize [[05 Decisoes/Registro de decisoes|Registro de decisões]].

| Área | Onde começar |
| --- | --- |
| Produto | [[01 Produto/Produto e pesquisa]] · [[01 Produto/Requisitos e escopo]] |
| Frontend | [[02 Frontend/Frontend]] · [[02 Frontend/Mapa e consulta]] |
| Backend | [[03 Backend/Backend]] · [[03 Backend/Banco e migracoes]] · [[03 Backend/Publicacao e moderacao]] |
| Infraestrutura | [[04 Infra/Infraestrutura]] · [[04 Infra/Docker e Caddy]] · [[04 Infra/Azure e HTTPS]] |
| Estado e memória | [[00 Projeto/Estado e verificacoes]] · [[05 Decisoes/Registro de decisoes]] · [[06 Historico/Linha do tempo]] |
| Trabalho em outro PC | [[00 Projeto/Como usar e levar o vault]] · [[04 Infra/Desenvolvimento sem Docker]] |

Abra a visualização **Grafo** no Obsidian para navegar entre as áreas. As conexões vêm dos links entre notas e as cores indicam o assunto.
