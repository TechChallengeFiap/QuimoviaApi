<p align="center">
  <img src="./QuimoviaLogo.jfif" alt="Quimovia Logo" width="260" style="border-radius: 16px;" />
</p>

<h1 align="center">Quimovia API</h1>

<p align="center">
  <strong>Sistema de Gestão, Conformidade e Rastreabilidade de Cargas Químicas Portuárias</strong><br />
  <em>Pós-Graduação em Full Stack Development — FIAP (Tech Challenge - Fase 2)</em>
</p>

<p align="center">
  <a href="https://github.com/TechChallengeFiap/QuimoviaApi/actions/workflows/ci.yml">
    <img src="https://github.com/TechChallengeFiap/QuimoviaApi/actions/workflows/ci.yml/badge.svg" alt="CI - Integração Contínua" />
  </a>
  <img src="https://img.shields.io/badge/version-0.0.1-blue.svg" alt="Versão do Projeto" />
  <img src="https://img.shields.io/badge/Node.js-v24-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-v12-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-v6-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Testes-Jest-C21325?logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/Linter-Oxlint-cyan" alt="Oxlint" />
  <img src="https://img.shields.io/badge/license-UNLICENSED-lightgrey.svg" alt="Licença" />
</p>

---

## Sumário

- [1. Sobre o projeto](#1-sobre-o-projeto)
  - [1.1. Contexto e fluxo principal](#11-contexto-e-fluxo-principal)
  - [1.2. Objetivos](#12-objetivos)
  - [1.3. Escopo da Fase 2](#13-escopo-da-fase-2)
- [2. Arquitetura e organização](#2-arquitetura-e-organização)
- [3. Tecnologias utilizadas e justificativa de escolha](#3-tecnologias-utilizadas-e-justificativa-de-escolha)
  - [3.1. Justificativa da escolha do framework (NestJS)](#31-justificativa-da-escolha-do-framework-nestjs)
  - [3.2. Tecnologias adotadas](#32-tecnologias-adotadas)
- [4. Modelagem e persistência de dados](#4-modelagem-e-persistência-de-dados)
  - [4.1. Escolha do banco de dados (MySQL 8.4)](#41-escolha-do-banco-de-dados-mysql-84)
  - [4.2. Estrutura da modelagem de dados (Edital Fase 2 - Item 7)](#42-estrutura-da-modelagem-de-dados-edital-fase-2---item-7)
  - [4.3. Ciclo de vida da carga, máquina de estados e auditoria](#43-ciclo-de-vida-da-carga-máquina-de-estados-e-auditoria)
- [5. Configuração e execução](#5-configuração-e-execução)
  - [5.1. Pré-requisitos](#51-pré-requisitos)
  - [5.2. Variáveis de ambiente](#52-variáveis-de-ambiente)
  - [5.3. Execução com Docker ou ambiente local](#53-execução-com-docker-ou-ambiente-local)
  - [5.4. Scripts disponíveis](#54-scripts-disponíveis)
- [6. Documentação da API e endpoints](#6-documentação-da-api-e-endpoints)
  - [6.1. Swagger / OpenAPI e acesso](#61-swagger--openapi-e-acesso)
  - [6.2. Ciclo de vida e máquina de estados da carga](#62-ciclo-de-vida-e-máquina-de-estados-da-carga)
  - [6.3. Endpoints do ciclo de vida da carga](#63-endpoints-do-ciclo-de-vida-da-carga)
  - [6.4. Exemplos de requisição e resposta](#64-exemplos-de-requisição-e-resposta)
  - [6.5. Mapeamento semântico de códigos de erro HTTP](#65-mapeamento-semântico-de-códigos-de-erro-http)
  - [6.6. Principais endpoints por módulo](#66-principais-endpoints-por-módulo)
- [7. Qualidade de software e testes](#7-qualidade-de-software-e-testes)
- [8. Logs e observabilidade inicial (Edital Item 10)](#8-logs-e-observabilidade-inicial-edital-item-10)
- [9. Integração contínua (CI/CD)](#9-integração-contínua-cicd)
- [10. Diferenciais e APIs além de REST (Edital Item 14)](#10-diferenciais-e-apis-além-de-rest-edital-item-14)
- [11. Equipe](#11-equipe)

---

## 1. Sobre o projeto

O **Quimovia** é um sistema de gestão de cargas químicas em um contexto portuário inspirado nas operações do Porto de Santos.

O controle manual dessas informações dificulta a identificação de pendências, a atribuição de responsabilidades e a consulta ao histórico das cargas. A API organiza esses registros e aplica regras para controlar a liberação, o bloqueio e a movimentação.

O projeto é desenvolvido para o Tech Challenge da pós-graduação em Full Stack Development da FIAP. Nesta Fase 2, o foco é a implementação do backend a partir da [modelagem e da arquitetura definidas na Fase 1](https://github.com/TechChallengeFiap/Quimovia).

### 1.1. Contexto e fluxo principal

O processo começa no cadastro dos produtos e acompanha a carga até sua movimentação e finalização:

1. **Cadastrar os produtos químicos** e seus documentos regulatórios.
2. **Registrar uma carga vinculada** a um produto químico, informando quantidade, unidade de medida, procedência, destino, data de entrada e o responsável técnico.
3. **Cadastrar a documentação** obrigatória da carga.
4. **Registrar as inspeções** e seus respectivos resultados técnicos.
5. **Atualizar o status da carga** para liberação, bloqueio ou cancelamento, conforme as regras de negócio.
6. **Registrar a movimentação e a finalização** das cargas liberadas.

### 1.2. Objetivos

O projeto tem como objetivo centralizar as informações de produtos e cargas químicas, organizar a documentação e as inspeções e identificar os responsáveis pelas operações. O histórico de ações e alterações mantém a rastreabilidade das operações.

A API oferece documentação clara e uma estrutura limpa que facilita testes automatizados, manutenção e evolução sustentável.

### 1.3. Escopo da Fase 2

Esta fase entrega a primeira API REST do projeto, com persistência de dados, regras de negócio e gerenciamento de usuários, perfis e sessões. A aplicação inclui registros de auditoria para acompanhar as ações realizadas.

A entrega reúne:

- documentação dos endpoints e exemplos de uso;
- testes automatizados dos principais fluxos;
- ambiente de execução com API e banco em containers Docker;
- automação da validação, compilação e execução dos testes via CI/CD.

---

## 2. Arquitetura e organização

O backend é um **monólito modular**, orientado por **Domain-Driven Design (DDD)** e **Clean Architecture**. Os módulos em `src/modules/` organizam produtos químicos, cargas, documentação, inspeções, usuários e auditoria. Cada contexto separa domínio puro, casos de uso/aplicação, persistência/infraestrutura e apresentação HTTP.

As decisões arquiteturais e a estrutura de pastas estão documentadas em detalhes em [Fundamentos e decisões](./docs/arquitetura/01-fundamentos-e-decisoes.md) e [Organização e aplicação](./docs/arquitetura/02-organizacao-e-aplicacao.md).

---

## 3. Tecnologias utilizadas e justificativa de escolha

### 3.1. Justificativa da escolha do framework (NestJS)

Conforme estabelecido no Edital do Tech Challenge (Fase 2, item 1), o grupo optou pelo **NestJS** pelos seguintes fatores técnicos e arquiteturais:

1. **Aderência Natural a Clean Architecture e DDD:** O NestJS fornece um sistema nativo de injeção de dependências e inversão de controle (`IoC`), permitindo isolar a camada de domínio puro contra acoplamentos de infraestrutura e HTTP.
2. **Modularidade e Escalabilidade (Monólito Modular):** A separação em módulos (`ChemicalProductsModule`, `ChemicalShipmentModule`, `InspectionModule`, `UserModule`, `DocumentComplianceModule`, `AuditLogModule`) reflete os *bounded contexts* do negócio portuário.
3. **Pipeline Robusto de Validação e Documentação:** Integração declarativa com `class-validator` e `class-transformer` via `ValidationPipe`, além de geração automática de contratos OpenAPI via `@nestjs/swagger`.
4. **Tratamento Centralizado de Exceções:** Uso de `ExceptionFilters` (`DomainExceptionFilter`) para capturar erros agnósticos de domínio (`BusinessRuleError`, `ResourceNotFoundError`, `ConflictError`) e traduzi-los de forma consistente para os status HTTP correspondentes (`422`, `404`, `409`).

### 3.2. Tecnologias adotadas

| Área | Tecnologias adotadas no repositório |
| :--- | :--- |
| Execução | Node.js 24, utilizado no Dockerfile e no CI. |
| Backend | NestJS 12 e TypeScript 6. |
| Persistência | MySQL 8.4 e Prisma ORM 7, com `@prisma/adapter-mariadb`. |
| Validação | `class-validator` e `class-transformer`. |
| Documentação da API | Swagger/OpenAPI com `@nestjs/swagger`. |
| Testes | Jest e Supertest. |
| Análise e formatação | Oxlint e Prettier. |
| Containers | Docker e Docker Compose. |
| Integração contínua | GitHub Actions. |

As versões e dependências estão declaradas no [`package.json`](./package.json) e no lockfile.

---

## 4. Modelagem e persistência de dados

### 4.1. Escolha do banco de dados (MySQL 8.4)

A persistência do Quimovia foi estruturada sobre o banco relacional **MySQL 8.4** (conforme previsto no edital, que prevê bancos relacionais ou NoSQL):

- **Garantias ACID:** Operações de liberação, inspeção e bloqueio de cargas químicas demandam consistência transacional absoluta.
- **Integridade Referencial Forte:** Cargas obrigatoriamente referenciam produtos químicos existentes e usuários responsáveis (`Foreign Keys`), impedindo registros órfãos em operações críticas.
- **Consultas Relacionais com Índices:** Utilização de índices em campos de consulta frequente (`[responsibleUserId]`, `[status]`, `[productId]` e índices compostos de auditoria e inspeção). O Prisma realiza o mapeamento e mantém as migrações versionadas.

### 4.2. Estrutura da modelagem de dados (Edital Fase 2 - Item 7)

Conforme exigido pelo edital, a modelagem de dados responde às seguintes diretrizes:

1. **Como os produtos químicos são armazenados:**
   - Armazenados na tabela `ChemicalProduct`.
   - Contém chave primária UUID, código identificador único (`code`), nome técnico (`technicalName`), descrição/nome comercial (`tradeName`), número ONU (`unNumber` com 4 dígitos numéricos), enums para classe de risco (`riskClass`) e estado físico (`physicalState`), status operacional (`ProductStatus`) e carimbos de auditoria (`createdAt`, `updatedAt`).
   - Possui relação 1:N com a tabela `ProductDocument` com deleção em cascata para armazenamento de dossiês fiscais e ambientais vinculados ao produto.
2. **Como as cargas químicas são armazenadas:**
   - Armazenadas na tabela `ChemicalShipment`.
   - Contém identificador UUID, código identificador único da carga (`code`), chave estrangeira para o produto químico (`productId`), chave estrangeira para o responsável técnico (`responsibleUserId`), quantidade de produto químico (`quantityProduct`), unidade de medida (`unit`), procedência (`origin`), destino portuário (`destination`), data de entrada no pátio (`entryDate`), protocolo de documentação declarada (`documentsIds`), carimbos de criação, atualização e `deletedAt` para suporte a soft delete / inativação lógica.
3. **Como uma carga se relaciona com um produto químico:**
   - Relacionamento relacional 1:N (`ChemicalProduct` 1 ── N `ChemicalShipment`).
   - Uma carga química é estritamente vinculada a um produto químico existente via chave estrangeira física (`ChemicalShipment_productId_fkey`).
   - A nível de aplicação e domínio, o caso de uso (`CreateChemicalShipmentUseCase`) valida previamente a integridade e impede o registro de novas cargas associadas a produtos químicos com status inativo (`INACTIVE`) ou bloqueado (`BLOCKED`).
4. **Como o status da carga é controlado:**
   - Armazenado como tipo `ENUM` nativo do MySQL (`REGISTERED`, `ANALYZING`, `INSPECTION`, `APPROVED`, `REPROVED`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`) indexado para consultas de alta performance.
   - O controle transicional é executado pela Máquina de Estados Finitos encapsulada no domínio puro (`ChemicalShipment` e `shipment-status-transitions.ts`).
   - Toda transição gera automaticamente um registro imutável na tabela de auditoria `ChemicalShipmentLog` (ação `STATUS_CHANGED`, registrando autor, data e metadados `{ from, to }`).
5. **Como os dados poderão evoluir nas próximas fases:**
   - **Campos Operacionais Implementados:** Código de manifesto (`code`), unidade de medida (`unit`), procedência e destino (`origin`, `destination`) e data de entrada (`entryDate`) já foram promovidos a campos de primeira classe no domínio e persistência. Próxima evolução: matriz de segregação por grupo de compatibilidade (`compatibilityGroup`).
   - **Cargas Compostas (Multi-item):** Evolução para vistorias e manifestos compostos de múltiplos contêineres e produtos vinculados ao mesmo manifesto de navio (`InspectionScope.CARGO_ITEM`).
   - **Particionamento e Arquivamento Frio:** Particionamento por faixa de data nas tabelas de log de auditoria (`*Log`) para retenção regulatória de longo prazo.

### 4.3. Ciclo de vida da carga, máquina de estados e auditoria

A [modelagem de dados detalhada](./docs/modelagem-de-dados.md) descreve os campos, relacionamentos e registros de auditoria. O modelo implementado está no [`schema.prisma`](./prisma/schema.prisma), com alterações em [`prisma/migrations`](./prisma/migrations).

---

## 5. Configuração e execução

### 5.1. Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão `24.x`, utilizada no Docker e no CI);
- [npm](https://www.npmjs.com/) (versão `>= 10.x`);
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados e em execução.

### 5.2. Variáveis de ambiente

O projeto utiliza um arquivo `.env` para parametrizar credenciais, portas e conexão com o banco de dados. As configurações disponíveis são:

| Variável | Descrição | Exemplo de configuração |
| :--- | :--- | :--- |
| `MYSQL_ROOT_PASSWORD` | Senha do usuário root do container MySQL | `root_secret` |
| `MYSQL_USER` | Usuário da aplicação no banco | `quimovia_user` |
| `MYSQL_PASSWORD` | Senha do usuário da aplicação | `quimovia_pass` |
| `MYSQL_DATABASE` | Nome do banco de dados | `quimovia_db` |
| `DATABASE_URL` | URL de conexão utilizada pelo Prisma ORM | `mysql://quimovia_user:quimovia_pass@localhost:3333/quimovia_db?allowPublicKeyRetrieval=true&useSSL=false` |
| `PORT` | Porta HTTP da API (opcional, padrão `3000`) | `3000` |
| `JWT_SECRET` | Segredo que assina os tokens de acesso; obrigatório, com ao menos 32 caracteres (a API não sobe sem ele) | gerado com `openssl rand -base64 48` |
| `JWT_EXPIRES_IN_SECONDS` | Duração das sessões e dos tokens, em segundos (opcional, padrão `3600`) | `31536000` (1 ano) no ambiente local; `3600` em produção |
| `ADMIN_NAME` | Nome do administrador inicial criado pelo seed (opcional) | `Administrador do Sistema` |
| `ADMIN_EMAIL` | E-mail do administrador inicial criado pelo seed | `admin@quimovia.com` |
| `ADMIN_PASSWORD` | Senha do administrador inicial, com ao menos 8 caracteres | `Quimovia@2026` (padrão do `.env.example`; troque fora do ambiente local) |

### 5.3. Execução com Docker ou ambiente local

Clone o repositório:

```bash
git clone https://github.com/TechChallengeFiap/QuimoviaApi.git
cd QuimoviaApi
```

Copie `.env.example` para `.env`:

```bash
# Linux / macOS
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Preencha `MYSQL_*` e `JWT_SECRET` (ao menos 32 caracteres). Para gerar o segredo, use, por exemplo, `openssl rand -base64 48`. No modo local, substitua também os marcadores de `DATABASE_URL` pelas mesmas credenciais e pelo nome do banco; o arquivo `.env` não faz essa substituição automaticamente. O Docker Compose configura a conexão da API com o serviço `mysql` internamente.

O exemplo define o administrador inicial `admin@quimovia.com`, senha `Quimovia@2026`, e duração de token de 1 ano para uso local e avaliação. Ajuste esses valores para outros ambientes. A duração efetiva do token segue `JWT_EXPIRES_IN_SECONDS`.

#### Opção A: API e banco com Docker

```bash
docker compose up -d --build
docker compose ps
```

O Compose inicia o MySQL, aguarda seu healthcheck e inicia a API após aplicar as migrações e executar o seed do administrador. O MySQL deve aparecer como `healthy` e a API como `running`.

Para acompanhar a inicialização, use `docker compose logs -f api`. Para parar os serviços:

```bash
docker compose down
```

#### Opção B: banco no Docker e API local

Com o `.env` configurado para `localhost:3333`, execute:

```bash
npm install
docker compose up -d mysql
npm run migrate:generate
npm run migrate:deploy
npm run migrate:seed
npm run start:dev
```

`migrate:deploy` aplica as migrações versionadas. Use `npm run migrate:dev` ao desenvolver uma alteração no schema e criar uma nova migração. O seed não altera uma conta cujo e-mail já esteja cadastrado.

---

### 5.4. Scripts disponíveis

| Comando | Finalidade |
| :--- | :--- |
| `npm run build` | Compila a aplicação em `dist/`. |
| `npm run start:dev` | Inicia em modo de desenvolvimento com hot-reload. |
| `npm run start:prod` | Inicia a aplicação compilada em produção. |
| `npm run start:debug` | Inicia em modo de depuração na porta `9229`. |
| `npm run migrate:generate` | Gera os artefatos do Prisma Client. |
| `npm run migrate:dev` | Aplica migrações em ambiente de desenvolvimento. |
| `npm run migrate:deploy` | Aplica migrações pendentes em produção/CI. |
| `npm run migrate:seed` | Executa o seed de dados iniciais. |
| `npm run lint` | Executa a análise estática com Oxlint. |
| `npm run format` | Formata os arquivos de código e testes com Prettier. |

---

## 6. Documentação da API e endpoints

### 6.1. Swagger / OpenAPI e acesso

Com a aplicação em execução, acesse o [Swagger](http://localhost:3000/api), que apresenta os parâmetros, exemplos de requisição e resposta e códigos de erro. A porta padrão da API é `3000`, configurável por `PORT`.

Para usar as rotas protegidas, faça login em `POST /auth/login` com as credenciais do administrador definidas no `.env` e informe o `accessToken` em **Authorize**. A sessão permanece válida até expirar ou ser encerrada.

| Recurso | Rotas principais |
| :--- | :--- |
| Autenticação | `POST /auth/login` e `POST /auth/logout`. |
| Produtos químicos | `POST`, `GET` em `/chemical-products`; `GET`, `PATCH`, `DELETE` em `/:id`; `PATCH /:id/status`. |
| Documentos do produto | `POST`, `GET` em `/chemical-products/:id/documents`; `GET`, `PATCH`, `DELETE` em `/:documentId`. |
| Cargas químicas | `POST`, `GET` em `/chemical-shipment`; `GET`, `PATCH`, `DELETE` em `/:id`; `PATCH /:id/status`, `/:id/release`, `/:id/block`, `/:id/cancel`; `GET /:id/transitions`. |
| Inspeções | `POST`, `GET` em `/inspections`; `GET`, `PATCH`, `DELETE` em `/:id`. |
| Documentação das cargas | `POST`, `GET` em `/shipment-documents`; `GET`, `PATCH`, `DELETE` em `/:id`. |
| Usuários | `POST`, `GET` em `/users`; `GET`, `PATCH`, `DELETE` em `/:id`; `POST /shippers` e `PATCH /:id/role`. |
| Auditoria | `GET /logs/users`, `/logs/chemical-products`, `/logs/chemical-shipments`, `/logs/inspections` e `/logs/shipment-documents`. |

A [referência detalhada da API](./docs/api.md) apresenta a especificação completa de payloads, headers e parâmetros.

### 6.2. Ciclo de vida e máquina de estados da carga

Novas cargas exigem produto químico ativo, quantidade maior que zero e responsável técnico existente. Elas começam em `REGISTERED` e seguem as transições abaixo:

```mermaid
stateDiagram-v2
  state "Registrada" as REGISTERED
  state "Em análise" as ANALYZING
  state "Em inspeção" as INSPECTION
  state "Liberada" as APPROVED
  state "Bloqueada" as REPROVED
  state "Em movimentação" as IN_TRANSIT
  state "Finalizada" as COMPLETED
  state "Cancelada" as CANCELLED
  [*] --> REGISTERED : Cadastro da carga
  REGISTERED --> ANALYZING : Iniciar análise
  ANALYZING --> INSPECTION : Enviar para inspeção
  INSPECTION --> APPROVED : Liberar
  INSPECTION --> REPROVED : Bloquear carga
  APPROVED --> IN_TRANSIT : Iniciar movimentação
  IN_TRANSIT --> COMPLETED : Finalizar carga
  REGISTERED --> CANCELLED : Cancelar
  ANALYZING --> CANCELLED : Cancelar
  INSPECTION --> CANCELLED : Cancelar
  APPROVED --> CANCELLED : Cancelar
  REPROVED --> CANCELLED : Cancelar
  COMPLETED --> [*] : Estado Terminal
  CANCELLED --> [*] : Estado Terminal
```

#### Regras Inegociáveis de Proteção de Domínio

1. **Compliance Documental Mandatório:** Uma carga **não pode ser liberada (`APPROVED`) sem documentação técnica obrigatória ativa e vigente** verificada via módulo `document-compliance` (retorna erro `422 Unprocessable Entity`).
2. **Carga Bloqueada:** Uma carga bloqueada/reprovada (`REPROVED`) **jamais pode entrar em movimentação** (`IN_TRANSIT`).
3. **Imutabilidade Terminal:** Cargas finalizadas (`COMPLETED`) ou canceladas (`CANCELLED`) não podem sofrer nenhuma transição posterior.
4. **Fechamento de Backdoor na Edição:** Alterações cadastrais na carga (`quantityProduct`, `unit`, `origin`, `destination`, etc.) via `PATCH /chemical-shipment/:id` são permitidas **estritamente nos status `REGISTERED` e `ANALYZING`**. Uma vez enviada para inspeção ou liberada, a composição física está lacrada para edição.
5. **Auditoria Contínua:** Toda e qualquer mudança de status grava automaticamente um registro em `ChemicalShipmentLog` com ação `STATUS_CHANGED`, registrando autor, data e metadados com status de origem e destino (`{ from, to }`).

### 6.3. Endpoints do ciclo de vida da carga

A API disponibiliza tanto a rota de transição exigida pelo edital quanto endpoints semânticos (*task-based*), além de um endpoint diferencial para consulta das transições abertas:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/chemical-shipment/:id/transitions` | **[Diferencial]** Consulta as transições válidas abertas para o status atual da carga, seus rótulos legíveis e se está em estado terminal. |
| `PATCH` | `/chemical-shipment/:id/status` | **[Edital]** Altera o status da carga conforme a máquina de estados validando regras de transição (`{ "status": "ANALYZING" }`). |
| `PATCH` | `/chemical-shipment/:id/release` | **[Edital / Liberar]** Libera a carga química (`APPROVED`), conferindo automaticamente a suficiência documental. |
| `PATCH` | `/chemical-shipment/:id/block` | **[Edital / Bloquear]** Bloqueia a carga química (`REPROVED`) a partir do status de inspeção. |
| `PATCH` | `/chemical-shipment/:id/cancel` | **[Edital / Cancelar]** Cancela a carga química a partir dos status permitidos, tornando-a terminal. |

### 6.4. Exemplos de requisição e resposta

#### 1. Consulta de Transições Permitidas (Diferencial)

```http
GET /chemical-shipment/326d18f1-f7a5-40ae-9e3d-b32f085bfca7/transitions
```

**Resposta (200 OK):**

```json
{
  "shipmentId": "326d18f1-f7a5-40ae-9e3d-b32f085bfca7",
  "currentStatus": "REGISTERED",
  "currentStatusLabel": "Registrada",
  "isTerminal": false,
  "allowedTransitions": [
    { "status": "ANALYZING", "label": "Em análise" },
    { "status": "CANCELLED", "label": "Cancelada" }
  ]
}
```

#### 2. Alteração de Status pelo Endpoint Geral do Edital

```http
PATCH /chemical-shipment/326d18f1-f7a5-40ae-9e3d-b32f085bfca7/status
Content-Type: application/json

{
  "status": "ANALYZING"
}
```

**Resposta (200 OK):**

```json
{
  "id": "326d18f1-f7a5-40ae-9e3d-b32f085bfca7",
  "code": "CARGO-326D18F1",
  "productId": "88733221-39fe-4ef9-8cc5-4e7cb803ba91",
  "quantityProduct": 100,
  "unit": "kg",
  "origin": "Porto de Santos",
  "destination": "Terminal Portuário",
  "entryDate": "2026-10-24T12:00:00.000Z",
  "status": "ANALYZING",
  "responsibleUserId": "f12ca16e-5fa7-4a0f-ba10-8b29df939ac1",
  "documentsIds": "doc-fispq-2026",
  "createdAt": "2026-10-24T12:00:00.000Z",
  "updatedAt": "2026-10-24T12:05:00.000Z"
}
```

#### 3. Tentativa de Liberação sem Documentação Técnica Obrigatória

```http
PATCH /chemical-shipment/326d18f1-f7a5-40ae-9e3d-b32f085bfca7/release
```

**Resposta de Erro de Negócio (422 Unprocessable Entity):**

```json
{
  "statusCode": 422,
  "timestamp": "2026-10-24T12:06:00.000Z",
  "path": "/chemical-shipment/326d18f1-f7a5-40ae-9e3d-b32f085bfca7/release",
  "error": "BusinessRuleError",
  "message": "Uma carga não pode ser liberada sem documentação obrigatória."
}
```

### 6.5. Mapeamento semântico de códigos de erro HTTP

| Código | Significado | Quando Ocorre |
| :--- | :--- | :--- |
| `400 Bad Request` | Erro Sintático / Validação | Payload malformatado, campos obrigatórios ausentes, tipos incorretos ou enum inválido no DTO. |
| `401 Unauthorized` | Não Autenticado | Ausência do cabeçalho `Authorization: Bearer <token>` ou token JWT expirado/inválido. |
| `403 Forbidden` | Não Autorizado | Usuário autenticado não possui papel operacional permitido para executar a ação. |
| `404 Not Found` | Recurso Não Encontrado | Identificador de carga química, usuário responsável ou produto químico não localizado. |
| `409 Conflict` | Conflito de Integridade | E-mail já cadastrado no sistema ou duplicidade de código único. |
| `422 Unprocessable Entity` | Erro de Regra de Negócio | Transição proibida na máquina de estados, liberação sem documentação ou movimentação de carga bloqueada (`BusinessRuleError`). |

### 6.6. Principais endpoints por módulo

As rotas protegidas pelo `AuthGuard` exigem o cabeçalho `Authorization: Bearer <token>`, com o token de uma sessão ativa; sem ele, a API responde `401`. O guard protege o logout e a gestão de usuários; cada módulo pode exigir login nas próprias rotas importando o `AuthModule` e usando `@UseGuards(AuthGuard)`. Para restringir a rota a alguns perfis, usa-se `@UseGuards(AuthGuard, RolesGuard)` com `@Roles()`: com outro perfil, a API responde `403`. O perfil conferido é o atual do usuário, então uma troca de perfil vale já na próxima requisição.

#### Autenticação (`/auth`)

- `POST /auth/login` — Confere e-mail e senha, inicia uma sessão e devolve o token de acesso (`401` para credenciais inválidas e `403` para conta inativa ou bloqueada).
- `POST /auth/logout` — Encerra a sessão do token enviado, que deixa de valer imediatamente.

Bloquear, inativar ou excluir um usuário encerra as sessões dele, e reativar a conta não as reativa: é preciso fazer login novamente.

#### Produtos Químicos (`/chemical-products`)

- `POST /chemical-products` — Cadastra novo produto químico perigoso (nome técnico, código único, número ONU, classe de risco e usuário técnico responsável). O status inicial padrão é `UNDER_ANALYSIS`.
- `GET /chemical-products` — Lista produtos químicos cadastrados com paginação (`page`, `limit`) e filtros (`code`, `technicalName`, `unNumber`, `riskClass`, `status`).
- `GET /chemical-products/:id` — Retorna os dados cadastrais detalhados do produto e seus documentos regulatórios vinculados.
- `PATCH /chemical-products/:id` — Atualiza dados cadastrais do produto químico (nome técnico, nome comercial, número ONU, etc.).
- `PATCH /chemical-products/:id/status` — Altera o status do produto químico (`ACTIVE`, `INACTIVE`, `BLOCKED`). É através deste endpoint que ocorre a inativação ou desbloqueio de produtos pelo Operador Portuário.
- `DELETE /chemical-products/:id` — Exclui o produto químico do catálogo (quando não vinculado a cargas em andamento).
- `POST /chemical-products/:id/documents` — Anexa dossiê documental (FISPQ/FDS, Licença Ambiental, etc.) ao produto químico.
- `DELETE /chemical-products/:id/documents/:documentId` — Remove documento técnico do produto químico.

#### Cargas Químicas (`/chemical-shipment`)

- `POST /chemical-shipment` — Registra uma nova carga química (campos: `productId`, `responsibleUserId`, `quantityProduct`, `code`, `unit`, `origin`, `destination`, `entryDate`, `documentsIds`; status inicial `REGISTERED`).
- `GET /chemical-shipment` — Lista cargas químicas com paginação e filtros (`status`, `productId`, `responsibleUserId`, `code`, `documentsIds`).
- `GET /chemical-shipment/:id` — Retorna os detalhes de uma carga química pelo ID.
- `GET /chemical-shipment/:id/transitions` — Consulta as opções de transição válidas para o status atual da carga (**diferencial**).
- `PATCH /chemical-shipment/:id` — Atualiza dados cadastrais da carga (`quantityProduct`, `unit`, `origin`, `destination`, `entryDate`). Permitido exclusivamente nos status `REGISTERED` e `ANALYZING`.
- `PATCH /chemical-shipment/:id/status` — Altera o status da carga conforme a máquina de estados do edital.
- `PATCH /chemical-shipment/:id/release` — Libera a carga química (`APPROVED`), conferindo automaticamente a documentação técnica obrigatória.
- `PATCH /chemical-shipment/:id/block` — Bloqueia a carga química (`REPROVED`) a partir do status de inspeção.
- `PATCH /chemical-shipment/:id/cancel` — Cancela a carga química a partir dos status permitidos.
- `DELETE /chemical-shipment/:id` — Realiza a inativação/remoção lógica da carga química.

#### Inspeções Portuárias (`/inspections`)

- `POST /inspections` — Registra nova inspeção técnica para a carga total ou item específico.
- `GET /inspections` — Lista inspeções cadastradas com filtros de status e escopo.
- `GET /inspections/:id` — Consulta o resultado e detalhes de uma inspeção por identificador.
- `PATCH /inspections/:id` — Atualiza o status (`IN_PROGRESS`, `COMPLETED`) e resultado dos itens (`COMPLIANT`, `NON_COMPLIANT`).
- `DELETE /inspections/:id` — Remove registro de inspeção.

#### Documentação das Cargas (`/shipment-documents`)

- `POST /shipment-documents` — Cadastra a documentação em preparação, com anexos e responsável técnico opcionais.
- `GET /shipment-documents` — Lista documentos com paginação e filtros por carga, embarcador e status.
- `GET /shipment-documents/:id` — Consulta o documento e o histórico dos anexos.
- `PATCH /shipment-documents/:id` — Altera o responsável e adiciona, substitui ou remove anexos enquanto o documento está em preparação.
- `DELETE /shipment-documents/:id` — Exclui a documentação em preparação.

Ao informar `responsibleUserId`, o usuário deve existir; caso contrário, a API retorna `404`. Omitir o campo na atualização preserva o vínculo. As respostas incluem `responsibleUserId` e `responsibleUser` (`id` e `name`), sem credenciais. Os nomes são obtidos pelo contrato público de Identidade e Acesso, em lote nas listagens. Se o usuário for removido, o identificador histórico permanece e o resumo passa a ser `null`.

A migração `20261026000000_isolate_document_responsible_user` remove apenas a chave estrangeira entre os contextos, preservando identificadores e índice. A existência do responsável passa a ser validada pela aplicação; não há garantia transacional entre a consulta ao usuário e a gravação documental. Aplique as migrações com `npm run migrate:deploy` antes de executar esta versão e gere o cliente com `npm run migrate:generate`.

Erros de validação retornam `400`; violações de regras de negócio retornam `422`, recursos ausentes retornam `404` e conflitos retornam `409`. O cadastro de documentação de cargas mantém seu contrato específico de validação com `400`.

#### Usuários e Acessos (`/users`)

Cadastrar usuários internos, remover e trocar o perfil de usuários exige o token de um Administrador do Sistema (`401` sem token e `403` para os outros perfis). Na edição, o administrador altera qualquer usuário, e os demais perfis só os próprios dados, sem poder se bloquear. Os embarcadores (usuários externos) se cadastram sozinhos pela rota pública `POST /users/shippers`.

- `POST /users` — Cadastra operador, fiscal ou responsável técnico com hash seguro de senha.
- `POST /users/shippers` — Cadastro público do embarcador, sem token: o perfil é sempre `SHIPPER_DRIVER` e a conta já nasce ativa; enviar `role` ou `status` retorna `400`, e o e-mail de um usuário excluído retorna `409` (só o administrador reativa a conta).
- `GET /users` — Lista usuários cadastrados com suporte a busca por e-mail, perfil e status.
- `GET /users/:id` — Busca informações cadastrais do usuário.
- `PATCH /users/:id` — Atualiza nome, e-mail, senha ou status (`ACTIVE`, `INACTIVE`, `BLOCKED`).
- `PATCH /users/:id/role` — Troca o perfil de acesso do usuário (restrito ao administrador).
- `DELETE /users/:id` — Exclui o usuário logicamente (`isDeleted` e `deletedAt`): ele não aparece nas buscas e perde o acesso, mas o registro é mantido. Cadastrar de novo o mesmo e-mail em `POST /users` reativa esse registro, mantendo o histórico.

---

## 7. Qualidade de software e testes

A suíte abrange testes unitários e testes de integração/E2E com Jest e Supertest, cobrindo regras de domínio, casos de uso, repositórios, tratamento de exceções com filtros de erro e rotas HTTP:

```bash
# Testes unitários
npm test

# Testes em modo contínuo (watch)
npm run test:watch

# Verificação estática de tipos TypeScript
npm run typecheck

# Testes HTTP ponta a ponta (E2E)
npm run test:e2e

# Relatório de cobertura de código
npm run test:cov
```

Os testes automatizados cobrem cenários críticos exigidos no Tech Challenge, incluindo:

- Cadastro de produto químico válido e bloqueio de cadastro sem nome ou sem classe de risco;
- Registro de carga química com produto e usuário válidos;
- Bloqueio de carga com produto químico inativo ou quantidade menor ou igual a zero;
- Bloqueio de liberação de carga sem documentação obrigatória;
- Transições de status permitidas da carga e bloqueio de transições proibidas na máquina de estados;
- Cancelamento de carga a partir dos status permitidos;
- Bloqueio de movimentação de carga bloqueada com erro de negócio (`BusinessRuleError`);
- Hash criptográfico de senhas e autenticação com sessões ativas;
- Exclusão lógica de usuários (`isDeleted` e `deletedAt`) e controle de perfis pelo administrador;
- Validação e sincronização dos novos campos operacionais da carga (`code`, `unit`, `origin`, `destination`, `entryDate`).

---

## 8. Logs e observabilidade inicial (Edital Item 10)

O Quimovia implementa uma estratégia de observabilidade em camadas para facilitar o monitoramento operacional e a auditoria forense do pátio:

1. **Auditoria Transacional em Banco (Tabelas `*Log`):**
   - Cada bounded context conta com uma tabela de log imutável dedicada (`ChemicalShipmentLog`, `ChemicalProductLog`, `UserLog`, `InspectionLog`, `ShipmentDocumentLog`).
   - Registra o identificador da entidade afetada (`entityId`), o operador responsável (`actorId`, `actorName`), a ação realizada (`CREATED`, `STATUS_CHANGED`, `DELETED`, etc.), timestamp de auditoria e detalhes contextuais em JSON (como status anterior e novo: `{ from, to }`).
   - Os logs de auditoria sobrevivem mesmo a eventuais exclusões lógicas das entidades monitoradas e podem ser consultados via endpoints `GET /logs/*`.
2. **Logs Estruturados na Aplicação (NestJS Logger):**
   - Uso de `Logger` nativo tipado em Use Cases e Controllers para rastreamento de eventos vitais:
     - Criação de novos produtos químicos e cargas;
     - Transições de status e tentativas de violação de máquina de estados;
     - Bloqueios em vistorias de inspeção e liberações com conformidade documental;
     - Falhas de autenticação e trocas de perfil de usuários;
     - Erros de validação e exceções não tratadas.
3. **Evolução Futura (Prometheus & Grafana):**
   - Arquitetura preparada para acoplamento de interceptor de métricas RED (Rate, Errors, Duration) e exportador Prometheus para painéis Grafana no terminal portuário.

---

## 9. Integração contínua (CI/CD)

O projeto conta com um pipeline automatizado de Integração Contínua configurado via GitHub Actions em [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

O pipeline é disparado automaticamente a cada `push` ou `pull_request` nas branches `main` e `develop`, além de execução manual por `workflow_dispatch`:

```text
[Push / Pull Request]
        │
        ▼
1. Checkout do Código
        │
        ▼
2. Configuração do Node.js 24 com Cache de Dependências
        │
        ▼
3. Instalação Limpa de Dependências (npm ci)
        │
        ▼
4. Linting e Análise Estática (Oxlint)
        │
        ▼
5. Geração do Prisma Client (npx prisma generate)
        │
        ▼
6. Verificação de Build e Compilação TypeScript (npm run build)
        │
        ▼
7. Execução dos Testes Unitários (npm test)
        │
        ▼
8. Execução dos Testes E2E (npm run test:e2e)
        │
        ▼
9. Geração e Upload do Relatório de Cobertura (coverage-report)
```

---

## 10. Diferenciais e APIs além de REST (Edital Item 14)

Conforme destacado no edital, o core obrigatório da Fase 2 é 100% suportado pela **API RESTful**. Além do fluxo padrão, o projeto implementa diferenciais como:

1. **Endpoint de Transições Abertas (`GET /chemical-shipment/:id/transitions`):**
   - Permite que interfaces frontend ou sistemas de pátio consultem dinamicamente em tempo real quais transições de status estão abertas para a carga, seus rótulos legíveis e se ela já atingiu um estado terminal.
2. **Backlog de APIs Complementares (GraphQL / gRPC):**
   - Para as próximas etapas de evolução do QuimiPort, está prevista a introdução de um gateway GraphQL para consultas compostas (ex.: consultar detalhes de um produto químico agregando histórico de cargas e inspeções em uma única requisição flexível), bem como serviços gRPC para validação de alta vazão nas cancelas físicas de entrada portuária.

---

## 11. Equipe

Projeto desenvolvido para a **Pós-Graduação em Full Stack Development — FIAP**:

| Nome | RM | GitHub |
| :--- | :--- | :--- |
| **Ygor Takashi Nishi** | RM: 375939 | [Perfil](https://github.com/TakashiNishii) |
| **Matheus Felicio Brazolin** | RM: 375006 | [Perfil](https://github.com/MatheusBrazolin) |
| **Paulo Henrique dos Santos Miliano** | RM: 375284 | [Perfil](https://github.com/PauloMiliano) |
| **Letícia Gabrielle Videira dos Santos** | RM: 376263 | [Perfil](https://github.com/SantosLet) |

---

<p align="center">
  <sub>Quimovia API • FIAP Pós Tech • Tech Challenge Fase 2</sub>
</p>
