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
- [2. Fluxo principal](#2-fluxo-principal)
- [3. Objetivos](#3-objetivos)
- [4. Escopo da Fase 2](#4-escopo-da-fase-2)
- [5. Arquitetura e organização](#5-arquitetura-e-organização)
- [6. Tecnologias utilizadas](#6-tecnologias-utilizadas)
- [7. Modelagem e persistência de dados](#7-modelagem-e-persistência-de-dados)
- [8. Configuração e execução](#8-configuração-e-execução)
- [9. Documentação da API e endpoints](#9-documentação-da-api-e-endpoints)
- [10. Qualidade de software e testes](#10-qualidade-de-software-e-testes)
- [11. Integração contínua](#11-integração-contínua)
- [12. Equipe](#12-equipe)

---

## 1. Sobre o projeto

O **Quimovia** é um sistema de gestão de cargas químicas em um contexto portuário inspirado nas operações do Porto de Santos.

O controle manual dessas informações dificulta a identificação de pendências, a atribuição de responsabilidades e a consulta ao histórico das cargas. A API organiza esses registros e aplica regras para controlar a liberação, o bloqueio e a movimentação.

O projeto é desenvolvido para o Tech Challenge da pós-graduação em Full Stack Development da FIAP. Nesta Fase 2, o foco é a implementação do backend a partir da [modelagem e da arquitetura definidas na Fase 1](https://github.com/TechChallengeFiap/Quimovia).

## 2. Fluxo principal

O processo começa no cadastro dos produtos e acompanha a carga até sua movimentação e finalização:

1. Cadastrar os produtos químicos e seus documentos.
2. Registrar uma carga vinculada a um produto químico, informando a quantidade e o responsável técnico.
3. Cadastrar a documentação da carga.
4. Registrar as inspeções e seus resultados.
5. Atualizar o status da carga para liberação, bloqueio ou cancelamento, conforme as regras de negócio.
6. Registrar a movimentação e a finalização das cargas liberadas.

## 3. Objetivos

O projeto tem como objetivo centralizar as informações de produtos e cargas químicas, organizar a documentação e as inspeções e identificar os responsáveis pelas operações. O histórico de ações e alterações mantém a rastreabilidade das operações.

A API deve oferecer documentação clara e uma estrutura que facilite testes, manutenção e evolução.

## 4. Escopo da Fase 2

Esta fase entrega a primeira API REST do projeto, com persistência de dados, regras de negócio e gerenciamento de usuários, perfis e sessões. A aplicação inclui registros de auditoria para acompanhar as ações realizadas.

A entrega reúne:

- documentação dos endpoints e exemplos de uso;
- testes automatizados dos principais fluxos;
- ambiente de execução com API e banco em containers;
- automação da validação, compilação e execução dos testes.

## 5. Arquitetura e organização

O backend é um **monólito modular**, orientado por **Domain-Driven Design (DDD)** e **Clean Architecture**. Os módulos em `src/modules/` organizam produtos, cargas, documentação, inspeções, usuários e auditoria. Cada contexto separa domínio, casos de uso, persistência e apresentação HTTP.

O NestJS foi escolhido por oferecer módulos e injeção de dependências, além de integração com validação, Swagger e testes. As decisões e a estrutura de pastas estão documentadas em [Fundamentos e decisões](./docs/arquitetura/01-fundamentos-e-decisoes.md) e [Organização e aplicação](./docs/arquitetura/02-organizacao-e-aplicacao.md).

## 6. Tecnologias utilizadas

| Área                 | Tecnologias adotadas no repositório                      |
| -------------------- | -------------------------------------------------------- |
| Execução             | Node.js 24, utilizado no Dockerfile e no CI.             |
| Backend              | NestJS 12 e TypeScript 6.                                |
| Persistência         | MySQL 8.4 e Prisma ORM 7, com `@prisma/adapter-mariadb`. |
| Validação            | `class-validator` e `class-transformer`.                 |
| Documentação da API  | Swagger/OpenAPI com `@nestjs/swagger`.                   |
| Testes               | Jest e Supertest.                                        |
| Análise e formatação | Oxlint e Prettier.                                       |
| Containers           | Docker e Docker Compose.                                 |
| Integração contínua  | GitHub Actions.                                          |

As versões e dependências estão declaradas no [`package.json`](./package.json) e no lockfile.

## 7. Modelagem e persistência de dados

O projeto utiliza **MySQL** porque seus dados são estruturados e possuem relacionamentos entre produtos, cargas, usuários e inspeções. O modelo relacional permite consultas com índices e integridade referencial; o Prisma realiza o mapeamento e mantém as migrações versionadas.

O produto químico reúne os dados de identificação e risco. A carga registra a operação vinculada a esse produto por `productId`, com quantidade e responsável técnico. Documentos e inspeções registram as evidências da operação.

A [modelagem de dados](./docs/modelagem-de-dados.md) descreve os campos, relacionamentos e registros de auditoria. O modelo implementado está no [`schema.prisma`](./prisma/schema.prisma), com alterações em [`prisma/migrations`](./prisma/migrations).

## 8. Configuração e execução

### 8.1. Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão `24.x`, utilizada no Docker e no CI);
- [npm](https://www.npmjs.com/) (versão `>= 10.x`);
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados e em execução.

### 8.2. Variáveis de ambiente

O projeto utiliza um arquivo `.env` para parametrizar credenciais, portas e conexão com o banco de dados. As configurações disponíveis são:

| Variável                 | Descrição                                                                                                | Exemplo de configuração                                                                                    |
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

### 8.3. Execução com Docker ou ambiente local

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

### 8.4. Outros comandos

| Comando               | Finalidade                                   |
| --------------------- | -------------------------------------------- |
| `npm run build`       | Compila a aplicação em `dist/`.              |
| `npm run start:prod`  | Inicia a aplicação compilada.                |
| `npm run start:debug` | Inicia em modo de depuração na porta `9229`. |
| `npm run lint`        | Executa a análise estática.                  |
| `npm run format`      | Formata os arquivos de código e testes.      |

## 9. Documentação da API e endpoints

### 9.1. Acesso e recursos

Com a aplicação em execução, acesse o [Swagger](http://localhost:3000/api), que apresenta os parâmetros, exemplos de requisição e resposta e códigos de erro. A porta padrão da API é `3000`, configurável por `PORT`.

Para usar as rotas protegidas, faça login em `POST /auth/login` com as credenciais do administrador definidas no `.env` e informe o `accessToken` em **Authorize**. A sessão permanece válida até expirar ou ser encerrada.

| Recurso                 | Rotas principais                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autenticação            | `POST /auth/login` e `POST /auth/logout`.                                                                                                                            |
| Produtos químicos       | `POST`, `GET` em `/chemical-products`; `GET`, `PATCH`, `DELETE` em `/:id`; `PATCH /:id/status`.                                                                      |
| Documentos do produto   | `POST`, `GET` em `/chemical-products/:id/documents`; `GET`, `PATCH`, `DELETE` em `/:documentId`.                                                                     |
| Cargas químicas         | `POST`, `GET` em `/chemical-shipment`; `GET`, `PATCH`, `DELETE` em `/:id`; `PATCH /:id/status`, `/:id/release`, `/:id/block`, `/:id/cancel`; `GET /:id/transitions`. |
| Inspeções               | `POST`, `GET` em `/inspections`; `GET`, `PATCH`, `DELETE` em `/:id`.                                                                                                 |
| Documentação das cargas | `POST`, `GET` em `/shipment-documents`; `GET`, `PATCH`, `DELETE` em `/:id`.                                                                                          |
| Usuários                | `POST`, `GET` em `/users`; `GET`, `PATCH`, `DELETE` em `/:id`; `POST /shippers` e `PATCH /:id/role`.                                                                 |
| Auditoria               | `GET /logs/users`, `/logs/chemical-products`, `/logs/chemical-shipments`, `/logs/inspections` e `/logs/shipment-documents`.                                          |

A [referência da API](./docs/api.md) detalha as operações, as permissões e os exemplos de uso.

### 9.2. Controle de status das cargas

Novas cargas exigem produto ativo, quantidade maior que zero e responsável existente. Elas começam em `REGISTERED` e seguem as transições abaixo:

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

A liberação exige documentação vinculada à carga, não marcada como `NON_COMPLIANT`, com ao menos um anexo não removido e vigente. Os dados cadastrais só podem ser alterados em `REGISTERED` ou `ANALYZING`. Cargas finalizadas ou canceladas não permitem novas transições de status.

## 10. Qualidade de software e testes

A suíte abrange domínio, casos de uso, repositórios, tratamento de erros e rotas HTTP. Os cenários incluem cadastro de produtos e cargas, validações de entrada, transições de status, liberação documental, autenticação e permissões. Os testes HTTP utilizam dependências substituídas.

```bash
# Testes unitários
npm test

# Testes HTTP (E2E)
npm run test:e2e

# Relatório de cobertura
npm run test:cov
```

## 11. Integração contínua

O fluxo em [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) executa instalação de dependências, análise estática, geração do Prisma Client, compilação, testes unitários e E2E e publicação do relatório de cobertura.

É acionado por `push` ou `pull_request` para `main` e `develop`, além da execução manual por `workflow_dispatch`.

## 12. Equipe

| Nome                                     | RM         | GitHub                                       |
| :--------------------------------------- | :--------- | :------------------------------------------- |
| **Ygor Takashi Nishi**                   | RM: 375939 | [Perfil](https://github.com/TakashiNishii)   |
| **Matheus Felicio Brazolin**             | RM: 375006 | [Perfil](https://github.com/MatheusBrazolin) |
| **Paulo Henrique dos Santos Miliano**    | RM: 375284 | [Perfil](https://github.com/PauloMiliano)    |
| **Letícia Gabrielle Videira dos Santos** | RM: 376263 | [Perfil](https://github.com/SantosLet)       |

---

<p align="center">
  <sub>Quimovia API • FIAP Pós Tech • Tech Challenge Fase 2</sub>
</p>
