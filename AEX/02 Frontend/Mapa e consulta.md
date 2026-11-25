# Mapa e consulta

[[02 Frontend/Frontend]] · [[03 Backend/Backend]] · [[01 Produto/Requisitos e escopo]]

O mapa abre em Blumenau com um token público Mapbox. A movimentação define o recorte lido pela API. A localização física é solicitada somente quando a pessoa aciona o controle de geolocalização. A base atual usa a localização apenas no mapa, sem enviar evidência ao backend.

- O frontend consulta a caixa delimitadora no formato oeste, sul, leste, norte. Mover a região consultada não altera a futura posição de elegibilidade.
- Os filtros de tipo, situação e atualidade são enviados à API. A lista acompanha o resultado da área visível.
- O polling roda a cada 15 segundos com a aba visível e conexão disponível. Cada resultado substitui a lista e os marcadores. A interface pede aproximação do mapa quando há mais de 100 registros no recorte.
- Detalhes exibem origem, situação, datas e indicação **SIMULAÇÃO** para os exemplos. Datas são exibidas no fuso de São Paulo.
- `VITE_MAPBOX_TOKEN` é público e entra no build. Defina em `frontend/.env` para Vite local ou no `.env` da raiz para Compose e recompile a imagem.
- Sem token, a interface exibe um mapa ilustrativo identificado. Com o banco ativo, a consulta pela lista continua disponível.

Em 25/11/2026, o Mapbox Standard monocromático carregou com token público. Zoom, filtros, seleção e recuperação de erro foram exercitados com respostas simuladas da API. Os dropdowns também foram testados por teclado em desktop e celular. Ainda falta repetir o fluxo com banco populado e testar a recuperação com os serviços reais. Veja **FE-01** e **FE-03** em [[00 Projeto/Pendencias e proximos passos]].
