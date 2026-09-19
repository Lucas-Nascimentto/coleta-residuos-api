# Coleta Service

**Responsabilidade:** cadastro de bairros e cronograma de coleta domiciliar e
seletiva; cálculo dinâmico da próxima coleta e do status operacional do dia.

**Dado próprio:** PostgreSQL, com réplica de leitura para absorver picos de
consulta. Cache Redis na frente das rotas de leitura mais acessadas.

**Contrato:** `GET /bairros`, `GET /bairros/{id}/coleta`, `GET /bairros/{id}/status`.

**Status:** esqueleto — um protótipo funcional destas rotas já existe em
`/prototipo` (servidor Node.js) como prova de conceito do contrato de dados.
