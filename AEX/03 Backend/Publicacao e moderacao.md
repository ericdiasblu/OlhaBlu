# Publicação e moderação

[[03 Backend/Backend]] · [[03 Backend/Banco e migracoes]] · [[05 Decisoes/Registro de decisoes#D03 · Consulta pública e publicação moderada]]

Esta nota detalha o comportamento planejado. A base atual oferece somente leitura do catálogo e dos relatos publicados.

1. A escrita exige conta autenticada. O backend define o papel e a origem do relato.
2. O servidor considera evidência temporária enviada com permissão e marca o instante de recebimento. Calcula distância ao ponto informado e considera a precisão.
3. Uma amostra válida, próxima e recente habilita publicação direta ou contribuição elegível. Uma amostra ausente, antiga, imprecisa ou distante encaminha a proposta para a fila.
4. Quem está distante ainda pode contribuir. A proposta fica visível apenas ao autor e à moderação. A decisão de aprovar, rejeitar ou pedir correção fica registrada com justificativa.
5. A aprovação de relato remoto mantém a origem comunitária. A publicação aceita pode gerar alerta. Uma denúncia segue análise própria e uma confirmação conta por pessoa e ocorrência.

## Parâmetros para confirmar

| Parâmetro | Proposta v1.2 |
| --- | --- |
| Raio para publicação direta | 300 m |
| Idade máxima da evidência de contribuição | 30 min |
| Precisão máxima aceitável | 100 m |
| Validade da posição para alertas | 30 min |
| Raio para alertar | 1.000 m |
| Atualidade de uma ocorrência | 48 h, já configurada para leitura na base |
| Encerramento comunitário | 2 confirmações independentes |
| Limite de novos relatos por conta | 10 por hora, com proteção adicional por IP proposta |

## Critérios de aceite

- Consulta pública funciona sem GPS e sem destino. Escrita verifica identidade e permissões do objeto.
- Relato remoto só aparece após aprovação. Pessoa comum não aprova conteúdo, não atribui origem oficial e não acessa pendências de terceiros.
- Edição cosmética conserva a data da última confirmação. Quando uma edição remota está em análise, o público vê a última versão aprovada.
- Evidência tem retenção curta e acesso privado. Registro e logs preservam apenas a informação mínima exigida.
- Alertas de publicação respeitam a distância, consentimento e deduplicação. Web Push complementa o alerta disponível no app.

Sequência de trabalho em [[00 Projeto/Pendencias e proximos passos]].
