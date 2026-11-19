# Desenvolvimento sem Docker

[[04 Infra/Infraestrutura]] · [[02 Frontend/Frontend]] · [[03 Backend/Banco e migracoes]]

Use este caminho em um computador sem acesso ao Docker Engine. Node.js 24.4.0 e Python 3.13.5 são as versões de referência. Os comandos abaixo partem da raiz do repositório, uma pasta acima do vault.

## Preparar a instalação

~~~powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install --require-hashes -r backend/requirements.txt
node frontend/scripts/check-npm-sources.mjs
npm --prefix frontend ci
~~~

Em Linux ou macOS, use `backend/.venv/bin/python` no segundo comando. Faça cópias de `backend/.env.example` e `frontend/.env.example` como `.env` nos respectivos diretórios ao configurar a máquina pela primeira vez. Preserve os valores de um `.env` que já exista.

## Iniciar e verificar

~~~sh
npm run dev
~~~

- [Frontend Vite](http://127.0.0.1:5173) e [documentação da API](http://127.0.0.1:8000/api/docs).
- Use `npm run dev:web` ou `npm run dev:api` para iniciar um serviço por vez.
- A inicialização sem banco permite validar a tela e `/api/info`. Para listar dados, configure o servidor e aplique a revisão em [[03 Backend/Banco e migracoes]].
- Para carregar o mapa, configure o token no ambiente do frontend e reinicie o Vite. [[02 Frontend/Mapa e consulta]].

Para a validação integrada dos três serviços e volumes, use [[04 Infra/Docker e Caddy]] em outro PC.
