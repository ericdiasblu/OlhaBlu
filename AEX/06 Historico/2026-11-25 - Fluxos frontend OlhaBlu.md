# Fluxos frontend do OlhaBlu

[[02 Frontend/Frontend]] · [[00 Projeto/Estado e verificacoes]] · [[00 Projeto/Pendencias e proximos passos]]

## Entrega

- Cabeçalho com **Entrar** e **Criar conta**. Botão principal com texto branco, fundo azul e inversão no hover.
- Cadastro e login demonstrativos, atalhos de morador e moderação, proteção de navegação por perfil simulado e saída de sessão.
- Registro de ocorrência com tipo, descrição, seleção de local, foto opcional, revisão e envio para análise. Acompanhamento por situação, solicitação de correção, edição e reenvio.
- Fila de moderação com justificativa, aprovação, rejeição, solicitação de correção, denúncias e histórico. Centro de alertas com leitura e preferências de demonstração.
- Busca no mapa por bairros e endereços de exemplo, consulta de relatos simulados, confirmação, indicação de resolução e denúncia. Relatos em análise ficam fora do mapa público.
- Componentes em Geist com os mesmos tokens azuis, foco visível, layouts responsivos e transições curtas que respeitam a preferência por movimento reduzido.

## Evidência

Build TypeScript/Vite aprovado. Fluxos de conta, registro com foto, correção, moderação e alertas exercitados no Edge em 1440, 390 e 320 px com dados de teste. Confirmação, indicação de resolução e denúncia também testadas no desktop. O hover de **Criar conta** foi verificado no navegador. Com Mapbox real, a busca por local atualizou o recorte da consulta e o formulário aceitou um ponto clicado no mapa.

## Próximas integrações

Subir a base com MySQL real. Em seguida, trocar o estado de demonstração por autenticação e autorização no servidor e conectar registro, edição, moderação e contribuições à API. Integrar Geocoding, armazenamento privado de fotos e alertas com Web Push após os serviços correspondentes. As decisões simuladas, fotos e preferências só valem na sessão do navegador.
