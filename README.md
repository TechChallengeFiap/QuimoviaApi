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
- [3. Tecnologias Utilizadas](#3-tecnologias-utilizadas)
- [4. Modelagem e Persistência de Dados](#4-modelagem-e-persistência-de-dados)
  - [4.1. Escolha do Banco de Dados](#41-escolha-do-banco-de-dados)
- [5. Configuração e Execução](#5-configuração-e-execução)
  - [5.1. Pré-requisitos](#51-pré-requisitos)
  - [5.2. Variáveis de Ambiente](#52-variáveis-de-ambiente)
  - [5.3. Executando com Docker e Localmente](#53-executando-com-docker-e-localmente)
  - [5.4. Scripts Disponíveis](#54-scripts-disponíveis)
- [6. Documentação da API e Endpoints](#6-documentação-da-api-e-endpoints)
  - [6.1. Swagger / OpenAPI](#61-swagger--openapi)
  - [6.2. Principais Endpoints](#62-principais-endpoints)
- [7. Qualidade de Software e Testes](#7-qualidade-de-software-e-testes)
- [8. Integração Contínua (CI/CD)](#8-integração-contínua-cicd)
- [9. Integrantes do Grupo](#9-integrantes-do-grupo)

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

O Quimovia adota o padrão **Monólito Modular** fundamentado nos princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**. A aplicação é estruturada em _bounded contexts_ independentes (`chemical-shipment`, `inspection`, `user`), protegendo as regras de negócio centrais contra dependências diretas de frameworks externos ou bibliotecas de infraestrutura.

> ### 📖 Documentação Detalhada da Arquitetura
>
> Todas as decisões arquiteturais, estruturação detalhada de pastas, mapeamento de camadas (`domain`, `application`, `infrastructure`, `presentation`), regras de dependência, padrões de nomenclatura e boas práticas estão centralizadas na pasta [`docs/`](./docs/):
>
> 🔗 **Consulte a documentação completa em:** [**`docs/arquitetura-e-organizacao.md`**](./docs/arquitetura-e-organizacao.md)

---

## 3. Tecnologias Utilizadas

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

---

## 4. Modelagem e Persistência de Dados

### 4.1. Escolha do Banco de Dados

A persistência do Quimovia foi estruturada sobre o banco relacional **MySQL 8.4**:

- **Garantias ACID:** Operações de liberação, inspeção e bloqueio de cargas químicas demandam consistência transacional absoluta.
- **Integridade Referencial Forte:** Cargas obrigatoriamente referenciam usuários responsáveis existentes e itens de inspeção vinculam-se unicamente às suas respectivas vistorias (`Foreign Keys` e `Cascades`).
- **Consultas Relacionais com Índices:** Utilização de índices compostos em campos de consulta frequente (como `[cargoId]`, `[inspectorId, status]` e `[responsibleUserId]`).

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
| `JWT_EXPIRES_IN_SECONDS` | Duração das sessões e dos tokens, em segundos (opcional, padrão `3600`)                                  | `3600`                                                                                                     |

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

> **Autenticação:** o `JWT_SECRET` vem em branco no exemplo e precisa ser preenchido; sem um valor válido, a API não sobe. Para gerá-lo, use por exemplo `openssl rand -base64 48`.

#### 3. Subir o container do banco de dados (MySQL)

Utilize o Docker Compose para iniciar o banco em segundo plano (a porta exposta é `3333` para evitar conflitos locais):

```bash
docker compose up -d
```

> **Verificação:** Para conferir o status do container, execute `docker compose ps`. O container `quimovia-mysql` deve estar com status _healthy/running_.

#### 4. Gerar o Prisma Client

Gera os clientes tipados com base em `prisma/schema.prisma` dentro de `src/generated/prisma`:

```bash
npm run migrate:generate
```

#### 5. Executar as Migrações do Banco

Aplica as tabelas, enums e índices no banco de dados recém-iniciado:

```bash
# Ambiente de desenvolvimento (cria e aplica)
npm run migrate:dev

# Ou para deploy / ambiente já versionado
npm run migrate:deploy
```

#### 6. Iniciar a API em Desenvolvimento

```bash
npm run start:dev
```

A aplicação estará acessível em: `http://localhost:3000`  
A documentação Swagger estará disponível em: `http://localhost:3000/api`

> A API não sobe sem um `JWT_SECRET` válido no `.env`.

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

---

## 6. Documentação da API e Endpoints

### 6.1. Swagger / OpenAPI

A API possui documentação interativa completa via Swagger. Com a aplicação em execução, acesse pelo navegador:

📍 **URL do Swagger:** [http://localhost:3000/api](http://localhost:3000/api)

A documentação inclui exemplos de payloads, esquemas de entrada/saída, validações de campos e possíveis retornos de erro (`400`, `401`, `403`, `404`, `422`).

Para testar as rotas que exigem login pelo Swagger, como o logout, faça login em `POST /auth/login`, copie o `accessToken` da resposta e informe-o no botão **Authorize**.

### 6.2. Principais Endpoints

As rotas protegidas pelo `AuthGuard` exigem o cabeçalho `Authorization: Bearer <token>`, com o token de uma sessão ativa; sem ele, a API responde `401`. Por enquanto, só o logout usa o guard: cada módulo pode exigir login nas próprias rotas importando o `AuthModule` e usando `@UseGuards(AuthGuard)`.

#### Autenticação (`/auth`)

- `POST /auth/login` — Confere e-mail e senha, inicia uma sessão e devolve o token de acesso (`401` para credenciais inválidas e `403` para conta inativa ou bloqueada).
- `POST /auth/logout` — Encerra a sessão do token enviado, que deixa de valer na hora.

Bloquear ou inativar um usuário encerra as sessões dele, e reativar a conta não as reativa: é preciso fazer login de novo.

A autorização por perfil (RN-ACE-04) ainda não é aplicada.

#### Cargas Químicas (`/chemical-shipment`)

- `POST /chemical-shipment` — Registra uma nova carga química (status inicial `ANALYZING`).
- `GET /chemical-shipment` — Lista cargas químicas com paginação e filtros (`status`, `productId`, `responsibleUserId`, `documentsIds`).
- `GET /chemical-shipment/:id` — Retorna os detalhes de uma carga química pelo ID.
- `PATCH /chemical-shipment/:id` — Atualiza dados da carga ou avança seu status segundo as regras de transição.
- `DELETE /chemical-shipment/:id` — Realiza a inativação/remoção da carga química.

#### Inspeções Portuárias (`/inspections`)

- `POST /inspections` — Registra nova inspeção técnica para a carga total ou item específico.
- `GET /inspections` — Lista inspeções cadastradas com filtros de status e escopo.
- `GET /inspections/:id` — Consulta o resultado e detalhes de uma inspeção por identificador.
- `PATCH /inspections/:id` — Atualiza o status (`IN_PROGRESS`, `COMPLETED`) e resultado dos itens (`COMPLIANT`, `NON_COMPLIANT`).
- `DELETE /inspections/:id` — Remove registro de inspeção.

#### Usuários e Acessos (`/users`)

- `POST /users` — Cadastra operador, fiscal ou responsável técnico com hash seguro de senha.
- `GET /users` — Lista usuários cadastrados com suporte a busca por e-mail, perfil e status.
- `GET /users/:id` — Busca informações cadastrais do usuário.
- `PATCH /users/:id` — Atualiza dados cadastrais ou status (`ACTIVE`, `INACTIVE`, `BLOCKED`).
- `DELETE /users/:id` — Remove usuário do sistema.

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
- Tratamento de exceções e mapeamento padronizado de erros de domínio.

---

## 8. Integração Contínua (CI/CD)

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

## 9. Integrantes do Grupo

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
