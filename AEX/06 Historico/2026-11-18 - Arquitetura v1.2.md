# 18/11/2026 · Da leitura técnica à arquitetura v1.2

[[06 Historico/Linha do tempo]] · [[05 Decisoes/Registro de decisoes]] · [[01 Produto/Fontes do projeto]]

Eric pediu ler toda a pasta `docs`, entender o problema e estimar a dificuldade antes de escolher a implementação. A resposta inicial considerou Android com Expo/React Native, Java/Spring Boot, PostgreSQL/PostGIS e Docker Compose. A estimativa inicial de aproximadamente 6/10 para MVP e 8/10 para a versão completa era uma proposta de planejamento. Os pontos mais complexos eram publicação, confirmação, alertas e rotas.

Na conversa seguinte, Eric especificou que a pessoa pode consultar o mapa de casa, sem viagem ou destino. A comparação com Waze explicava o papel da colaboração. Também definiu que somente quem está próximo ou passou recentemente pode contribuir diretamente. Relatos de longe entram na fila de moderação.

A revisão da arquitetura recebida consolidou React/Vite/TypeScript, FastAPI, MySQL, Mapbox e Blob externo. Eric aprovou Compose principal, health checks, políticas de reinício, redes separadas, Azure VM, DNS gratuito, HTTPS via Caddy e regras NSG nomeadas.

A versão 1.2 foi salva em Markdown e PDF em `docs/final/`. Foram analisados o YAML de referência e o Caddyfile. A validação da revisão era estrutural e a execução real na VM ficou pendente. O pedido “continue de onde parou” concluiu a conferência dessa documentação.
