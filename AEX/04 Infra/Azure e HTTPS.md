# Azure e HTTPS

[[04 Infra/Infraestrutura]] · [[04 Infra/Docker e Caddy]] · [[04 Infra/GitHub e automacao]]

**Estado** · Arquitetura definida. Provisionamento, DNS público, TLS e recuperação ainda precisam de execução e evidência.

Use VM Ubuntu LTS, IP público Standard estático e o FQDN efetivamente retornado pelo rótulo DNS da Azure. O formato de referência é `<label>.<região>.cloudapp.azure.com`. O rótulo não exige a compra de domínio, e o Caddy pode emitir certificado via Let's Encrypt. VM, disco, IP e outros serviços podem consumir orçamento da assinatura.

## Rede

| Prioridade | Entrada | Origem |
| --- | --- | --- |
| 100 | `Allow-HTTPS-Inbound-443-TCP-Internet` | Internet |
| 110 | `Allow-HTTP-Inbound-80-TCP-Internet` | Internet |
| 200 | `Allow-SSH-Inbound-22-TCP-Admin` | IP administrativo /32 |
| 4000 | `Deny-All-Inbound` | Qualquer origem, conforme a arquitetura da VM dedicada |

O destino proposto é o IP privado da NIC dedicada. Confira regras efetivas e exceções necessárias antes de aplicar a regra 4000, que também afeta tráfego normalmente aceito dentro da VNet. API, MySQL e checks internos seguem privados.

## Preparação

- Defina região, tamanho, orçamento, DNS e IP administrativo. A arquitetura sugere começar com pelo menos 2 GiB e medir consumo.
- Confirme DNS, portas do host, relógio e conectividade de saída. Defina `DOMAIN`, `ACME_EMAIL`, `WEB_BIND_IP=0.0.0.0`, `WEB_HTTP_PORT=80` e `WEB_HTTPS_PORT=443` no `.env` de produção.
- Valide redirecionamento HTTP, certificado do domínio, catálogo pelo proxy e persistência após reboot. Registre a data e a revisão.
- Proteja os volumes MySQL e Caddy. Prepare backup externo do banco e faça uma restauração isolada antes da demonstração.
- Para fotos, crie armazenamento Blob privado quando o fluxo estiver pronto. O backend mantém a credencial e fornece URLs de leitura temporárias.

Tarefas **INF-03** a **INF-05** em [[00 Projeto/Pendencias e proximos passos]].
