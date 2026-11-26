# Estado e verificações

[[Inicio AEX]] · [[00 Projeto/Pendencias e proximos passos]] · [[06 Historico/Linha do tempo]]

| Frente | O que existe | Evidência | O que falta |
| --- | --- | --- | --- |
| Frontend | Home responsiva OlhaBlu, tema claro/escuro, Mapbox limitado a Blumenau, busca dos 35 bairros e fluxos de demonstração | Build aprovado. Fluxos de demonstração exercitados no Edge. Alternância de tema e limite do mapa verificados com Mapbox real e API simulada | Validar consulta com API e MySQL populado e conectar autenticação, escrita, Geocoding, fotos e alertas aos serviços reais |
| Backend | API de consulta, regras de visibilidade, migração inicial, catálogo e dados de demonstração opcionais | API inicializada e proxy respondeu. `/health/live` retornou 200; prontidão e consulta retornaram 503 sem banco. SQL da migração gerado | Migração aplicada em MySQL real e consulta com dados validada |
| Docker e Caddy | Compose de três serviços, imagens com múltiplos estágios e job de smoke test | Compose aceito nos modos local e HTTPS. Caddy aceito. Imagens e pacotes Python verificados para Linux x64 e ARM64 | Build e execução reais de containers, com resultado registrado |
| Segurança npm | Registro fixado e verificação de origem no CI e no Docker | Verificação de origem e integridade do lockfile aprovada e zero vulnerabilidades reportadas pelo npm audit em 25/11/2026 | Repetir a auditoria quando o lockfile mudar |
| GitHub | Repositório privado `ericdiasblu/OlhaBlu` e branch `main` | Commit inicial `0f0fcbb` confirmado no remoto na criação | Atualizar a cópia do computador que vai executar os containers |
| Produção | Arquitetura de referência com VM Azure, DNS, Caddy e NSG | Documento v1.2 consolidado | Recursos provisionados, validação de TLS, backups, deploy e operação |

**Próximo marco** · MySQL, API e Caddy saudáveis em Docker real, catálogo com sete tipos pelo proxy e mapa preenchido com exemplos sinalizados retornados pelo banco.

## Como ler os estados

- **Implementado** · Há código ou configuração para a função.
- **Validado localmente** · Há observação de comportamento neste PC ou validação estática indicada na tabela.
- **Pendente de integração** · A combinação real dos serviços ainda precisa rodar.
- **Planejado** · A arquitetura descreve o fluxo e o código ainda precisa ser escrito.
- **Adiado** · O requisito entra em consideração depois do MVP.

Detalhes por área em [[02 Frontend/Frontend]], [[03 Backend/Backend]] e [[04 Infra/Infraestrutura]].
