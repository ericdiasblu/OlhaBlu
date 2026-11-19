# Estado e verificações

[[Inicio AEX]] · [[00 Projeto/Pendencias e proximos passos]] · [[06 Historico/Linha do tempo]]

| Frente | O que existe | Evidência | O que falta |
| --- | --- | --- | --- |
| Frontend | Tela responsiva, filtros, detalhes, polling e Mapbox condicionado a token | Tela aberta no navegador local. Build TypeScript/Vite aprovado | Mapa real, busca por endereço e integração completa com dados |
| Backend | API de consulta, regras de visibilidade, migração inicial, catálogo e dados de demonstração opcionais | API inicializada e proxy respondeu. `/health/live` retornou 200; prontidão e consulta retornaram 503 sem banco. SQL da migração gerado | Migração aplicada em MySQL real e consulta com dados validada |
| Docker e Caddy | Compose de três serviços, imagens com múltiplos estágios e job de smoke test | Compose aceito nos modos local e HTTPS. Caddy aceito. Imagens e pacotes Python verificados para Linux x64 e ARM64 | Build e execução reais de containers, com resultado registrado |
| Segurança npm | Registro fixado e verificação de origem no CI e no Docker | 116 entradas auditadas, 6.538 arquivos idênticos à instalação limpa, assinaturas válidas e zero alertas conhecidos na consulta | Repetir a auditoria quando o lockfile mudar |
| GitHub | Repositório privado `ericdiasblu/AEX` e branch `main` | Commit inicial `0f0fcbb` confirmado no remoto na criação | Atualizar a cópia do computador que vai executar os containers |
| Produção | Arquitetura de referência com VM Azure, DNS, Caddy e NSG | Documento v1.2 consolidado | Recursos provisionados, validação de TLS, backups, deploy e operação |

**Próximo marco** · MySQL, API e Caddy saudáveis em Docker real, catálogo com sete tipos pelo proxy, mapa preenchido com exemplos sinalizados após configurar o token.

## Como ler os estados

- **Implementado** · Há código ou configuração para a função.
- **Validado localmente** · Há observação de comportamento neste PC ou validação estática indicada na tabela.
- **Pendente de integração** · A combinação real dos serviços ainda precisa rodar.
- **Planejado** · A arquitetura descreve o fluxo e o código ainda precisa ser escrito.
- **Adiado** · O requisito entra em consideração depois do MVP.

Detalhes por área em [[02 Frontend/Frontend]], [[03 Backend/Backend]] e [[04 Infra/Infraestrutura]].
