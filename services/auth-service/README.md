# Auth Service

**Responsabilidade:** cadastro de usuários (cidadão, operador, gestor),
emissão e renovação de JWT (access token + refresh token), integração com o
Secrets Manager para a chave de assinatura dos tokens.

**Dado próprio:** PostgreSQL (usuários, papéis, hashes de senha).

**Contrato:** `POST /auth/login`, `POST /auth/refresh`, `POST /auth/registrar`.

**Status:** esqueleto — código em `src/`, implementação prevista para a Etapa 4.
