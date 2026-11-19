# Frontend

[[Inicio AEX]] · [[02 Frontend/Mapa e consulta]] · [[02 Frontend/Dependencias Node]] · [[03 Backend/Backend]]

React, Vite e TypeScript compõem a aplicação web. Tailwind e componentes no padrão shadcn/ui dão a base visual. O layout responsivo concentra o mapa e a lista de ocorrências na mesma tela.

| Caminho no repositório | Responsabilidade |
| --- | --- |
| `frontend/src/app/App.tsx` | Composição da página, filtros e estados da consulta |
| `frontend/src/features/map/` | Integração Mapbox, marcadores e área visível |
| `frontend/src/features/occurrences/` | Catálogo, tipos, cards e atualização |
| `frontend/src/components/ui/` | Componentes reutilizáveis |
| `frontend/src/lib/api.ts` | Cliente HTTP para `/api` |
| `frontend/src/styles.css` | Identidade visual e responsividade |
| `frontend/vite.config.ts` | Vite e proxy para API local na porta 8000 |

O build TypeScript/Vite passou, e a tela abriu no navegador local. A lista diferencia carregamento, erro e ausência de relatos. Na falha do banco há mensagem recuperável. Os futuros fluxos de login, escrita, moderação, fotos e alertas ainda precisam de telas e contratos.

As tarefas da interface ficam em [[00 Projeto/Pendencias e proximos passos]].
