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

## 📑 Sumário

- [1. Sobre o Projeto](#1-sobre-o-projeto)
  - [1.1. Contexto do Problema](#11-contexto-do-problema)
  - [1.2. A Solução Quimovia](#12-a-solução-quimovia)
  - [1.3. Objetivos do Tech Challenge (Fase 2)](#13-objetivos-do-tech-challenge-fase-2)
- [2. Arquitetura e Design de Software](#2-arquitetura-e-design-de-software)
- [3. Tecnologias Utilizadas e Justificativa de Escolha](#3-tecnologias-utilizadas-e-justificativa-de-escolha)
- [4. Modelagem e Persistência de Dados](#4-modelagem-e-persistência-de-dados)
  - [4.1. Escolha do Banco de Dados](#41-escolha-do-banco-de-dados)
  - [4.2. Estrutura da Modelagem de Dados (Edital Fase 2 - Item 7)](#42-estrutura-da-modelagem-de-dados-edital-fase-2---item-7)
  - [4.3. Ciclo de Vida da Carga, Máquina de Estados e Auditoria](#43-ciclo-de-vida-da-carga-máquina-de-estados-e-auditoria)
- [5. Configuração e Execução](#5-configuração-e-execução)
  - [5.1. Pré-requisitos](#51-pré-requisitos)
  - [5.2. Variáveis de Ambiente](#52-variáveis-de-ambiente)
  - [5.3. Executando com Docker e Localmente](#53-executando-com-docker-e-localmente)
  - [5.4. Scripts Disponíveis](#54-scripts-disponíveis)
- [6. Documentação da API e Endpoints](#6-documentação-da-api-e-endpoints)
  - [6.1. Swagger / OpenAPI](#61-swagger--openapi)
  - [6.2. Controle de Status da Carga Química (Ciclo de Vida)](#62-controle-de-status-da-carga-química-ciclo-de-vida)
  - [6.3. Principais Endpoints](#63-principais-endpoints)
- [7. Qualidade de Software e Testes](#7-qualidade-de-software-e-testes)
- [8. Logs e Observabilidade Inicial (Edital Item 10)](#8-logs-e-observabilidade-inicial-edital-item-10)
- [9. Integração Contínua (CI/CD)](#9-integração-contínua-cicd)
- [10. Diferenciais e APIs Além de REST (Edital Item 14)](#10-diferenciais-e-apis-além-de-rest-edital-item-14)
- [11. Integrantes do Grupo](#11-integrantes-do-grupo)

---

## 1. Sobre o Projeto

### 1.1. Contexto do Problema

As operações portuárias de comércio exterior — inspiradas na rotina de terminais logísticos como o **Porto de Santos** — movimentam diariamente milhares de toneladas de insumos e cargas perigosas. A gestão desse fluxo impõe desafios críticos de segurança operacional, meio ambiente e conformidade regulatória:

- **Riscos Severos de Acidentes e Contaminação:** O manuseio e armazenagem de compostos químicos inflamáveis, tóxicos ou corrosivos exigem segregação rigorosa por classes de risco e grupos de compatibilidade.
- **Burocracia e Fiscalização Rigorosa:** Nenhuma carga química pode desembarcar, transitar ou ser liberada sem documentação técnica completa (como FISPQ/FDS, licenças ambientais, certificados e notas fiscais) e vistorias físicas dos fiscais portuários.
- **Falhas de Rastreabilidade Humana:** Processos manuais aumentam os riscos de liberações indevidas de cargas bloqueadas, falta de responsáveis técnicos nomeados ou ausência de histórico confiável de auditoria.

### 1.2. A Solução Quimovia

O **Quimovia** é uma plataforma backend concebida para atuar como o núcleo transacional e fiscalizador do pátio portuário. A aplicação centraliza:

1. **Gestão do Ciclo de Vida da Carga Química:** Controle rigoroso de status, impedindo transições ilícitas (máquina de estados finitos).
2. **Fiscalização e Inspeção Física:** Protocolo digital para vistorias de integridade de embalagens, ausência de vazamento, rotulagem correta, validade e equipamentos de segurança.
3. **Controle de Acessos e Responsáveis Técnicos:** Governança por papéis operacionais (Operador Portuário, Motorista/Transportador, Responsável Técnico, Gerente de Operações e Administrador).
4. **Governança Documental:** Bloqueio mandatório de liberação sem os devidos identificadores de documentação anexados.

### 1.3. Objetivos do Tech Challenge (Fase 2)

O Tech Challenge é a atividade integradora obrigatória da Pós-Graduação em Full Stack Development da FIAP (valendo 90% da nota da fase). Nesta Fase 2, o objetivo é transformar a modelagem de domínio realizada na etapa anterior em uma implementação backend em Node.js com:

- API REST documentada e validada;
- Banco de dados relacional com integridade referencial;
- Containerização e orquestração com Docker;
- Cobertura de testes automatizados (unitários e ponta a ponta);
- Pipeline de integração contínua (CI) automatizado via GitHub Actions;
- Arquitetura limpa com separação estrita de responsabilidades.

---

## 2. Arquitetura e Design de Software

O Quimovia adota o padrão **Monólito Modular** fundamentado nos princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**. A aplicação é estruturada em _bounded contexts_ independentes (`chemical-shipment`, `inspection`, `user`, `document-compliance`, `audit-log`), protegendo as regras de negócio centrais contra dependências diretas de frameworks externos ou bibliotecas de infraestrutura.

> ### 📖 Documentação Detalhada da Arquitetura
>
> Todas as decisões arquiteturais, estruturação detalhada de pastas, mapeamento de camadas (`domain`, `application`, `infrastructure`, `presentation`), regras de dependência, padrões de nomenclatura e boas práticas estão centralizadas na pasta [`docs/`](./docs/):
>
> 🔗 **Consulte a documentação completa em:** [**`docs/arquitetura/02-organizacao-e-aplicacao.md`**](./docs/arquitetura/02-organizacao-e-aplicacao.md)

---

## 3. Tecnologias Utilizadas e Justificativa de Escolha

- **Runtime:** [Node.js](https://nodejs.org/) (versão 24.x LTS)
- **Framework Web:** [NestJS](https://nestjs.com/) v12
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) v6
- **ORM & Migrations:** [Prisma ORM](https://www.prisma.io/) v7 (utilizando `@prisma/adapter-mariadb` e client tipado em `src/generated/prisma`)
- **Banco de Dados:** [MySQL](https://www.mysql.com/) 8.4 (executado via Docker)
- **Documentação de API:** [Swagger / OpenAPI 3.0](https://swagger.io/) (`@nestjs/swagger`)
- **Testes Automatizados:** [Jest](https://jestjs.io/) e [Supertest](https://github.com/ladjs/supertest)
- **Linter & Formatador:** [Oxlint](https://oxc.rs/) e [Prettier](https://prettier.io/)
- **Containerização:** [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- **Integração Contínua (CI):** [GitHub Actions](https://github.com/features/actions)

### 3.1. Justificativa da Escolha do Framework (NestJS)

Conforme estabelecido no Edital do Tech Challenge (Fase 2, item 1), o grupo optou pelo **NestJS** pelos seguintes fatores técnicos e arquiteturais:
1. **Aderência Natural a Clean Architecture e DDD:** O NestJS fornece um sistema nativo de injeção de dependências e inversão de controle (`IoC`), permitindo isolar a camada de domínio puro contra acoplamentos de infraestrutura e HTTP.
2. **Modularidade e Escalabilidade (Monólito Modular):** A separação em módulos (`ChemicalProductsModule`, `ChemicalShipmentModule`, `InspectionModule`, `UserModule`, `DocumentComplianceModule`) reflete os *bounded contexts* do negócio portuário.
3. **Pipeline Robusto de Validação e Documentação:** Integração declarativa com `class-validator` e `class-transformer` via `ValidationPipe`, além de geração automática de contratos OpenAPI via `@nestjs/swagger`.
4. **Tratamento Centralizado de Exceções:** Uso de `ExceptionFilters` (`DomainExceptionFilter`) para capturar erros agnósticos de domínio (`BusinessRuleError`, `ResourceNotFoundError`, `ConflictError`) e traduzi-los de forma consistente para os status HTTP correspondentes (`422`, `404`, `409`).

---

## 4. Modelagem e Persistência de Dados

### 4.1. Escolha do Banco de Dados

A persistência do Quimovia foi estruturada sobre o banco relacional **MySQL 8.4** (conforme permitido pelo edital, que prevê bancos relacionais ou NoSQL):

- **Garantias ACID:** Operações de liberação, inspeção e bloqueio de cargas químicas demandam consistência transacional absoluta.
- **Integridade Referencial Forte:** Cargas obrigatoriamente referenciam produtos químicos existentes e usuários responsáveis (`Foreign Keys`), impedindo órfãos em operações críticas.
- **Consultas Relacionais com Índices:** Utilização de índices em campos de consulta frequente (`[responsibleUserId]`, `[status]`, `[productId]` e índices compostos de auditoria e inspeção).

### 4.2. Estrutura da Modelagem de Dados (Edital Fase 2 - Item 7)

Conforme exigido pelo edital, a modelagem de dados responde às seguintes diretrizes:

1. **Como os produtos químicos são armazenados:**
   - Armazenados na tabela `ChemicalProduct`.
   - Contém chave primária UUID, código identificador único (`code`), nome técnico (`technicalName`), descrição/nome comercial (`tradeName`), número ONU (`unNumber` com 4 dígitos numéricos), enums para classe de risco (`riskClass`) e estado físico (`physicalState`), status operacional (`ProductStatus`) e carimbos de auditoria (`createdAt`, `updatedAt`).
   - Possui relação 1:N com a tabela `ProductDocument` com deleção em cascata para armazenamento de dossiês fiscais e ambientais vinculados ao produto.
2. **Como as cargas químicas são armazenadas:**
   - Armazenadas na tabela `ChemicalShipment`.
   - Contém identificador UUID, código identificador da carga (`code`), chave estrangeira para o produto químico (`productId`), chave estrangeira para o responsável técnico (`responsibleUserId`), quantidade de produto químico (`quantityProduct`), unidade de medida (`unit`), procedência (`origin`), destino portuário (`destination`), data de entrada no pátio (`entryDate`), protocolo de documentação declarada (`documentsIds`), carimbos de criação, atualização e `deletedAt` para suporte a soft delete / inativação lógica.
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

### 4.3. Ciclo de Vida da Carga, Máquina de Estados e Auditoria

- **Status Canônico em Banco (`ENUM`):** O status da carga é armazenado como um tipo `ENUM` nativo do MySQL (`REGISTERED`, `ANALYZING`, `INSPECTION`, `APPROVED`, `REPROVED`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`). Toda nova carga nasce estritamente com o status `REGISTERED`.
- **Regras de Negócio no Domínio:** A máquina de estados não é delegada a constraints de banco nem espalhada em controllers; ela é encapsulada na camada de domínio puro ([`shipment-status-transitions.ts`](./src/modules/chemical-shipment/domain/value-objects/chemical-shipment/shipment-status-transitions.ts)), sendo validada pela entidade [`ChemicalShipment`](./src/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts) antes de qualquer persistência.
- **Rastreabilidade e Auditoria Imutável:** Todas as transições de status geram registros imutáveis na tabela `ChemicalShipmentLog` com a ação `STATUS_CHANGED`, persistindo o usuário operador (`actorId`, `actorName`), timestamp e os metadados `{ "from": "<STATUS_ANTERIOR>", "to": "<NOVO_STATUS>" }`.
- **Performance:** A coluna `status` da tabela `ChemicalShipment` conta com um índice dedicado (`ChemicalShipment_status_idx`), garantindo consultas eficientes de cargas por situação operacional no pátio.

## 5. Configuração e Execução

### 5.1. Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão `>= 20.x`, recomendado `24.x`);
- [npm](https://www.npmjs.com/) (versão `>= 10.x`);
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados e em execução.

### 5.2. Variáveis de Ambiente

O projeto utiliza um arquivo `.env` para parametrizar credenciais, portas e conexão com o banco de dados. As configurações disponíveis são:

| Variável                 | Descrição                                                                                                | Exemplo Padrão                                                                                             |
| :----------------------- | :------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD`    | Senha do usuário root do container MySQL                                                                 | `root_secret`                                                                                              |
| `MYSQL_USER`             | Usuário da aplicação no banco                                                                            | `quimovia_user`                                                                                            |
| `MYSQL_PASSWORD`         | Senha do usuário da aplicação                                                                            | `quimovia_pass`                                                                                            |
| `MYSQL_DATABASE`         | Nome do banco de dados                                                                                   | `quimovia_db`                                                                                              |
| `DATABASE_URL`           | URL de conexão utilizada pelo Prisma ORM                                                                 | `mysql://quimovia_user:quimovia_pass@localhost:3333/quimovia_db?allowPublicKeyRetrieval=true&useSSL=false` |
| `PORT`                   | Porta HTTP da API (opcional, padrão `3000`)                                                              | `3000`                                                                                                     |
| `JWT_SECRET`             | Segredo que assina os tokens de acesso; obrigatório, com ao menos 32 caracteres (a API não sobe sem ele) | gerado com `openssl rand -base64 48`                                                                       |
| `JWT_EXPIRES_IN_SECONDS` | Duração das sessões e dos tokens, em segundos (opcional, padrão `3600`)                                  | `31536000` (1 ano) no ambiente local; `3600` em produção                                                   |
| `ADMIN_NAME`             | Nome do administrador inicial criado pelo seed (opcional)                                                | `Administrador do Sistema`                                                                                 |
| `ADMIN_EMAIL`            | E-mail do administrador inicial criado pelo seed                                                         | `admin@quimovia.com`                                                                                       |
| `ADMIN_PASSWORD`         | Senha do administrador inicial, com ao menos 8 caracteres                                                | `Quimovia@2026` (padrão do `.env.example`; troque fora do ambiente local)                                  |

### 5.3. Executando com Docker e Localmente

Siga o passo a passo abaixo para inicializar o ambiente completo:

#### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/TechChallengeFiap/QuimoviaApi.git
cd QuimoviaApi
npm install
```

#### 2. Configurar as variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto com base no modelo de exemplo:

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell / CMD)
copy .env.example .env
```

> **Importante:** O `docker-compose.yml` utiliza essas variáveis para inicializar o MySQL. Verifique se as credenciais de `MYSQL_*` e a string de conexão em `DATABASE_URL` estão configuradas corretamente.

> **Autenticação:** só o `JWT_SECRET` vem em branco no exemplo e precisa ser preenchido; sem ele, a API não sobe. Para gerá-lo, use por exemplo `openssl rand -base64 48`. O exemplo já traz o administrador inicial (`admin@quimovia.com` / `Quimovia@2026`) e o token com prazo de 1 ano, para facilitar o uso local e a avaliação.

### 5.3. Executando com Docker e Localmente

Você pode executar o Quimovia de duas formas: **100% via Docker** (API + Banco de Dados em containers) ou **modo híbrido** (banco no Docker e API rodando localmente para desenvolvimento).

---

#### Opção A: Execução Completa via Docker (Recomendada / Avaliação)

Com apenas um comando, o Docker Compose inicializa o banco MySQL, aguarda o _healthcheck_ de prontidão, compila a imagem da API via multi-stage build, aplica as migrações do Prisma, executa o seed do administrador inicial e sobe a aplicação:

1. **Configurar as variáveis de ambiente:**
   ```bash
   # Linux / macOS
   cp .env.example .env

   # Windows (PowerShell / CMD)
   copy .env.example .env
   ```
   > Certifique-se de preencher `JWT_SECRET` (mínimo 32 caracteres) e `ADMIN_PASSWORD` (mínimo 8 caracteres) no `.env`.

2. **Subir todos os serviços (API + MySQL):**
   ```bash
   docker compose up -d --build
   ```

3. **Verificar os serviços:**
   ```bash
   docker compose ps
   ```
   Ambos os containers (`quimovia-mysql` e `quimovia-api`) devem estar com status _running_ e _healthy_.

4. **Acessar a API:**
   - **API REST:** [http://localhost:3000](http://localhost:3000)
   - **Documentação Interativa Swagger:** [http://localhost:3000/api](http://localhost:3000/api)

5. **Para parar os containers:**
   ```bash
   docker compose down
   ```

---

#### Opção B: Desenvolvimento Local (Banco no Docker + API na Máquina)

Se você estiver desenvolvendo e quiser aproveitar o hot-reload (`tsx watch`):

1. **Subir apenas o container do MySQL:**
   ```bash
   docker compose up -d mysql
   ```

2. **Gerar o Prisma Client e aplicar migrações:**
   ```bash
   npm run migrate:generate
   npm run migrate:dev
   ```

3. **Criar o administrador inicial (Seed):**
   ```bash
   npm run migrate:seed
   ```
   > O seed pode ser executado mais de uma vez: se o e-mail já estiver cadastrado, nada é alterado. Com o `.env.example`, o login do administrador é `admin@quimovia.com` com a senha `Quimovia@2026`.

4. **Iniciar a API em modo desenvolvimento:**
   ```bash
   npm run start:dev
   ```
   A aplicação estará acessível em `http://localhost:3000` (Swagger: `http://localhost:3000/api`).

---

### 5.4. Scripts Disponíveis

| Comando                    | Descrição                                                   |
| :------------------------- | :---------------------------------------------------------- |
| `npm run start:dev`        | Inicia o servidor com hot-reload ativo via `tsx watch`      |
| `npm run start:debug`      | Inicia em modo debug expondo a porta de inspeção `9229`     |
| `npm run build`            | Compila os arquivos TypeScript gerando o bundle em `dist/`  |
| `npm run start:prod`       | Executa a versão compilada em produção (`node dist/main`)   |
| `npm run lint`             | Executa verificação estática de tipos e regras com `oxlint` |
| `npm run format`           | Formata todo o código-fonte via `prettier`                  |
| `npm run migrate:generate` | Gera o cliente Prisma tipado                                |
| `npm run migrate:dev`      | Executa migrations em modo desenvolvimento                  |
| `npm run migrate:deploy`   | Aplica migrations pendentes no banco                        |
| `npm run migrate:seed`     | Cria o administrador inicial (também via `prisma db seed`)  |

---

## 6. Documentação da API e Endpoints

### 6.1. Swagger / OpenAPI

A API possui documentação interativa completa via Swagger. Com a aplicação em execução, acesse pelo navegador:

📍 **URL do Swagger:** [http://localhost:3000/api](http://localhost:3000/api)

A documentação inclui exemplos de payloads, esquemas de entrada/saída, validações de campos e possíveis retornos de erro (`400`, `401`, `403`, `404`, `422`).

Para testar as rotas que exigem login pelo Swagger, faça login em `POST /auth/login`, copie o `accessToken` da resposta e informe-o no botão **Authorize**. O Swagger guarda o token mesmo depois de recarregar a página.

#### Roteiro rápido para avaliar a API

1. Copie o `.env.example` para `.env` e preencha o `JWT_SECRET` (`openssl rand -base64 48`).
2. Suba o banco: `docker compose up -d`.
3. Crie as tabelas e o administrador: `npm run migrate:dev` e `npm run migrate:seed`.
4. Suba a API: `npm run start:dev`.
5. No Swagger ([http://localhost:3000/api](http://localhost:3000/api)), faça login em `POST /auth/login` com `admin@quimovia.com` / `Quimovia@2026`.
6. Copie o `accessToken`, clique em **Authorize** e cole o token. Ele vale por 1 ano e continua salvo no Swagger, então o login é feito uma vez só.

### 6.2. Controle de Status da Carga Química (Ciclo de Vida)

Conforme as diretrizes do **Edital do Tech Challenge (Fase 2)**, a carga química segue uma máquina de estados finitos com regras inegociáveis de transição, garantindo conformidade operacional, segurança no pátio e impossibilidade de bypass.

#### Diagrama da Máquina de Estados

```mermaid
stateDiagram-v2
  [*] --> REGISTERED : Cadastro da carga
  REGISTERED --> ANALYZING : Iniciar análise
  ANALYZING --> INSPECTION : Enviar para inspeção
  INSPECTION --> APPROVED : Liberar (exige doc. ativa)
  INSPECTION --> REPROVED : Bloquear vistoria
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

#### Matriz de Transições Canônicas do Edital

| Status Atual | Nome Legível | Transições Permitidas | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| `REGISTERED` | Registrada | `ANALYZING`, `CANCELLED` | Status inicial de toda carga recém-criada no sistema. |
| `ANALYZING` | Em análise | `INSPECTION`, `CANCELLED` | Triagem inicial de conformidade preliminar da carga. |
| `INSPECTION` | Em inspeção | `APPROVED`, `REPROVED`, `CANCELLED` | Vistoria técnica. A liberação para `APPROVED` **exige documentação obrigatória ativa e vigente**. |
| `APPROVED` | Liberada | `IN_TRANSIT`, `CANCELLED` | Carga apta para trânsito logístico no terminal portuário. |
| `REPROVED` | Bloqueada | `CANCELLED` | Carga reprovada na vistoria. **Proibida de entrar em movimentação**. |
| `IN_TRANSIT` | Em movimentação | `COMPLETED` | Transporte em andamento no terminal. |
| `COMPLETED` | Finalizada | *(nenhuma)* | **Estado Terminal:** imutável, não permite novas alterações de status. |
| `CANCELLED` | Cancelada | *(nenhuma)* | **Estado Terminal:** cancelada não pode ser liberada nem reativada. |

#### Regras Inegociáveis de Proteção de Domínio

1. **Compliance Documental Mandatório:** Uma carga **não pode ser liberada (`APPROVED`) sem documentação técnica obrigatória ativa e vigente** verificada via módulo `document-compliance` (retorna erro `422 Unprocessable Entity`).
2. **Carga Bloqueada:** Uma carga bloqueada/reprovada (`REPROVED`) **jamais pode entrar em movimentação** (`IN_TRANSIT`).
3. **Imutabilidade Terminal:** Cargas finalizadas (`COMPLETED`) ou canceladas (`CANCELLED`) não podem sofrer nenhuma transição posterior.
4. **Fechamento de Backdoor na Edição:** Alterações cadastrais na carga (`quantityProduct`, etc.) via `PATCH /chemical-shipment/:id` são permitidas **estritamente nos status `REGISTERED` e `ANALYZING`**. Uma vez enviada para inspeção ou liberada, a composição física está lacrada para edição.
5. **Auditoria Contínua:** Toda e qualquer mudança de status grava automaticamente um registro em `ChemicalShipmentLog` com ação `STATUS_CHANGED`, registrando autor, data e metadados com status de origem e destino (`{ from, to }`).

#### Endpoints do Ciclo de Vida da Carga

A API disponibiliza tanto a rota de transição exigida pelo edital quanto endpoints semânticos (*task-based*), além de um endpoint diferencial para consulta das transições abertas:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/chemical-shipment/:id/transitions` | **[Diferencial]** Consulta as transições válidas abertas para o status atual da carga, seus rótulos legíveis e se está em estado terminal. |
| `PATCH` | `/chemical-shipment/:id/status` | **[Edital]** Altera o status da carga conforme a máquina de estados validando regras de transição (`{ "status": "ANALYZING" }`). |
| `PATCH` | `/chemical-shipment/:id/release` | **[Edital / Liberar]** Libera a carga química (`APPROVED`), conferindo automaticamente a suficiência documental. |
| `PATCH` | `/chemical-shipment/:id/block` | **[Edital / Bloquear]** Bloqueia a carga química (`REPROVED`) a partir do status de inspeção. |
| `PATCH` | `/chemical-shipment/:id/cancel` | **[Edital / Cancelar]** Cancela a carga química a partir dos status permitidos, tornando-a terminal. |

#### Exemplos de Requisição e Resposta

##### 1. Consulta de Transições Permitidas (Diferencial)
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

##### 2. Alteração de Status pelo Endpoint Geral do Edital
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
  "productId": "88733221-39fe-4ef9-8cc5-4e7cb803ba91",
  "quantityProduct": 100,
  "status": "ANALYZING",
  "responsibleUserId": "f12ca16e-5fa7-4a0f-ba10-8b29df939ac1",
  "documentsIds": "doc-fispq-2026",
  "createdAt": "2026-10-24T12:00:00.000Z",
  "updatedAt": "2026-10-24T12:05:00.000Z"
}
```

##### 3. Tentativa de Liberação sem Documentação Técnica Obrigatória
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

#### Mapeamento Semântico de Códigos de Erro HTTP

| Código | Significado | Quando Ocorre |
| :--- | :--- | :--- |
| `400 Bad Request` | Erro Sintático / Validação | Payload malformatado, campos obrigatórios ausentes, tipos incorretos ou enum inválido no DTO. |
| `401 Unauthorized` | Não Autenticado | Ausência do cabeçalho `Authorization: Bearer <token>` ou token JWT expirado/inválido. |
| `403 Forbidden` | Não Autorizado | Usuário autenticado não possui papel operacional permitido para executar a ação. |
| `404 Not Found` | Recurso Não Encontrado | Identificador de carga química, usuário responsável ou produto químico não localizado. |
| `422 Unprocessable Entity` | Erro de Regra de Negócio | Transição proibida na máquina de estados, liberação sem documentação ou movimentação de carga bloqueada (`BusinessRuleError`). |

### 6.3. Principais Endpoints

As rotas protegidas pelo `AuthGuard` exigem o cabeçalho `Authorization: Bearer <token>`, com o token de uma sessão ativa; sem ele, a API responde `401`. Hoje, o guard protege o logout e a gestão de usuários; cada módulo pode exigir login nas próprias rotas importando o `AuthModule` e usando `@UseGuards(AuthGuard)`. Para restringir a rota a alguns perfis, use `@UseGuards(AuthGuard, RolesGuard)` com `@Roles()`: com outro perfil, a API responde `403`. O perfil conferido é o atual do usuário, então uma troca de perfil vale já na próxima requisição.

#### Autenticação (`/auth`)

- `POST /auth/login` — Confere e-mail e senha, inicia uma sessão e devolve o token de acesso (`401` para credenciais inválidas e `403` para conta inativa ou bloqueada).
- `POST /auth/logout` — Encerra a sessão do token enviado, que deixa de valer na hora.

Bloquear, inativar ou excluir um usuário encerra as sessões dele, e reativar a conta não as reativa: é preciso fazer login de novo.

A autorização por perfil (RN-ACE-04) é aplicada, por enquanto, na gestão de usuários.

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
- `PATCH /chemical-shipment/:id` — Atualiza dados cadastrais da carga (`quantityProduct`, `code`, `unit`, `origin`, `destination`, `entryDate`). Permitido exclusivamente nos status `REGISTERED` e `ANALYZING`.
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

#### Usuários e Acessos (`/users`)

Cadastrar usuários internos, remover e trocar o perfil de usuários exige o token de um Administrador do Sistema (`401` sem token e `403` para os outros perfis). Na edição, o administrador altera qualquer usuário, e os demais perfis só os próprios dados, sem poder se bloquear. Os embarcadores (usuários externos) se cadastram sozinhos pela rota pública `POST /users/shippers`.

- `POST /users` — Cadastra operador, fiscal ou responsável técnico com hash seguro de senha.
- `POST /users/shippers` — Cadastro público do embarcador, sem token: o perfil é sempre `SHIPPER_DRIVER` e a conta já nasce ativa; enviar `role` ou `status` retorna `400`, e o e-mail de um usuário excluído retorna `409` (só o administrador reativa a conta).
- `GET /users` — Lista usuários cadastrados com suporte a busca por e-mail, perfil e status.
- `GET /users/:id` — Busca informações cadastrais do usuário.
- `PATCH /users/:id` — Atualiza nome, e-mail, senha ou status (`ACTIVE`, `INACTIVE`, `BLOCKED`).
- `PATCH /users/:id/role` — Troca o perfil de acesso do usuário (só o administrador).
- `DELETE /users/:id` — Exclui o usuário logicamente (`isDeleted` e `deletedAt`): ele some das buscas e da listagem e perde o acesso, mas o registro é mantido. Cadastrar de novo o mesmo e-mail em `POST /users` reativa esse registro, com o mesmo id.

---

## 7. Qualidade de Software e Testes

A suíte de testes cobre regras de domínio, casos de uso, filtros de erro e fluxos de integração:

```bash
# Executa os testes unitários
npm test

# Executa os testes em modo watch (desenvolvimento contínuo)
npm run test:watch

# Executa os testes de integração e ponta a ponta (E2E)
npm run test:e2e

# Gera o relatório completo de cobertura de código
npm run test:cov
```

Os testes automatizados validam cenários críticos exigidos no Tech Challenge, incluindo:

- Bloqueio de liberação de carga sem documentação obrigatória;
- Impedimento de transições ilegais na máquina de estados;
- Bloqueio de movimentação de cargas marcadas como `BLOCKED`;
- Validação e hash criptográfico de senhas;
- Login, sessões com expiração e encerramento, e exigência do token de acesso nas rotas protegidas pelo `AuthGuard`;
- Gestão de usuários restrita ao Administrador do Sistema, com a troca de perfil em rota própria e valendo na próxima requisição; os demais usuários editam só os próprios dados;
- Tratamento de exceções e mapeamento padronizado de erros de domínio.

---

## 8. Logs e Observabilidade Inicial (Edital Item 10)

O Quimovia implementa uma estratégia de observabilidade em camadas para facilitar o monitoramento operacional e a auditoria forense do pátio:

1. **Auditoria Transacional em Banco (Tabelas `*Log`):**
   - Cada bounded context conta com uma tabela de log imutável dedicada (`ChemicalShipmentLog`, `ChemicalProductLog`, `UserLog`, `InspectionLog`, `ShipmentDocumentLog`).
   - Registra o identificador da entidade afetada (`entityId`), o operador responsável (`actorId`, `actorName`), a ação realizada (`CREATED`, `STATUS_CHANGED`, `DELETED`, etc.), timestamp de auditoria e detalhes contextuais em JSON (como status anterior e novo: `{ from, to }`).
   - Os logs de auditoria sobrevivem mesmo a eventuais exclusões lógicas das entidades monitoradas e podem ser consultados via endpoint `GET /logs/chemical-shipments`.
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

## 9. Integração Contínua (CI/CD)

O projeto conta com um pipeline automatizado de Integração Contínua configurado via GitHub Actions em [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

O pipeline é disparado automaticamente a cada `push` ou `pull_request` nas branches `main` e `develop`:

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

## 10. Diferenciais e APIs Além de REST (Edital Item 14)

Conforme destacado no edital, o core obrigatório da Fase 2 é 100% suportado pela **API RESTful**. Além do fluxo padrão, o projeto implementa diferenciais como:

1. **Endpoint de Transições Abertas (`GET /chemical-shipment/:id/transitions`):**
   - Permite que interfaces frontend ou sistemas de pátio consultem dinamicamente em tempo real quais transições de status estão abertas para a carga, seus rótulos legíveis e se ela já atingiu um estado terminal.
2. **Backlog de APIs Complementares (GraphQL / gRPC):**
   - Para as próximas etapas de evolução do QuimiPort, está prevista a introdução de um gateway GraphQL para consultas compostas (ex.: consultar detalhes de um produto químico agregando histórico de cargas e inspeções em uma única requisição flexível), bem como serviços gRPC para validação de alta vazão nas cancelas físicas de entrada portuária.

---

## 11. Integrantes do Grupo

Projeto desenvolvido para a **Pós-Graduação em Full Stack Development — FIAP**:

| Nome             | RM      |  GitHub |
| :--------------- | :------ | :---------------- |
| **Ygor Takashi Nishi** | RM: 375939 | [Perfil](https://github.com/TakashiNishii)       |
| **Matheus Felicio Brazolin** | RM: 375006 | [Perfil](https://github.com/MatheusBrazolin)       |
| **Paulo Henrique dos Santos Miliano** | RM375284 | [Perfil](https://github.com/PauloMiliano)       |
| **Letícia Gabrielle Videira dos Santos** | RM: 376263 | [Perfil](https://github.com/SantosLet)       |

---

<p align="center">
  <sub>Quimovia API • FIAP Pós Tech • Tech Challenge Fase 2</sub>
</p>
