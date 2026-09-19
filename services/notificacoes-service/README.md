# Notificações Service

**Responsabilidade:** consumir eventos do Message Broker e notificar o
cidadão (e-mail/SMS) sobre mudanças no status da ocorrência aberta.

**Não possui banco de dados próprio** — é um consumidor stateless da fila.

**Resiliência:** retries com backoff exponencial; mensagens que falham após
N tentativas vão para a Dead Letter Queue para investigação manual.

**Status:** esqueleto — código em `src/`, implementação prevista para a Etapa 3.
