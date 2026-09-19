# Ocorrências Service

**Responsabilidade:** registro de ocorrências do cidadão (coleta não
realizada, acúmulo irregular, container danificado, descarte de entulho) e
consulta por protocolo. Ao mudar o status de uma ocorrência, publica um
evento no Message Broker — não envia notificação diretamente.

**Dado próprio:** MongoDB (documentos com estrutura variável entre tipos de
ocorrência).

**Contrato:** `POST /ocorrencias`, `GET /ocorrencias/{protocolo}`.
**Evento publicado:** `ocorrencia.status.alterado`.

**Status:** esqueleto — protótipo funcional em `/prototipo`, sem a parte de
mensageria ainda. Implementação completa prevista para a Etapa 3.
