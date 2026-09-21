# Plataforma de Coleta de Resíduos Urbanos

**TDE — Sistemas Distribuídos (2026.2) · UNIFAN Etapa 1**

## Sumário

1. [Escolha do projeto (domínio)](#1-escolha-do-projeto-domínio)
2. [Diferencial da solução](#2-diferencial-da-solução)
3. [Regras de negócio](#3-regras-de-negócio)
4. [Arquitetura e system design](#4-arquitetura-e-system-design)
5. [Segurança](#5-segurança)
6. [Escalonamento](#6-escalonamento)
7. [Tolerância a falhas (resiliência)](#7-tolerância-a-falhas-resiliência)
8. [DNS](#8-dns)
9. [Repositório](#9-repositório)

---

## 1. Escolha do projeto (domínio)

**Problema:** o cronograma de coleta de resíduos urbanos em Feira de Santana
é comunicado por meios informais e dispersos (cartazes, grupos de WhatsApp,
ligações à prefeitura). O cidadão não sabe com precisão quando o caminhão
passa no seu bairro, o que gera exposição prolongada de resíduos na via
pública, e a prefeitura não tem um canal digital único para receber e
rastrear reclamações sobre falhas no serviço.

**Proposta de valor:** uma plataforma pública, web responsiva, que centraliza
três jornadas:

1. **Consultar** — cronograma de coleta domiciliar e seletiva do bairro, com
   cálculo automático da próxima coleta e status operacional do dia.
2. **Localizar** — ecopontos de entrega voluntária, filtráveis por tipo de
   material aceito.
3. **Reportar** — abertura de ocorrência (coleta não realizada, acúmulo
   irregular, container danificado, descarte de entulho) com protocolo de
   acompanhamento.

## 2. Diferencial da solução

Ao contrário de uma central telefônica ou de um formulário estático:

- O status da coleta é **calculado em tempo real** a partir da data/hora da
  consulta e do cronograma fixo do bairro — nunca um valor estático que
  desatualiza.
- Ocorrências abertas disparam um **fluxo assíncrono de notificação** ao
  cidadão quando o status muda, via mensageria — ele não precisa voltar a
  consultar o protocolo manualmente.
- A arquitetura foi desenhada para **escalar seletivamente**: um pico de
  ocorrências após um temporal não degrada a consulta de cronograma, porque
  são serviços, bancos e políticas de auto scaling independentes.

## 3. Regras de negócio

- Cada bairro tem exatamente um cronograma de coleta domiciliar e um de
  coleta seletiva, definidos por dias fixos da semana e turno (matutino,
  vespertino, noturno).
- A próxima coleta é sempre calculada a partir da data corrente do servidor
  — nunca armazenada como valor fixo.
- Status operacional do dia segue a máquina de estados
  `AGENDADA → EM_ROTA → CONCLUIDA` (ou `SEM_COLETA`), transicionando
  conforme o horário do turno.
- Uma ocorrência só pode ser aberta para um bairro cadastrado e com um tipo
  dentre os quatro suportados.
- Toda ocorrência recebe um protocolo único (`OC-<ano>-<sequencial>`) e
  nasce no status `ABERTA`.
- Mudança de status de uma ocorrência (`ABERTA → EM_ANALISE → RESOLVIDA`)
  publica um evento assíncrono para notificar o solicitante — o serviço que
  registra a ocorrência **não** envia a notificação diretamente.
- Ecopontos podem aceitar múltiplos materiais; a busca por material é um
  filtro, não uma segmentação exclusiva.

## 4. Arquitetura e system design

### 4.1 Serviços (nós) do sistema

| Serviço | Responsabilidade | Dado próprio | Protocolo exposto |
|---|---|---|---|
| **API Gateway** | Ponto único de entrada, autenticação de borda, rate limiting, roteamento | — (stateless) | HTTPS/REST |
| **Auth Service** | Emissão/validação de JWT, cadastro de usuários (cidadão/operador/gestor) | PostgreSQL | REST interno |
| **Coleta Service** | Cronograma por bairro, cálculo da próxima coleta e status do dia | PostgreSQL | REST |
| **Ecopontos Service** | Cadastro e busca geoespacial de ecopontos | PostgreSQL + PostGIS | REST |
| **Ocorrências Service** | Abertura e consulta de ocorrências, publica evento de mudança de status | MongoDB | REST + eventos |
| **Notificações Service** | Consome eventos e envia e-mail/SMS ao cidadão | — (stateless) | Consumidor de fila |

Cada serviço é **dono exclusivo do seu dado** (*database per service*) —
nenhum serviço acessa a base de outro diretamente, só por API.

### 4.2 Protocolos de comunicação entre serviços

- **Síncrono (REST/HTTPS)**: cliente ↔ Gateway ↔ serviços de consulta
  (Coleta, Ecopontos, Auth) — o usuário espera resposta na hora.
- **Assíncrono (mensageria)**: Ocorrências → Notificações. Criar uma
  ocorrência não espera o envio de e-mail; se Notificações cair, a fila
  retém as mensagens.
- Contrato OpenAPI por serviço síncrono + schema de evento JSON versionado
  para a fila.

### 4.3 Recursos planejados por camada:

| Recurso | Ferramenta/serviço | Finalidade |
|---|---|---|
| Orquestração de containers | Kubernetes/EKS | Deploy e auto scaling por serviço |
| Bancos gerenciados | PostgreSQL | Persistência por serviço, backups automáticos |
| Cache | ElastiCache (Redis) | Cache de leitura do Coleta Service |
| Mensageria | SQS + SNS | Fila principal + Dead Letter Queue |
| CDN + WAF | CloudFront + AWS WAF | Borda, cache estático, proteção contra ataques |
| Segredos | AWS Secrets Manager | Credenciais de banco, chave de assinatura JWT |
| Observabilidade | CloudWatch | Logs, métricas, alertas, gatilhos de auto scaling |

## 5. Segurança
 
- **Login e permissão (JWT)** — quando o cidadão faz login, o Auth Service dá
  a ele um "crachá digital" (token) que prova quem ele é, sem precisar
  mandar usuário/senha de novo a cada clique. Esse crachá expira em 15
  minutos por segurança — se alguém roubar, vira inútil rápido. O crachá
  também diz o *papel* da pessoa (cidadão, operador ou gestor): só operador
  ou gestor conseguem mudar o status de uma ocorrência.
- **Senhas e chaves guardadas num cofre separado** — nenhuma senha de banco
  fica escrita dentro do código. Elas ficam guardadas num serviço à parte
  (Secrets Manager) e são buscadas só na hora de rodar, e trocadas
  automaticamente a cada 90 dias.
- **Um filtro na porta de entrada (WAF) Web Application Firewall** — antes de qualquer requisição
  chegar perto do sistema, passa por um filtro que bloqueia ataques
  conhecidos (tipo alguém tentando injetar comandos maliciosos num campo de
  texto). Também limitamos quantas vezes o mesmo IP pode abrir ocorrências
  em pouco tempo, pra evitar spam.
- **Cada parte só fala com quem precisa** — o banco de dados só aceita
  conexão do serviço dono dele; nem o Gateway, que recebe todo o tráfego de
  fora, consegue acessar o banco diretamente. Isso limita o estrago se
  alguma parte for invadida.
- **Tudo trafega criptografado** — toda comunicação usa HTTPS, então ninguém
  consegue "espiar" o que passa entre o cidadão e o sistema.
## 6. Escalonamento
 
- **Cada serviço escala sozinho, de forma independente** — como cada um roda
  separado (dentro de um "container"), o sistema pode colocar mais cópias
  só do serviço que está sob pressão, sem precisar duplicar o resto.
- **Cada serviço escala por um motivo diferente**:
  - Coleta e Ecopontos (muita gente consultando o tempo todo): escala
    quando o uso de processamento sobe.
  - Ocorrências (picos repentinos, ex: depois de um temporal, todo mundo
    reclama junto): escala quando a fila de pedidos começa a acumular.
  - Notificações: escala conforme a quantidade de e-mails/SMS esperando
    para ser enviados.

## 7. Tolerância a falhas (resiliência)
 
- **Circuit breaker** ("disjuntor") no API Gateway — igual o disjuntor
  elétrico da sua casa: se um serviço interno começa a falhar acima de um
  limiar, o Gateway para de chamá-lo temporariamente e já retorna erro
  rápido ao cliente, em vez de deixar todo mundo esperando uma resposta
  que nunca chega. Isso evita que um problema pequeno vire um apagão geral
  (falha em cascata).
  
- **Health checks** ("checagem constante de saúde") no Load Balancer — o
  sistema fica perguntando periodicamente para cada cópia de cada serviço
  "você está bem?", e remove automaticamente da rotação qualquer uma que
  pare de responder.
## 8. DNS
 
- **Domínio principal:** `coletafeira.com.br`, dividido em endereços
  específicos pra cada finalidade — separar assim permite trocar ou
  atualizar uma parte sem afetar as outras:
  - `api.coletafeira.com.br` → onde o sistema realmente roda
  - `admin.coletafeira.com.br` → painel de quem trabalha na prefeitura
  - `docs.coletafeira.com.br` → documentação pública da API

## 9. Repositório
 
### Estrutura (projeto final)
 
```
coleta-residuos-plataforma/
├── README.md                     # este arquivo — toda a proposta técnica
├── .gitignore
├── .github/
│   ├── CODEOWNERS                # dono de cada serviço, revisão obrigatória
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   └── workflows/                # CI/CD (lint, testes, build) — Etapa 2+
├── services/                     # um diretório por bounded context
│   ├── api-gateway/{README.md, src/}
│   ├── auth-service/{README.md, src/}
│   ├── coleta-service/{README.md, src/}
│   ├── ecopontos-service/{README.md, src/}
│   ├── ocorrencias-service/{README.md, src/}
│   └── notificacoes-service/{README.md, src/}
├── infra/                        # infraestrutura como código
│   ├── README.md
│   ├── terraform/                # provisionamento (VPC, ECS, RDS...) — Etapa futura
│   └── docker-compose/           # ambiente local para dev — Etapa futura
└── prototipo/                    # PoC já funcional (Node.js + Python)
```
