# Como usar e levar o vault

[[Inicio AEX]] · [[06 Historico/Linha do tempo]] · [[04 Infra/GitHub e automacao]]

Na cópia atual, o vault existente é a pasta interna `AEX/` do repositório. Abra essa pasta no Obsidian e procure **Inicio AEX**. Para levar só a memória do projeto, copie essa pasta inteira. Para levar também o código e os documentos acadêmicos, preserve a estrutura completa do repositório e abra o vault interno na nova cópia.

As notas usam caminhos relativos ao vault e funcionam no Obsidian sem plugin comunitário. Os caminhos de código e PDFs nas notas são relativos à raiz do repositório. O índice em [[01 Produto/Fontes do projeto|Fontes do projeto]] também aponta para o GitHub privado. As anotações contêm o contexto necessário para retomar o trabalho, inclusive quando o código estiver em outro checkout.

## Onde registrar cada mudança

| Se mudou… | Atualize… |
| --- | --- |
| Uma tarefa foi concluída ou apareceu um bloqueio | [[00 Projeto/Pendencias e proximos passos]] |
| Uma entrega foi implementada ou validada | [[00 Projeto/Estado e verificacoes]] e a nota da área |
| Uma escolha do grupo mudou | [[05 Decisoes/Registro de decisoes]], com motivo e impacto |
| Houve uma sessão de trabalho ou discussão | [[06 Historico/Linha do tempo]], com um link para a sessão |
| Mudou o comando público de instalação | O passo correspondente no README. O restante do contexto fica nas notas |

Para uma nova sessão, crie uma nota em **06 Historico** com data, pedido, decisão, trabalho realizado, evidência e próxima ação. Ligue a sessão às áreas que ela afetou. Mantenha no vault nomes de variáveis e referências a credenciais, e guarde os valores nos arquivos de ambiente da máquina de trabalho.

## Visualizar as conexões

No Obsidian, abra **Grafo** pela paleta de comandos. Para focar um assunto, abra uma nota e use **Grafo local**. As cores salvas agrupam projeto, produto, frontend, backend, infraestrutura, decisões e histórico. [Ajuda oficial do Obsidian sobre o grafo](https://obsidian.md/help/plugins/graph).
