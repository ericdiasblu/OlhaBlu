# Frontend

[[Inicio AEX]] · [[02 Frontend/Mapa e consulta]] · [[02 Frontend/Dependencias Node]] · [[03 Backend/Backend]]

React, Vite e TypeScript compõem a aplicação web. Tailwind e componentes no padrão shadcn/ui dão a base visual. O layout responsivo concentra o mapa e a lista de ocorrências na mesma tela.

| Caminho no repositório | Responsabilidade |
| --- | --- |
| `frontend/src/app/` | Cabeçalho, navegação por hash e estilos dos fluxos responsivos |
| `frontend/src/features/map/` | Home de consulta, integração Mapbox, marcadores, área visível e contribuições de demonstração |
| `frontend/src/features/occurrences/` | Catálogo, tipos, cards e atualização |
| `frontend/src/features/workspace/` | Conta, formulário e revisão de relato, acompanhamento, moderação, alertas e estado de demonstração |
| `frontend/src/components/ui/` | Componentes reutilizáveis |
| `frontend/src/lib/api.ts` | Cliente HTTP para `/api` |
| `frontend/src/styles.css` | Identidade visual e responsividade |
| `frontend/vite.config.ts` | Vite e proxy para API local na porta 8000 |

O mapa e a lista consultam a API de leitura. Os fluxos de escrita e conta podem ser percorridos no frontend em uma sessão de demonstração, com **Entrar como morador** e **Testar moderação**. Os dados da sessão ficam em memória, incluindo as fotos, e são descartados ao recarregar. A validação do formulário roda no navegador e as senhas fictícias não são armazenadas nem enviadas.

O estado simulado fica em `demo-workspace.ts`. Ao integrar a API, substituir as ações de sessão, relato, contribuição, moderação e alertas pelos contratos do backend, incluindo autorização, erros, paginação e estados assíncronos. A busca por bairro ou endereço usa um catálogo limitado de locais de exemplo. A preferência de notificações do navegador ainda é simulada.

As evidências estão em [[06 Historico/2026-11-25 - Fluxos frontend OlhaBlu]]. As tarefas restantes ficam em [[00 Projeto/Pendencias e proximos passos]].
