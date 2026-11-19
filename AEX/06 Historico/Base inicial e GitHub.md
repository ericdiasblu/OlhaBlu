# Base inicial e GitHub

[[06 Historico/Linha do tempo]] · [[02 Frontend/Frontend]] · [[03 Backend/Backend]] · [[04 Infra/GitHub e automacao]]

Eric pediu começar a aplicação usando a arquitetura final, com estrutura inicial funcional e escopo limitado. A execução de containers e testes de infraestrutura ficaram para outra etapa. Os sete PDFs acadêmicos e a arquitetura consolidada orientaram o recorte.

Foram criados `frontend/`, `backend/`, `infra/`, migração inicial, scripts de execução, exemplos de ambiente e documentação. A tela de leitura inclui filtros, detalhes e integração Mapbox condicionada a token. A API tem consulta persistida, verificação de revisão e tratamento de indisponibilidade. Login, publicação, moderação, fotos e alertas ficaram na lista de incrementos.

A compilação do frontend e a inicialização local passaram. O proxy respondeu e o navegador exibiu a degradação esperada sem MySQL e Mapbox. O SQL da migração pôde ser gerado offline. A integração com MySQL real e token continua aberta. [[00 Projeto/Estado e verificacoes]].

Depois, Eric pediu usar a conta Git autenticada. Foi criado o repositório privado `ericdiasblu/AEX`, com a base em `main` no commit `0f0fcbb`. O hash remoto foi conferido. Arquivos de ambiente reais, dependências instaladas e temporários ficaram fora do commit. [GitHub](https://github.com/ericdiasblu/AEX).
