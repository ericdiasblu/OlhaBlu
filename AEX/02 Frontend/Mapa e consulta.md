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

## Área atendida e paleta

- `frontend/src/features/location/blumenau.ts` usa duas camadas do [GEO Blumenau](https://geo.blumenau.sc.gov.br/server/rest/services/Limites/). `Limite_Municipal/MapServer/0` fornece o polígono. `Bairros/MapServer/0` fornece as 35 feições. Ambas foram consultadas em GeoJSON com `outSR=4326`. O catálogo local usa um ponto interno por bairro, calculado a partir da geometria oficial. Atualizar os JSON em conjunto se os limites mudarem.
- O Mapbox restringe a câmera à caixa da cidade e mascara a área fora do polígono. A API continua recebendo uma caixa delimitadora, recortada à extensão municipal. O formulário verifica o polígono no navegador. A validação territorial também deve existir no backend antes de aceitar relatos reais.
- No escuro, o logo fica branco e o mapa usa fundo grafite e vias claras. O estilo troca no mesmo mapa, preservando a câmera. Sem token continua disponível a ilustração, identificada como tal.
- O catálogo oferece nomes oficiais sem depender de Geocoding. Existem apenas exemplos de busca por rua até que o provedor seja ligado.
