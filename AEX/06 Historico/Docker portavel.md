# Docker portátil

[[06 Historico/Linha do tempo]] · [[04 Infra/Docker e Caddy]] · [[04 Infra/GitHub e automacao]]

Eric pediu builds em múltiplos estágios para reduzir o peso das imagens e preparar a execução em outro computador com Docker Engine. O PC da escola não tinha Engine.

O backend ganhou etapa de dependências e etapa de execução. O frontend preservou a divisão Node/Caddy. O Compose ganhou modo HTTP local em loopback na porta 8080, mantendo a configuração de HTTPS público por variáveis. Foram adicionados comandos de execução e um smoke test na configuração local do GitHub Actions.

O validador oficial do Compose aceitou as duas configurações e o Caddy aceitou o arquivo nos dois modos. Imagens base, wheels Python e dependências nativas do frontend foram conferidos para Linux x64 e ARM64. Ainda não havia evidência de build e subida completos num Docker Engine. Próxima ação **INF-02** em [[00 Projeto/Pendencias e proximos passos]].
