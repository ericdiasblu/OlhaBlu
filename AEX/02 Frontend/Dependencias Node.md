# Dependências Node

[[02 Frontend/Frontend]] · [[04 Infra/GitHub e automacao]] · [[06 Historico/Auditoria de dependencias Node]]

O registro oficial é `https://registry.npmjs.org/`. `frontend/.npmrc` fixa o registro e a validação de TLS. O lockfile do frontend fixa as versões e hashes. O script `frontend/scripts/check-npm-sources.mjs` verifica as URLs e rejeita origens fora do registro e entradas sem SHA-512. Um pacote embutido herda a verificação do arquivo do pacote que o inclui.

O Docker e o CI executam o script antes de instalar. Para repetir na raiz:

~~~sh
node frontend/scripts/check-npm-sources.mjs
npm --prefix frontend audit
npm --prefix frontend audit signatures
npm --prefix frontend run build
~~~

## Resultado registrado

116 entradas no lockfile · 110 baixadas diretamente do npm oficial e seis embutidas num arquivo oficial do Tailwind. Foram conferidos URL e hash dos downloads, metadados das 16 dependências diretas e os manifests das dependências embutidas. A comparação de 6.538 arquivos do ambiente atual com instalação limpa encontrou zero divergências. A auditoria retornou zero alertas conhecidos e o npm aceitou as assinaturas da instalação. A auditoria cobre alertas conhecidos na data da consulta.

Ao atualizar versões, revise o diff do lockfile e registre o novo resultado no histórico.
