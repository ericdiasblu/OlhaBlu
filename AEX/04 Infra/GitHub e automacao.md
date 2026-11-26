# GitHub e automação

[[Inicio AEX]] · [[04 Infra/Infraestrutura]] · [[06 Historico/Base inicial e GitHub]]

O repositório privado foi criado como `ericdiasblu/AEX` e renomeado para `ericdiasblu/OlhaBlu`. A branch `main` recebeu o commit inicial `0f0fcbb`, verificado no remoto. A cópia local acompanha `origin/main`. O commit inclui código, documentos acadêmicos e arquitetura. [Repositório do AEX](https://github.com/ericdiasblu/OlhaBlu).

Para retomar em outro PC, clone ou atualize o repositório, confira `git log -1 --oneline` e abra a pasta interna `AEX/` no Obsidian. Use `git status --short --branch` para identificar alterações locais e os arquivos `.env.example` para recriar os ambientes.

## Automação do projeto

`.github/workflows/ci.yml` tem build frontend, checagem Python, validação de origem npm e um job que monta o Compose, inicia containers e verifica o HTML e os sete tipos do catálogo via Caddy. Confira o resultado da revisão em [GitHub Actions](https://github.com/ericdiasblu/OlhaBlu/actions).

## Caminho de implantação

A proposta é publicar as imagens de API e web no GHCR usando a mesma tag de revisão e instalar inicialmente via SSH com origem administrativa restrita. GHCR e deploy ainda são etapas planejadas. Consulte [[04 Infra/Azure e HTTPS]].
