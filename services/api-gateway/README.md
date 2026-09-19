# API Gateway

**Responsabilidade:** ponto único de entrada do sistema. Valida o JWT emitido
pelo Auth Service, aplica rate limiting, roteia cada requisição ao serviço de
domínio correspondente e aplica circuit breaker nas chamadas internas.

**Não possui banco de dados próprio** — é stateless, o que permite escalar
horizontalmente sem coordenação entre réplicas.

**Contrato:** expõe publicamente as rotas agregadas dos serviços internos
(ver seção 4 do README raiz). O contrato OpenAPI unificado será versionado
aqui na Etapa 2.

**Status:** esqueleto — código em `src/`, implementação prevista para a Etapa 4.
