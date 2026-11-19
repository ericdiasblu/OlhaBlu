# Auditoria de dependências Node

[[06 Historico/Linha do tempo]] · [[02 Frontend/Dependencias Node]] · [[05 Decisoes/Registro de decisoes#D06 · Registro oficial do npm]]

Eric pediu verificar as bibliotecas instaladas, buscar ocorrências conhecidas de código malicioso ou vulnerabilidades e confirmar a origem oficial de cada dependência. A auditoria cruzou o lockfile, metadados e hashes do registro público. Os pacotes dentro do tarball do Tailwind foram verificados pelo hash do pacote pai e pelos manifests internos.

Foram confirmadas 116 entradas, incluindo 16 dependências diretas. A comparação com instalação limpa encontrou zero diferenças em 6.538 arquivos de pacote. `npm audit` retornou zero vulnerabilidades conhecidas e `npm audit signatures` passou. O build do frontend passou.

O trabalho fixou o registro em `frontend/.npmrc` e adicionou verificação prévia de origem e hash ao Docker e ao CI. As versões do lockfile foram preservadas. Essa auditoria registra as evidências obtidas na ocasião.
