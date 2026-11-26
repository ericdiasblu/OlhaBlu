# Requisitos e escopo

[[01 Produto/Produto e pesquisa]] · [[05 Decisoes/Registro de decisoes]] · [[00 Projeto/Pendencias e proximos passos]]

A numeração abaixo segue a consolidação técnica v1.2. As primeiras versões acadêmicas usaram outra organização. A evolução aparece em [[06 Historico/Linha do tempo]].

| RF | Escopo vigente | Estado |
| --- | --- | --- |
| RF01 | Mapa e lista de ocorrências de Blumenau | Mapa real validado com token. Falta validar consulta com MySQL populado |
| RF02 | Registro com tipo, descrição, local e foto opcional | Cadastro, revisão e envio demonstrativos. Publicação no servidor pendente |
| RF03 | Alertas no app e Web Push quando suportado | Central demonstrativa. Entrega real e Web Push pendentes |
| RF04 | Detalhes, origem, situação, datas, confirmação e fotos | Detalhes publicados disponíveis. Confirmação e prévia de foto demonstrativas |
| RF05 | Explorar regiões e buscar bairro ou endereço | Mapa limitado ao município, com 35 bairros oficiais e busca de ruas de exemplo. Geocoding pendente |
| RF06 | Situação ativa ou resolvida e atualidade independente | Leitura e filtros implementados. Mudanças de situação pendentes |
| RF07 | Filtros por tipo, situação e área | Implementado na consulta, com limite visível na interface |
| RF08 | Datas de registro e atualização | UTC na API e `America/Sao_Paulo` na tela |
| RF09 | Consentimento e controle de alertas | Preferências simuladas na central. Consentimento real pendente |
| RF10 | Denunciar informação incorreta e encaminhar para análise | Fluxo demonstrativo do envio à fila. Integração pendente |
| RF11 | Rotas alternativas | Adiado. O MVP abre sem destino, Directions ou histórico de trajeto |
| RF12 | Indicar origem e confirmação comunitária | Origem modelada e apresentada. Confirmação e fonte oficial real pendentes |

Prioridade de apresentação proposta na arquitetura v1.2 · mapa, regra de publicação e moderação, depois alertas na tela. Web Push entra na demonstração se estiver validado. A data de **01/12/2026** apareceu como marco sugerido e depende de confirmação do grupo.
