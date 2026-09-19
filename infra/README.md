# Infraestrutura

Infraestrutura como código (IaC) — implementação prevista para etapas
futuras. As decisões de provisionamento que sustentam o diagrama do README
raiz estão documentadas aqui.

## Estrutura

- `terraform/` — provisionamento da VPC, subnets, Load Balancer, ECS, RDS,
  ElastiCache, Route53, Secrets Manager. Vazio nesta etapa.
- `docker-compose/` — ambiente local para desenvolvimento (todos os
  serviços + bancos rodando em containers na máquina do dev). Vazio nesta
  etapa.

## Ambientes planejados

- `dev` — uma instância mínima de cada serviço, sem auto scaling, para
  testes da squad.
- `staging` — espelha produção em escala reduzida, usado antes de cada
  entrega.
- `prod` — não provisionado nesta etapa (fora do escopo do TDE).
