# Refinos de interface, tema e território

[[Inicio AEX]] · [[02 Frontend/Frontend]] · [[02 Frontend/Mapa e consulta]] · [[00 Projeto/Pendencias e proximos passos]]

## Já entregue

| Área | Comportamento atual | Onde mexer |
| --- | --- | --- |
| Navbar | Os controles compartilham tipografia, altura e raio de 8 px. Para moradores, a ordem é Explorar mapa, Meus relatos e Sobre. Alertas é um sino com contador e nome acessível. O perfil abre o menu com Modo escuro e Sair. Criar conta e Entrar aparecem para visitantes. | `frontend/src/app/App.tsx`, `workspace.css` |
| Registrar ocorrência | O botão com texto fica em Meus relatos. A home usa um botão + flutuante, com raio de 8 px, para moradores logados. Formulário de uma coluna, com revisão antes do envio. As explicações sobre análise, correção e dados temporários ficam em Sobre. | `App.tsx`, `features/workspace/report-page.tsx` |
| Meus relatos | Estado inicial centralizado com um único CTA e sem filtros. A lista com dados tem filtro Situação, tipo e selo na mesma linha, bairro e horário abaixo. Ao expandir, descrição e miniatura ficam lado a lado no desktop e empilhadas no celular. Ampliar foto abre um diálogo. Correção solicitada tem motivo nos detalhes e ação na linha. O aviso de envio de um novo relato foi removido. | `features/workspace/activity-pages.tsx`, `report-page.tsx` |
| Moderação | A fila vazia e o histórico ocupam toda a largura. Com itens, os detalhes aparecem ao lado no desktop e abaixo da seleção no celular. A análise separa descrição, foto ampliável, decisão e justificativa. O aviso de demonstração fica abaixo do título. A decisão aparece no Histórico, sem a faixa de sucesso anterior. | `features/workspace/activity-pages.tsx` |
| Alertas | Sem alertas, há um link para Meus relatos. Com alertas, os filtros Todos e Não lidos exibem a contagem. Dá para marcar individualmente ou em lote. Preferências usam interruptores com rótulos acessíveis e a ação de leitura permanece simulada. | `features/workspace/activity-pages.tsx` |
| Tema | Visitantes alternam pelo ícone junto de Entrar. Após login, o controle fica no Perfil. A preferência é salva em `localStorage` sob `olhablu-theme` e aplicada ao HTML antes de montar o React. O tema escuro usa fundo preto, superfícies grafite e azul de foco. O ícone da marca fica branco no escuro. O mapa muda de estilo em execução e conserva a câmera, com terreno grafite e vias claras no escuro e cartografia padrão no claro. | `frontend/index.html`, `styles.css`, `App.tsx`, `features/map/occurrence-map.tsx` |
| Blumenau | A busca cobre os 35 bairros oficiais, aceita nomes sem acento e não apresenta sugestões antes de digitar. Selecionar um bairro no formulário usa um ponto de referência interno. A navegação do mapa é limitada à extensão municipal e uma máscara oculta o exterior do contorno. O frontend impede marcar ou enviar pontos externos. A busca por rua ainda só tem endereços de exemplo. | `features/location/`, `features/map/`, `features/workspace/report-page.tsx` |

Os caminhos abreviados partem de `frontend/src/`. A paleta, a tipografia, o movimento e os raios estão descritos em `docs/design-home.md`.

## Reprodução e evidências

- Para simular o fluxo, entre como morador, use **Ver exemplos** no mapa e crie um relato. Saia pelo Perfil, entre com **Testar moderação** e revise o relato. Volte à conta de morador para conferir o resultado. Trocar de conta durante a mesma visita mantém os exemplos. Recarregar a página limpa os dados da sessão, inclusive fotos e alertas de demonstração. O tema permanece salvo.
- Validação anterior no Edge entre 320 e 1365 px, conforme o fluxo. Foram exercitados perfil e sino, os estados vazio e preenchido de Meus relatos, foto ampliada com retorno de foco por Escape, fila de moderação em uma e duas colunas, leitura e filtros de alertas e interruptores.
- Com o Mapbox real, um clique fora da cidade foi rejeitado e a consulta ao afastar o zoom permaneceu dentro da extensão municipal. A troca claro → escuro → claro foi verificada no navegador com a página aberta. A API de ocorrências usou respostas de teste.
- Consulte [[00 Projeto/Estado e verificacoes]] para o estado da base real e [[02 Frontend/Mapa e consulta]] para fonte e estratégia geográfica.

## Continuidade

1. Subir o Compose em uma máquina com Docker e MySQL, aplicar a migração, confirmar os sete tipos via Caddy e testar consulta, indisponibilidade e recuperação com o frontend.
2. Implementar autenticação e moderação no servidor. Fazer o backend validar o polígono oficial e rejeitar coordenadas externas, inclusive em requisições diretas. Alinhar autorização e critérios de proximidade antes de habilitar escrita real.
3. Integrar busca de endereços, anexos com armazenamento privado, confirmações, denúncias e alertas. Preservar as separações entre a consulta pública, rascunhos, fila e histórico.
4. Em implantação, confirmar a configuração de HTTPS e executar smoke test, backup e restauração. A mudança local de porta HTTPS de 8443 para 443 em `.env.example` e `compose.yaml` já existia e ficou fora do commit de interface e documentação. Validar antes de publicar essa mudança.

Checklist com prioridades e dependências em [[00 Projeto/Pendencias e proximos passos]].
