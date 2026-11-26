# Sistema de design da home do AEX

O [mockup](design-home.png) mostra a referência da consulta em desktop e celular com ocorrências de demonstração e cartografia ilustrativa.

## Composição

- Desktop. Cabeçalho branco de 64 px, mapa por toda a área de consulta, lista de aproximadamente 340 px sobre o canto superior esquerdo e detalhes da seleção no canto inferior direito. Inset de 24 px. Encaminhar o foco para a lista pelo link de atalho. Reservar espaço no enquadramento para os painéis e a autoria do mapa.
- Até 760 px. Cabeçalho compacto, mapa em primeiro lugar e painel de resultados abaixo, com cantos superiores arredondados. Filtros recolhíveis acima do mapa. Detalhes no item selecionado. A alça ilustrada no mockup só deve aparecer se o painel aceitar arraste e também puder ser operado por teclado e toque sem arrastar.
- Lista. Uma linha por relato com ícone de contorno, tipo, contexto disponível e horário alinhado à direita. Usar os campos retornados pela API. Mostrar bairro somente quando houver dado correspondente. Manter fonte, atualidade e indicação das simulações disponíveis na interface.
- Filtros. Situação em controle segmentado com “Ativas” e “Resolvidas”. “Filtros” abre Tipo e Atualidade. Lista e mapa compartilham a mesma seleção. Exibir contagem, estados de carregamento, vazio e erro com tentativa de recuperação.

## Tokens CSS

| Token | Valor | Aplicação |
| --- | --- | --- |
| `--canvas` | `#F6F9FE` | Fundo geral |
| `--surface` | `#FFFFFF` | Painéis e controles |
| `--ink` | `#202632` | Texto e ícones |
| `--muted` | `#4B5C73` | Metadados e texto secundário |
| `--line` | `#DCE5F2` | Divisórias e contorno decorativo |
| `--control-border` | `#7588A2` | Contorno que identifica controles quando necessário |
| `--hover` | `#EDF5FF` | Fundo ao passar o cursor |
| `--selected` | `#DEEBFF` | Fundo da linha selecionada, com contorno e estado acessível |
| `--active` | `#B8D7FF` | Estado “Ativa” e detalhe do marcador selecionado |
| `--focus` | `#2356a3` | Foco visível com contorno de 2 px e afastamento de 3 px |
| `--panel-shadow` | `0 8px 28px rgb(32 38 50 / 10%)` | Elevação dos painéis flutuantes |

- No modo escuro, o fundo usa `#0D0D0E`, os painéis `#181819`, o hover `#232325` e a seleção `#2C2C2F`. Texto principal `#F1F1F2`, texto secundário `#AEAFB4` e azul de foco `#ADCCFF`. A preferência fica no menu do perfil e é salva neste navegador.
- Tipografia Geist, com fallback para system-ui. Título 24/28 px e peso 650. Linhas 15/20 px e peso 600 para o tipo. Rótulos e metadados 13–14/18–20 px. Horários com numerais tabulares.
- Espaçamento de 4, 8, 12, 16, 24 e 32 px. Raios de 8 px nos controles, 10 px nas linhas selecionadas e 16 px nos painéis. Áreas de toque com pelo menos 44 px.
- Usar ícone, texto e contorno para comunicar seleção e situação, inclusive quando a cor tiver baixa percepção.

## Movimento

| Interação | Animação |
| --- | --- |
| Selecionar relato | Fundo da linha em 150 ms e um único pulso do marcador em 360 ms |
| Abrir detalhes | Opacidade e deslocamento vertical de 6 px em 200 ms |
| Abrir filtros | Opacidade e ajuste de altura em até 200 ms |
| Movimento reduzido | Aplicar o estado final imediatamente e evitar deslocamento animado do mapa |

Usar `cubic-bezier(.2, .8, .2, 1)` nas entradas. Animar o elemento interno do marcador para preservar o posicionamento do Mapbox. Evitar pulsos contínuos e animações disparadas por atualizações periódicas da API.

## Implementação

A imagem de referência evidencia padrões visuais. A tecnologia da interface original não pode ser identificada a partir da captura. O AEX já tem React, TypeScript, Vite, Tailwind CSS, Lucide e Mapbox GL JS. Usar o CSS existente como base para os tokens, o layout responsivo e as transições.

O mapa usa Mapbox Standard em `monochrome`, com iluminação `day` e cores cartográficas específicas para o modo escuro, projeção Mercator, objetos 3D desativados e pontos de interesse reduzidos. A cartografia real depende dos dados do provedor. A integração lê o token público em `VITE_MAPBOX_TOKEN` e mantém a atribuição do mapa visível. A imagem de contingência tem a indicação “Mapa ilustrativo”. [Mapbox Standard](https://docs.mapbox.com/map-styles/reference/standard/) · [Mapbox Studio](https://docs.mapbox.com/console-tools/studio/)

A navegação do mapa é limitada à extensão de Blumenau, com máscara fora do contorno municipal oficial. No tema escuro, o terreno usa tons de grafite e as vias são claras.
