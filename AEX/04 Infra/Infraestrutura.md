# Infraestrutura

[[Inicio AEX]] · [[04 Infra/Docker e Caddy]] · [[04 Infra/Azure e HTTPS]] · [[04 Infra/GitHub e automacao]] · [[04 Infra/Desenvolvimento sem Docker]]

O plano de produção usa uma VM Azure Linux com Docker Compose e três serviços persistentes. Caddy serve o frontend e encaminha `/api` à API. A API acessa MySQL pela rede interna. Azure Blob Storage fica fora da VM e entra quando o fluxo de fotos for implementado.

| Ambiente | Entrada | Estado |
| --- | --- | --- |
| Desenvolvimento local | Vite em `127.0.0.1:5173`, Uvicorn em `127.0.0.1:8000` | Inicialização e comunicação observadas |
| Compose local | Caddy em `127.0.0.1:8080` | Configuração validada. Containers ainda precisam rodar num Engine |
| Azure | Caddy em `80/443`, com FQDN público | Planejado |

O Compose preserva MySQL e estado do Caddy em volumes. O ciclo de entrega alvo é validação em GitHub Actions, imagem com tag de commit no GHCR e instalação inicialmente por SSH. O workflow atual contém jobs de build e smoke test. Consulte [[04 Infra/GitHub e automacao]] para o estágio da publicação.
