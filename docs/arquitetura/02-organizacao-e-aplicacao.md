# Arquitetura do Quimovia — Organização e aplicação no projeto

Este é o segundo de dois documentos sobre a arquitetura do Quimovia.

| Documento | Pergunta que responde |
| --- | --- |
| [01 — Fundamentos e decisões](./01-fundamentos-e-decisoes.md) | O que é a arquitetura adotada, que problemas ela resolve e por que foi escolhida? |
| **02 — Organização e aplicação no projeto** (este) | Como esses conceitos viram pastas, módulos, providers e regras de código no repositório? |

Este documento é prático. Ele não repete as explicações do documento 01: quando um conceito aparece aqui, a referência indica onde ele é explicado.

O código é a fonte de verdade sobre **o que existe**. Este documento é a fonte de verdade sobre **o que deve existir**. Quando os dois divergem, a divergência está marcada e registrada na [seção 12](#12-diagnóstico-situação-e-pendências). As regras de dependência da [seção 6](#6-direção-das-dependências) são verificadas automaticamente por testes.

| Marcador | Significado |
| --- | --- |
| ✅ | Implementado e de acordo com a arquitetura |
| ⚠️ | Implementado, mas com uma pendência registrada na seção 12 |
| 🧭 | Proposta: ainda não existe e será criado quando houver necessidade |

## Sumário

1. [Visão geral do repositório](#1-visão-geral-do-repositório)
2. [Contextos e módulos](#2-contextos-e-módulos)
3. [Estrutura interna de um contexto](#3-estrutura-interna-de-um-contexto)
4. [Responsabilidades das camadas no projeto](#4-responsabilidades-das-camadas-no-projeto)
5. [Onde fica cada elemento](#5-onde-fica-cada-elemento)
6. [Direção das dependências](#6-direção-das-dependências)
7. [Módulos, providers e injeção de dependência no NestJS](#7-módulos-providers-e-injeção-de-dependência-no-nestjs)
8. [Comunicação entre contextos](#8-comunicação-entre-contextos)
9. [Persistência com Prisma e MySQL](#9-persistência-com-prisma-e-mysql)
10. [Testes](#10-testes)
11. [Manutenção e evolução para microsserviços](#11-manutenção-e-evolução-para-microsserviços)
12. [Diagnóstico, situação e pendências](#12-diagnóstico-situação-e-pendências)
13. [Convenções de nomenclatura](#13-convenções-de-nomenclatura)
14. [Guia rápido](#14-guia-rápido)

---

## 1. Visão geral do repositório

```text
.
├── src/
│   ├── main.ts                 bootstrap: ValidationPipe e filtro de erros globais, Swagger, porta
│   ├── app.module.ts           composição raiz: importa os módulos de contexto
│   ├── modules/                um diretório por bounded context
│   ├── shared/                 código transversal, sem regra de nenhum contexto
│   └── generated/prisma/       Prisma Client gerado (ignorado pelo Git; gerado com prisma generate)
├── prisma/
│   ├── schema.prisma           modelos, enums e datasource
│   └── migrations/             histórico de migrations
├── test/
│   ├── architecture/           regras de dependência entre camadas e contextos
│   ├── unit/<contexto>/        testes unitários
│   ├── e2e/                    testes HTTP com supertest
│   └── mocks/                  fakes e mocks reutilizáveis
├── docker/mysql/init.sh        permissões iniciais do usuário do MySQL
├── docker-compose.yml          MySQL 8.4 para desenvolvimento
├── prisma7.config.ts           configuração do Prisma (schema, migrations, URL)
├── build.mjs                   build com tspc (reescreve os aliases @/)
└── docs/arquitetura/           esta documentação
```

| Caminho | Responsabilidade | Observação |
| --- | --- | --- |
| `src/main.ts` | Inicializar a aplicação e configurar recursos globais da borda HTTP | Não contém regra de negócio |
| `src/app.module.ts` | Compor a aplicação a partir dos módulos de contexto | Não contém lógica |
| `src/modules/` | Bounded contexts. É onde nasce toda funcionalidade de negócio | Seções 2 e 3 |
| `src/shared/` | Código transversal, usado por mais de um contexto e sem regra de nenhum | Seção 4.5 |
| `src/generated/prisma/` | Código gerado pelo Prisma | Nunca editar. Só a infraestrutura de persistência o importa |
| `test/` | Testes automatizados, fora de `src/` | Seção 10 |
| `src/app.controller.ts`, `src/app.service.ts` | Scaffold inicial do NestJS (`GET /`) | ⚠️ Não servem de exemplo. Remoção pendente (seção 12) |

---

## 2. Contextos e módulos

Cada bounded context (documento 01, seção 3.4) é um diretório em `src/modules/` com **um único módulo NestJS**, que é a sua raiz de composição e a sua fronteira de encapsulamento.

| Contexto | Pasta | Módulo NestJS | Situação |
| --- | --- | --- | --- |
| Gestão de Cargas | `chemical-shipment/` | `ChemicalShipmentModule` | ✅ Cadastro, consulta, atualização e remoção lógica. Usa Identidade e Acesso apenas pelo contrato publicado `USER_DIRECTORY` |
| Produtos Químicos | 🧭 `chemical-product/` | — | Não iniciado. A carga guarda `productId` como texto livre, sem validação |
| Conformidade Documental | 🧭 `document-compliance/` | — | Não iniciado. A carga guarda `documentsIds` como um texto |
| Inspeções | `inspection/` | `InspectionModule` | ✅ Referencia a carga e o fiscal apenas por ID |
| Identidade e Acesso | `user/` | `UserModule` | ✅ Usuários, sessões, login, logout e guard. Exporta apenas a API pública |

**Nome das pastas.** A pasta tem o nome do conceito central do contexto, em inglês, no singular e em kebab-case. A pasta `user/` abriga todo o contexto de Identidade e Acesso (usuários, sessões e autenticação), e não apenas a entidade usuário.

**Contextos ainda não implementados.** Não se cria pasta, módulo ou camada vazia antecipadamente. O diretório de um contexto nasce com a primeira funcionalidade dele. Por isso Produtos Químicos e Conformidade Documental ainda não têm pasta: as fronteiras deles estão definidas (documento 01, seções 3.4 e 3.5), mas não há código a organizar.

---

## 3. Estrutura interna de um contexto

Estrutura-alvo de um contexto. Cada pasta só existe quando há um arquivo que precisa dela.

```text
src/modules/<contexto>/
├── domain/
│   ├── entities/              entidades e raízes de agregado
│   ├── value-objects/         objetos de valor
│   ├── enums/                 conjuntos finitos e estáveis de valores
│   ├── repositories/          contratos de persistência + tokens
│   ├── services/              serviços de domínio
│   ├── events/                🧭 eventos de domínio, quando houver um consumidor
│   └── errors/                erros específicos do contexto
├── application/
│   ├── use-cases/<agregado>/  um arquivo por ação, com o tipo de entrada no mesmo arquivo
│   ├── dto/                   tipos de entrada ou saída usados por mais de um caso de uso
│   ├── services/              serviços de aplicação que não são uma ação isolada (ex.: implementação de um contrato publicado)
│   └── contracts/             contratos para serviços técnicos + tokens
├── infrastructure/
│   ├── persistence/prisma/    repositórios Prisma e mappers
│   ├── services/              implementações técnicas (hash, token, armazenamento)
│   ├── integrations/          🧭 adaptadores para sistemas externos, ou para traduzir o contrato de outro contexto
│   └── config/                leitura e validação de configuração
├── presentation/
│   ├── controllers/
│   ├── dtos/                  entrada e saída HTTP (class-validator + Swagger)
│   ├── guards/
│   └── decorators/
├── public/                    API pública: o único ponto que outros contextos podem importar
│   ├── index.ts
│   └── *.contract.ts          contratos publicados para outros contextos
└── <contexto>.module.ts       módulo NestJS do contexto
```

**Subpastas por agregado.** Dentro de `application/use-cases/`, os casos de uso são agrupados pelo agregado no plural (`chemical-shipments/`, `inspections/`, `users/`, `auth/`). Não se repete o nome do contexto em subpastas: `entities/chemical-shipment.entity.ts` basta.

**API pública (`public/`).** ✅ Implementada em Identidade e Acesso, o único contexto usado por outro hoje. Os demais contextos criam a pasta quando outro contexto precisar deles. O arquivo `public/index.ts` lista explicitamente tudo o que outros contextos podem usar: o módulo NestJS, os contratos publicados (interfaces, tokens e tipos), guards e decorators destinados a outros contextos. Os contratos publicados ficam fisicamente em `public/`, para que fique claro que alterá-los afeta outros contextos.

Os arquivos **internos** do contexto não importam o próprio `public/index.ts`. Eles importam o arquivo de origem (por exemplo, `public/user-directory.contract.ts`), porque o índice importa o módulo, que importa os arquivos internos, e isso criaria um ciclo de importação.

---

## 4. Responsabilidades das camadas no projeto

O papel conceitual de cada camada está no documento 01, seção 4. Aqui está como ele se aplica no projeto.

### 4.1. Domain

**Contém:** entidades e raízes de agregado, value objects, enums, contratos de repositório, serviços de domínio e erros.

**Padrão das entidades** (✅ seguido em `ChemicalShipment`, `Inspection`, `User` e `Session`):

- estado privado com campos `#`, exposto apenas por getters, sem setters públicos;
- `static create(data)` para criar, validando os dados e aplicando as regras de nascimento;
- `static restore(properties)` para reconstruir a partir da persistência, sem revalidar;
- métodos com nome de intenção de negócio (`changeStatus()`, `complete()`, `block()`), que verificam as regras e lançam `BusinessRuleError`;
- `toObject()` para facilitar o mapeamento na infraestrutura;
- outros agregados, inclusive de outros contextos, são referenciados apenas pelo ID (`ChemicalShipment.responsibleUserId`, `Inspection.cargoId`).

**Bons exemplos no código:**

- `Inspection` (`inspection/domain/entities/inspection.entity.ts`) protege as invariantes de escopo e item, exige o resultado de todas as verificações para concluir e impede alterações depois da conclusão.
- `User` (`user/domain/entities/user.entity.ts`) controla as transições de situação. Um usuário bloqueado não volta a ficar ativo sem um desbloqueio explícito.
- `ChemicalShipment` (`chemical-shipment/domain/entities/chemical-shipment.entity.ts`) impede alterações numa carga aprovada ou reprovada e valida os identificadores obrigatórios.

**Erros de domínio.** A hierarquia genérica está em `shared/domain/errors/domain.error.ts`:

| Erro | Uso | Resposta HTTP |
| --- | --- | --- |
| `BusinessRuleError` | Invariante violada | 422 |
| `ResourceNotFoundError` | Recurso inexistente | 404 |
| `ConflictError` | Conflito com recurso existente | 409 |
| `AuthenticationError` | Credencial ou token inválido | 401 |
| `AccessDeniedError` | Sem permissão para a operação | 403 |

Um erro específico de contexto (em `domain/errors/`) só é criado quando quem chama precisa distingui-lo dos demais. Nesse caso, ele estende uma dessas classes, e o mapeamento HTTP continua funcionando.

**Pode importar:** o próprio domínio, `shared/domain` e APIs da plataforma Node.js, sempre com o prefixo `node:` (por exemplo, `node:crypto`).

**Não pode importar:** `@nestjs/*`, `@/generated/prisma`, as camadas application, infrastructure e presentation, pacotes externos, nem qualquer arquivo de outro contexto.

### 4.2. Application

**Casos de uso.** Uma classe por ação, com um método `execute`. O tipo de entrada fica no mesmo arquivo (por exemplo, `CreateInspectionInput`). Um tipo usado por mais de um caso de uso vai para `application/dto/`. É o caso de `ChemicalShipmentDetails`, a carga junto com o resumo do responsável, devolvida por quatro casos de uso de cargas. A conversão para o formato HTTP é feita pela presentation.

**O que um caso de uso faz:** busca agregados pelos contratos de repositório, aciona os métodos do domínio, salva o resultado e coordena outros contratos. Regras que dependem de dados fora do agregado ficam aqui. Por exemplo, a unicidade do e-mail em `CreateUserUseCase` e `UpdateUserUseCase`, ou a existência do responsável em `CreateChemicalShipmentUseCase`.

**Contratos (`application/contracts/`).** São portas para serviços técnicos, com o token no mesmo arquivo. Exemplos ✅: `PasswordHasher`, `AccessTokenService`, `SessionSettings`, no contexto de Identidade e Acesso.

**Serviços de aplicação (`application/services/`).** Implementam um contrato publicado para outros contextos. Exemplo ✅: `UserDirectoryService`, que implementa `UserDirectory` a partir do repositório de usuários.

**Bons exemplos:** `ValidateSessionUseCase` usa três contratos (token de acesso, sessões e usuários) sem conhecer JWT nem Prisma. `ListChemicalShipmentsUseCase` lista as cargas pelo repositório e obtém os responsáveis da página numa única chamada ao contrato `UserDirectory`.

**Uso permitido do NestJS:** somente `@Injectable()`, `@Inject()` e `Logger` (documento 01, seção 4.7).

**Não pode importar:** infrastructure, presentation, `shared/infrastructure`, `shared/presentation`, `@/generated/prisma`, exceções HTTP do NestJS, pacotes externos, nem arquivos internos de outro contexto. Pode depender dos **contratos publicados** por outro contexto em `public/` (seção 8).

### 4.3. Infrastructure

| Pasta | Conteúdo | Exemplos |
| --- | --- | --- |
| `persistence/prisma/` | Repositórios que implementam os contratos do domínio com o Prisma, e mappers | ✅ `PrismaChemicalShipmentRepository`, `PrismaInspectionRepository`, `PrismaUserRepository`, `PrismaSessionRepository` |
| `services/` | Implementações de contratos técnicos | ✅ `ScryptPasswordHasher`, `JwtAccessTokenService` |
| `config/` | Leitura e validação de configuração, falhando na inicialização se algo estiver inválido | ✅ `user/infrastructure/config/auth.config.ts` |
| `integrations/` | Adaptadores para sistemas externos, ou para traduzir o contrato de outro contexto quando ele não serve como está | 🧭 Nenhum caso hoje |

A infraestrutura não toma decisões de negócio. Por exemplo, um repositório não decide se uma carga pode ser liberada.

### 4.4. Presentation

| Elemento | Responsabilidade | Exemplos |
| --- | --- | --- |
| Controllers | Receber a requisição, chamar **um** caso de uso e converter o resultado em DTO de resposta | ✅ `InspectionsController`, `UsersController`, `ChemicalShipmentController` |
| DTOs de entrada | Validar o formato com class-validator e documentar com Swagger | ✅ `CreateInspectionDto` |
| DTOs de resposta | Escolher explicitamente os campos expostos | ✅ `UserResponseDto` não expõe o hash da senha |
| Guards | Verificar condições de acesso da requisição HTTP | ✅ `user/presentation/guards/auth.guard.ts` |
| Decorators | Extrair dados da requisição ou documentar rotas | ✅ `@CurrentSession()` e `@ApiRequiresAuthentication()`, em `user/presentation/decorators/` |

**Tradução de erros.** O `DomainExceptionFilter` (`shared/presentation/filters/`) é registrado globalmente em `main.ts` e também declarado nos controllers com `@UseFilters`. A declaração nos controllers garante a tradução quando a aplicação é montada sem o `main.ts`, como nos testes `*-no-metadata`. O filtro converte os erros de domínio em respostas HTTP (tabela da seção 4.1). Exceções HTTP do NestJS só são lançadas na presentation.

**Validação.** O `ValidationPipe` global está em `main.ts`. Como o ambiente de desenvolvimento (`tsx`) não emite metadados de tipo, cada parâmetro validado informa o DTO esperado com `validationPipeFor(Dto)` (`shared/presentation/pipes/validation.pipe.ts`) ou com `expectedType`.

### 4.5. `shared/`

```text
src/shared/
├── domain/errors/domain.error.ts             ✅ hierarquia de erros de domínio
├── infrastructure/
│   ├── config/swagger.config.ts              ✅ configuração do Swagger
│   └── persistence/prisma/                   ✅ PrismaModule (não global) e PrismaService
└── presentation/
    ├── filters/domain-exception.filter.ts    ✅
    └── pipes/validation.pipe.ts              ✅ validationPipeFor()
```

Algo só entra em `shared/` quando cumpre **todos** os critérios:

1. é usado por mais de um contexto;
2. não contém regra específica de um contexto;
3. é transversal (erros-base, conexão com o banco, filtros e pipes globais, configuração);
4. não cria acoplamento desnecessário entre contextos.

Uma pergunta ajuda: *se eu remover um contexto, este código ainda faz sentido?* Se a resposta for não, ele pertence ao contexto. Foi por esse critério que `@ApiRequiresAuthentication()`, que documenta o guard de Identidade e Acesso, saiu de `shared/` e foi para o contexto.

Tudo o que está em `shared/` é um contrato entre todos os contextos. Mudá-lo afeta todos. Numa extração futura, esse código é duplicado ou vira uma biblioteca. Por isso `shared/` deve continuar pequeno. `shared/` nunca importa nada de `src/modules/`.

---

## 5. Onde fica cada elemento

| Elemento | Local |
| --- | --- |
| Entidade ou raiz de agregado | `domain/entities/<nome>.entity.ts` |
| Value object | `domain/value-objects/<nome>.vo.ts` |
| Enum de domínio | `domain/enums/<nome>.enum.ts` |
| Erro de domínio genérico | `shared/domain/errors/domain.error.ts` |
| Erro específico do contexto | `domain/errors/<nome>.error.ts` |
| Serviço de domínio | `domain/services/<nome>.service.ts` |
| Contrato de repositório + token | `domain/repositories/<agregado>.repository.ts` |
| Caso de uso + tipo de entrada | `application/use-cases/<agregado>/<ação>.use-case.ts` |
| Tipo compartilhado por casos de uso | `application/dto/<nome>.dto.ts` |
| Contrato de serviço técnico + token | `application/contracts/<nome>.contract.ts` |
| Implementação de contrato publicado | `application/services/<nome>.service.ts` |
| Contrato publicado para outros contextos | `public/<nome>.contract.ts` |
| Lista do que é público | `public/index.ts` |
| Repositório Prisma | `infrastructure/persistence/prisma/prisma-<agregado>.repository.ts` |
| Mapper Prisma ↔ domínio | Método privado `toDomain` no repositório, ou `infrastructure/persistence/prisma/<agregado>.mapper.ts` quando reutilizado |
| Serviço técnico | `infrastructure/services/<nome>.service.ts` |
| Leitura de configuração | `infrastructure/config/<nome>.config.ts` |
| Adaptador de integração | `infrastructure/integrations/<nome>.adapter.ts` |
| Controller | `presentation/controllers/<recurso>.controller.ts` |
| DTO HTTP | `presentation/dtos/<nome>.dto.ts` |
| Guard | `presentation/guards/<nome>.guard.ts` |
| Decorator HTTP | `presentation/decorators/<nome>.decorator.ts` |
| Módulo NestJS do contexto | `<contexto>.module.ts` |
| Teste unitário | `test/unit/<contexto>/` |
| Teste de arquitetura | `test/architecture/` |
| Teste de integração | 🧭 `test/integration/<contexto>/` |
| Teste E2E | `test/e2e/` |
| Mock ou fake reutilizável | `test/mocks/` |

---

## 6. Direção das dependências

```text
                 presentation ─────────► public/ de outro contexto (guard, decorators, representação HTTP publicada)
                      │
                      ▼
                 application ──────────► public/ de outro contexto (somente contratos publicados)
                      │
                      ▼
                    domain ◄──────────── infrastructure (implementa os contratos do domínio e da aplicação)
                      │
                      ▼
                shared/domain
```

**O que cada camada pode importar** (✅ permitido, ❌ proibido):

| De ↓ / Para → | domain | application | infrastructure | presentation | `public/` de outro contexto | Internos de outro contexto | `@nestjs/*` | `@/generated/prisma` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **domain** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **application** | ✅ | ✅ | ❌ | ❌ | ✅ contratos | ❌ | só `Injectable`, `Inject`, `Logger` | ❌ |
| **infrastructure** | ✅ | ✅ contratos | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ só `persistence/` |
| **presentation** | ✅ tipos e enums | ✅ casos de uso | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **`<contexto>.module.ts`** | ✅ tokens | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

Regras complementares:

- `shared/` nunca importa nada de `src/modules/`.
- Somente `infrastructure/persistence/` (dos contextos e de `shared/`) importa `PrismaService` e `@/generated/prisma`.
- Os arquivos internos de um contexto não importam o próprio `public/index.ts` (seção 3).
- As dependências entre contextos não formam ciclos.
- Interfaces são importadas com `import type`. Tokens são importados como valor.

### Verificação automática

✅ As regras acima são verificadas por `test/architecture/layer-boundaries.spec.ts`, executado no `npm test` e, portanto, no CI. O teste lê os imports de todos os arquivos de `src/` (`test/architecture/import-graph.ts`, só com a biblioteca padrão do Node) e falha indicando cada import proibido, no formato `arquivo -> import`.

| Regra verificada | O que falha |
| --- | --- |
| Domínio só depende do próprio domínio, de `shared/domain` e de `node:*` | Import de NestJS, Prisma, outra camada, outro contexto ou pacote externo no domínio |
| Aplicação não depende de infraestrutura, presentation, Prisma ou HTTP | Import dessas camadas, de `shared/infrastructure` ou `shared/presentation`, ou de algo do NestJS além de `Inject`, `Injectable` e `Logger` |
| Presentation não acessa a infraestrutura dos contextos | Controller, DTO, guard ou decorator importando `infrastructure/` |
| Um contexto usa outro só pela API pública | Import de qualquer arquivo de outro contexto que não seja `public/index` |
| Arquivos internos não importam a própria API pública | Import do próprio `public/index` |
| `shared/` não depende de contextos | Import de `src/modules/` em `shared/` |
| Só a persistência acessa o Prisma | Import de `PrismaService` ou `@/generated/prisma` fora de `infrastructure/persistence/` |
| Sem ciclos entre contextos | Contexto A dependendo de B e B dependendo de A |

Se uma regra precisar mudar, a mudança é feita primeiro nesta seção e depois no teste.

---

## 7. Módulos, providers e injeção de dependência no NestJS

Os conceitos de DI e dos módulos do NestJS estão no documento 01, seção 7.

### 7.1. Anatomia de um módulo de contexto

O `InspectionModule` é um bom modelo:

```ts
@Module({
  // Dependências explícitas: só a conexão com o banco
  imports: [PrismaModule],
  controllers: [InspectionsController],
  providers: [
    // Casos de uso: registrados pela própria classe
    CreateInspectionUseCase,
    ListInspectionsUseCase,
    FindInspectionByIdUseCase,
    UpdateInspectionUseCase,
    DeleteInspectionUseCase,
    // Contrato → implementação: o único lugar que conhece o repositório Prisma
    { provide: INSPECTION_REPOSITORY, useClass: PrismaInspectionRepository },
  ],
  // Sem exports: nada deste contexto pode ser injetado por outros módulos
})
export class InspectionModule {}
```

O módulo é a raiz de composição do contexto. Os casos de uso dependem de `INSPECTION_REPOSITORY`, e só o módulo sabe que a implementação é `PrismaInspectionRepository`. Essa é a distinção entre **a direção das dependências no código** (o caso de uso depende do contrato) e **a composição em tempo de execução** (o módulo liga o contrato à implementação).

### 7.2. Contratos e tokens

```ts
// domain/repositories/inspection.repository.ts
export interface InspectionRepository { /* ... */ }
export const INSPECTION_REPOSITORY = Symbol('InspectionRepository');

// Consumidor
import { INSPECTION_REPOSITORY } from '@/modules/inspection/domain/repositories/inspection.repository.js'; // valor: existe em execução
import type { InspectionRepository } from '@/modules/inspection/domain/repositories/inspection.repository.js'; // tipo: apagado na compilação

constructor(
  @Inject(INSPECTION_REPOSITORY)
  private readonly inspections: InspectionRepository,
) {}
```

O token é um `Symbol` exportado no mesmo arquivo da interface. Um `Symbol` é único, o que evita colisões entre tokens, e só pode ser referenciado por quem importa o arquivo que o declara. Combinado com o teste de arquitetura, isso impede que um contexto injete um token interno de outro.

### 7.3. Injeção explícita

**Regra do projeto:** todo parâmetro de construtor injetado tem `@Inject(...)`, inclusive quando a dependência é uma classe (`@Inject(PrismaService)`, `@Inject(ValidateSessionUseCase)`). O motivo é que o `tsx`, usado em desenvolvimento, não emite os metadados `design:paramtypes`. Sem `@Inject`, o NestJS não sabe o que injetar. Os testes `*-no-metadata.e2e-spec.ts` verificam exatamente esse cenário.

### 7.4. Formas de provider usadas

| Forma | Uso no projeto | Exemplo |
| --- | --- | --- |
| Classe | Casos de uso e guards | `CreateInspectionUseCase`, `AuthGuard` |
| `useClass` | Contrato → implementação | `{ provide: USER_DIRECTORY, useClass: UserDirectoryService }` |
| `useFactory` | Valor calculado na inicialização | `{ provide: AUTH_CONFIG, useFactory: () => loadAuthConfig() }` |
| `useFactory` + `inject` | Valor derivado de outro provider | `SESSION_SETTINGS`, calculado a partir de `AUTH_CONFIG` |
| `useValue` | Substituição nos testes | `.overrideProvider(INSPECTION_REPOSITORY).useValue(mock)` |

### 7.5. O que um módulo de contexto pode exportar

| Pode exportar | Não pode exportar |
| --- | --- |
| Tokens de contratos publicados em `public/` | Tokens de repositórios |
| Guards destinados a outros contextos e as dependências que eles exigem (seção 7.7) | Contratos técnicos internos (hash, token de acesso) |
| | Casos de uso usados apenas pelos próprios controllers |

✅ O `UserModule` reúne usuários, sessões e autenticação num único módulo e exporta apenas `USER_DIRECTORY`, `AuthGuard` e `ValidateSessionUseCase`. Os repositórios, o hash de senha e o serviço de tokens são privados. `ChemicalShipmentModule` e `InspectionModule` não exportam nada.

### 7.6. Infraestrutura compartilhada

✅ O `PrismaModule` **não é global**. Cada módulo de contexto com persistência o importa (`imports: [PrismaModule, ...]`), declarando a dependência. A conexão continua centralizada numa única instância, porque o NestJS reaproveita o mesmo módulo em todos os imports.

### 7.7. Raiz da aplicação, dependências entre módulos e guards

- `app.module.ts` importa apenas os módulos de contexto. `main.ts` registra o `ValidationPipe` e o `DomainExceptionFilter` globais e configura o Swagger.
- Quando o módulo de um contexto importa o módulo de outro, essa é uma dependência explícita entre contextos, feita pela API pública: `ChemicalShipmentModule` importa `UserModule` de `@/modules/user/public/index.js`. O grafo de imports deve continuar **acíclico**. Se surgir um ciclo (A precisa de B e B precisa de A), é um sinal de desenho: a responsabilidade está no lugar errado ou a comunicação deveria ser por evento. `forwardRef` não deve ser usado para esconder o ciclo.
- Um guard usado em `@UseGuards(AuthGuard)` é resolvido no módulo do controller que o usa. Por isso o `UserModule` exporta também a dependência do guard, o `ValidateSessionUseCase`.

### 7.8. DI nos testes

- ✅ Os testes E2E importam apenas o módulo do contexto e substituem, pelos tokens, os repositórios ou contratos (`overrideProvider(INSPECTION_REPOSITORY).useValue(mock)`, `overrideProvider(USER_DIRECTORY).useValue(...)`), a configuração (`AUTH_CONFIG`) e o `PrismaService` (`createPrismaServiceStub()`, em `test/mocks/`). Assim, testam a rota HTTP completa e a composição real dos módulos, sem banco de dados.
- ✅ Os testes unitários instanciam os casos de uso diretamente, passando fakes pelo construtor. Os casos de uso de cargas recebem um `UserDirectoryMock` (`test/mocks/user-directory.mock.ts`) e não dependem da implementação de Identidade e Acesso.

---

## 8. Comunicação entre contextos

### 8.1. O que é proibido

Um contexto **nunca**:

- importa entidade, value object, enum interno, repositório, caso de uso, mapper ou DTO de outro contexto, a não ser o que ele publica em `public/`;
- injeta um token interno de outro contexto;
- lê ou altera tabelas de outro contexto, nem navega até elas por relações do Prisma (`include`);
- abre uma transação de banco que envolva tabelas de outro contexto.

### 8.2. Mecanismos permitidos

| Mecanismo | Quando usar | Exemplo |
| --- | --- | --- |
| **Referência por ID** | Sempre que um contexto menciona algo de outro | ✅ `ChemicalShipment.responsibleUserId`, `Inspection.cargoId`, `Inspection.inspectorId` |
| **Identidade da requisição** | Saber quem está chamando e com qual perfil | ✅ `@UseGuards(AuthGuard)` e `@CurrentSession()`, que entrega `{ userId, sessionId, role }` |
| **Contrato publicado** | Obter de outro contexto uma informação necessária agora | ✅ Gestão de Cargas consulta o responsável pela carga com `USER_DIRECTORY` |
| **Cópia de dados** | Guardar a informação de outro contexto como ela era num momento | ✅ `compositionVersion` na inspeção registra qual versão da composição da carga foi avaliada |
| **Evento** | Outro contexto precisa reagir a um fato, e o emissor não precisa da resposta | 🧭 Ainda não há caso real (seção 8.5) |

### 8.3. Contrato publicado: o padrão

O contexto **fornecedor** publica, em `public/`, uma interface com um token e os tipos que ela usa. Ele também implementa a interface e exporta o token pelo seu módulo. O contexto **consumidor** injeta o contrato pelo token e nunca conhece a implementação. O exemplo implementado é a consulta do responsável pela carga:

```ts
// user/public/user-directory.contract.ts — contrato publicado por Identidade e Acesso
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Nunca o hash da senha nem as sessões
}

export interface UserDirectory {
  findById(id: string): Promise<UserSummary | null>;
  findByIds(ids: readonly string[]): Promise<UserSummary[]>;
}

export const USER_DIRECTORY = Symbol('UserDirectory');
```

```ts
// user/user.module.ts — o fornecedor liga o contrato à implementação e o exporta
providers: [{ provide: USER_DIRECTORY, useClass: UserDirectoryService }],
exports: [USER_DIRECTORY, AuthGuard, ValidateSessionUseCase],

// chemical-shipment/chemical-shipment.module.ts — o consumidor importa o módulo pela API pública
imports: [PrismaModule, UserModule],

// chemical-shipment/application/use-cases/... — o consumidor depende só do contrato
constructor(@Inject(USER_DIRECTORY) private readonly users: UserDirectory) {}
```

Os casos de uso de cargas devolvem `ChemicalShipmentDetails` (a carga e o `UserSummary` do responsável). A listagem busca os responsáveis de toda a página numa única chamada a `findByIds`. Na presentation, o `ChemicalShipmentResponseDto` monta o campo `responsibleUser` com o `UserResponseDto`, a representação HTTP de usuário publicada por Identidade e Acesso. Assim o formato da resposta é o mesmo nos dois contextos, sem duplicar o DTO.

Por que essa forma:

- **DIP:** o caso de uso do consumidor depende de uma abstração, e não da implementação do fornecedor (documento 01, seção 6.7).
- **Encapsulamento:** o fornecedor expõe um resumo serializável, nunca a entidade nem o repositório.
- **Testabilidade:** o teste do caso de uso usa um fake do contrato, sem precisar de Identidade e Acesso.
- **Extração futura:** se o fornecedor virar um serviço, o consumidor registra uma implementação remota para o mesmo token (`{ provide: USER_DIRECTORY, useClass: HttpUserDirectory }`) e deixa de importar o módulo. Os casos de uso não mudam. Para isso, os métodos do contrato são assíncronos e trafegam apenas dados serializáveis.

**Quando o consumidor define a própria porta.** Se o contrato publicado não serve ao consumidor como está, porque exige tradução de conceitos, o consumidor define uma porta em `application/contracts/`, na sua linguagem, e um adaptador em `infrastructure/integrations/` que a implementa usando o contrato publicado (documento 01, seção 6.7). Esse adaptador só deve existir se fizer uma tradução real. No caso do responsável pela carga, Gestão de Cargas usa os dados do usuário como estão, então um adaptador só repassaria chamadas e não foi criado.

### 8.4. Identidade e Acesso para os outros contextos

Para exigir autenticação numa rota de outro contexto:

1. o módulo do contexto importa o `UserModule` de `@/modules/user/public/index.js`;
2. o controller usa `@UseGuards(AuthGuard)` e `@ApiRequiresAuthentication()`, também importados da API pública;
3. o método recebe a sessão com `@CurrentSession()` e o tipo `AuthenticatedSession`.

O módulo `ProtectedRouteModule`, em `test/mocks/protected-route.mock.ts`, é um exemplo executável desse uso: ele simula outro contexto usando apenas a API pública.

Hoje o guard é aplicado apenas no logout. A proteção das demais rotas e a autorização por perfil ainda serão implementadas. Quando forem, a divisão de responsabilidades é esta:

- verificações de perfil que valem para a rota inteira ficam na presentation (um guard de perfil publicado por Identidade e Acesso);
- regras que dependem do estado de um agregado, como "só o responsável pela carga pode alterá-la", ficam no domínio do contexto dono do agregado, que recebe o `userId` e o perfil como dados de entrada.

### 8.5. Eventos

🧭 O projeto ainda não tem nenhuma situação em que um contexto precise reagir a um fato de outro. Por isso não há barramento de eventos, e ele não deve ser criado antecipadamente. Quando o primeiro caso real aparecer (provavelmente a conclusão de uma inspeção ou um parecer documental atualizando a situação da carga), as orientações são:

- o evento tem nome no passado (`InspectionCompleted`) e transporta apenas IDs e valores simples;
- o tipo do evento é publicado em `public/` pelo contexto emissor;
- o tratamento fica em `application/event-handlers/` do contexto consumidor e deve ser idempotente;
- comece com um mecanismo em memória, atrás de um contrato. Eventos em memória se perdem se o processo cair logo após a gravação. Se isso não for aceitável, use o padrão *outbox*: grave o evento numa tabela, na mesma transação da alteração, e publique a partir dela.

### 8.6. Fluxo previsto entre os contextos

| Passo do negócio | Contextos | Mecanismo |
| --- | --- | --- |
| Registrar carga com produtos | Gestão de Cargas consulta Produtos Químicos | Contrato publicado (futuro) |
| Indicar o responsável pela carga | Gestão de Cargas consulta Identidade e Acesso | ✅ Contrato publicado `USER_DIRECTORY` |
| Abrir inspeção de uma carga | Inspeções guarda `cargoId` e `compositionVersion` | ✅ Referência por ID e cópia de dados. Validar a carga exigirá um contrato publicado por Gestão de Cargas |
| Registrar resultado ou parecer | Inspeções ou Conformidade Documental → Gestão de Cargas | Evento (preferível, porque não cria dependência de Gestão de Cargas para Inspeções) |
| Decidir a liberação | Gestão de Cargas | Regra no agregado da carga |

Grafo de dependências entre módulos, sem ciclos:

```text
chemical-shipment ──► user                     ✅
chemical-shipment ──► chemical-product         (futuro)
inspection        ──► chemical-shipment        (futuro: validar a carga)
document-compliance ─► chemical-shipment       (futuro)
inspection, document-compliance ··► chemical-shipment   (eventos: sem import de módulo)
```

---

## 9. Persistência com Prisma e MySQL

### 9.1. Estado atual

- ✅ Um único `prisma/schema.prisma`, com `provider = "mysql"`.
- ✅ Client gerado em `src/generated/prisma` (generator `prisma-client`).
- ✅ `PrismaService` estende o `PrismaClient` usando o adaptador `PrismaMariaDb` e a variável `DATABASE_URL`.
- ✅ `PrismaModule` não global, importado pelos módulos de contexto que têm persistência.
- ✅ Um repositório Prisma por agregado, dentro do contexto dono, que lê e grava apenas as tabelas desse contexto.
- ✅ Conversão entre registros e entidades com `toDomain` (privado, no repositório) e `Entity.restore()`.
- ✅ Migrations em `prisma/migrations/` e configuração em `prisma7.config.ts`.
- ✅ MySQL 8.4 pelo `docker-compose.yml`, exposto na porta 3333.

### 9.2. A fronteira do Prisma

- O Prisma só aparece em `infrastructure/persistence/prisma/` de cada contexto e em `shared/infrastructure/persistence/prisma/`. O teste de arquitetura verifica essa regra.
- Os tipos gerados (`@/generated/prisma/models`) não saem do repositório. Os contratos de repositório recebem e devolvem entidades.
- O domínio tem os seus próprios enums. O repositório converte os enums do Prisma para os do domínio.
- A exclusão lógica (`deletedAt`) é implementada no repositório.

### 9.3. Dono de cada tabela

| Modelo Prisma | Contexto dono |
| --- | --- |
| `User`, `Session` | Identidade e Acesso |
| `ChemicalShipment` | Gestão de Cargas |
| `Inspection`, `InspectionItem` | Inspeções |

Só os repositórios do contexto dono leem e alteram a tabela. O `PrismaService` dá acesso técnico a todos os modelos, então essa regra depende de convenção e de revisão de código. O teste de arquitetura garante que só a persistência acessa o Prisma, mas não identifica qual modelo cada repositório usa.

### 9.4. Relações e integridade referencial

- **Dentro de um contexto:** chave estrangeira e cascata quando o filho não existe sem o pai. ✅ `InspectionItem → Inspection` e `Session → User`, ambos com `onDelete: Cascade`.
- **Entre contextos, por padrão:** referência por ID, sem `@relation`, com índice. ✅ `Inspection.cargoId` e `Inspection.inspectorId`.
- **Exceção controlada:** uma chave estrangeira física entre contextos é aceita quando a integridade no banco for um requisito. Ela precisa cumprir quatro condições:
  1. nunca usa cascata (a remoção num contexto não pode apagar dados de outro);
  2. nunca é navegada no código (sem `include` e sem entidade de outro contexto no domínio);
  3. está registrada na tabela abaixo;
  4. é removida se um dos contextos for extraído.

| Chave estrangeira entre contextos | De → Para | Situação |
| --- | --- | --- |
| `ChemicalShipment.responsibleUserId` | Gestão de Cargas → Identidade e Acesso | ✅ Mantida no banco, sem cascata (`ON DELETE RESTRICT` na migration `add_relation_user_chemical_shipment`). Não é mais navegada pelo código: os dados do responsável vêm do contrato `USER_DIRECTORY`. O campo de relação continua no `schema.prisma` porque o Prisma exige os dois lados da relação |

### 9.5. Transações

- O padrão é um caso de uso alterar um agregado, numa única chamada atômica do repositório.
- Uma transação nunca envolve tabelas de dois contextos.
- Quando um caso de uso precisar alterar dois agregados do mesmo contexto de forma atômica, a necessidade deve ser resolvida explicitamente, por exemplo com um contrato de transação na aplicação implementado com `prisma.$transaction`. Hoje não há esse caso. Em `UpdateUserUseCase`, as sessões são encerradas antes de gravar o novo status, numa ordem escolhida para que uma falha não deixe sessões abertas.

### 9.6. Organização do schema

🧭 O Prisma permite dividir o schema em vários arquivos `.prisma` dentro de uma pasta. Um arquivo por contexto (`prisma/schema/user.prisma`, `prisma/schema/inspection.prisma`...) deixaria o dono de cada tabela visível na revisão de código. As migrations continuam únicas, porque o banco é um só. A mudança exige ajustar a configuração do Prisma e validar com `prisma validate` e `prisma migrate dev`.

---

## 10. Testes

### 10.1. Estado atual

- ✅ `test/architecture/` verifica as regras de dependência da seção 6.
- ✅ `test/unit/<contexto>/` cobre entidades e value objects (puros), casos de uso (com fakes dos contratos), repositórios Prisma (com um fake do `PrismaService`, sem banco), serviços de aplicação, guard, configuração e filtro.
- ✅ `test/e2e/` testa as rotas HTTP com supertest. Cada teste importa só o módulo do contexto, que traz as suas dependências reais de módulo, e substitui repositórios, contratos externos e o `PrismaService` pelos tokens, sem banco. As variantes `*-swagger` verificam a documentação, e `*-no-metadata` verificam a execução sem metadados de tipo.
- ✅ `test/mocks/` reúne fakes reutilizáveis, como `UserDirectoryMock` e `createPrismaServiceStub()`.
- ✅ O CI executa, nesta ordem: lint, `prisma generate`, build, testes unitários e de arquitetura, testes E2E e cobertura.
- Nenhum teste fica em `src/`.

### 10.2. O que cada nível testa

| Nível | Alvo | Dependências |
| --- | --- | --- |
| Arquitetura | Regras de dependência da seção 6 | Leitura dos arquivos de `src/` |
| Unitário de domínio | Entidades, value objects, serviços de domínio | Nenhuma |
| Unitário de aplicação | Casos de uso e serviços de aplicação | Fakes dos contratos, pelo construtor |
| Unitário de infraestrutura | Repositórios, serviços técnicos, configuração | Fake do `PrismaService` ou da biblioteca |
| E2E | Rotas HTTP, validação, tradução de erros, composição dos módulos, Swagger | Módulo real com repositórios e contratos externos substituídos |
| 🧭 Integração | Repositórios contra MySQL real | Banco de teste em Docker |

Hoje nenhum teste executa SQL de verdade. O fake do Prisma verifica as chamadas feitas, mas não o resultado das consultas nem as migrations. Os testes de integração preencheriam essa lacuna.

---

## 11. Manutenção e evolução para microsserviços

### 11.1. Onde cada mudança acontece

| Mudança | Onde mexer |
| --- | --- |
| Uma regra de transição de situação | Domínio da entidade |
| Trocar o algoritmo de hash de senha | `infrastructure/services/` e o registro no módulo |
| Um novo endpoint para uma ação existente | Presentation |
| Trocar o ORM ou o banco | `infrastructure/persistence/` de cada contexto. Domínio e aplicação não mudam |
| Um novo dado de usuário exposto a outros contextos | `UserSummary` e `UserDirectoryService` (contrato publicado: avaliar os consumidores) |
| Um novo contexto | Nova pasta em `src/modules/`, módulo próprio e import em `app.module.ts` |

### 11.2. Prontidão de cada contexto para extração

Avaliação segundo as condições do documento 01, seção 5.4:

| Contexto | Importa internos de outro contexto? | Tem internos importados por outro? | Relação de banco entre contextos | Prontidão |
| --- | --- | --- | --- | --- |
| Inspeções | Não | Não | Não | Alta |
| Identidade e Acesso | Não | Não. Outros contextos usam só a API pública | Recebe a chave estrangeira de `ChemicalShipment` (não navegada) | Alta no código. A chave estrangeira precisa ser removida na extração |
| Gestão de Cargas | Não. Usa Identidade e Acesso só pelo contrato `USER_DIRECTORY`, substituível por uma implementação remota | Não | Chave estrangeira para `User` (não navegada) | Média. A extração exige uma implementação remota de `UserDirectory` e a remoção da chave estrangeira |

### 11.3. Passos de uma extração

Quando houver um motivo legítimo (documento 01, seção 5.4):

1. Confirmar que o contexto só é acessado pela API pública, com o teste de arquitetura passando.
2. Remover as chaves estrangeiras entre contextos e mover as tabelas para um banco próprio.
3. Expor os contratos publicados por HTTP ou mensageria no novo serviço.
4. Nos consumidores, registrar uma implementação remota para o mesmo token, com timeout, novas tentativas e tratamento de indisponibilidade.
5. Trocar os eventos em memória por um broker, com outbox e consumidores idempotentes.
6. Criar pipeline, imagem e observabilidade próprios.

O que **não** muda: o domínio e os casos de uso do contexto extraído e dos consumidores. Esse é o ganho da arquitetura, se as condições forem mantidas.

---

## 12. Diagnóstico, situação e pendências

### 12.1. Inconsistências corrigidas

Inconsistências encontradas na análise do código e corrigidas na refatoração arquitetural:

| # | Inconsistência | Correção |
| --- | --- | --- |
| A1 | Casos de uso de cargas injetavam o repositório de usuários de outro contexto | ✅ Dependem do contrato publicado `UserDirectory` (seção 8.3) |
| A2 | A entidade `ChemicalShipment` continha a entidade `User`, e o repositório de cargas reconstruía o usuário com o hash da senha | ✅ A carga guarda só `responsibleUserId`. O resumo do responsável vem do contrato |
| A3 | O módulo de usuários exportava repositórios e o hash de senha para qualquer módulo que o importasse | ✅ Um módulo por contexto, que exporta só a API pública (seção 7.5) |
| A4 | Relação do Prisma navegada entre contextos (`include: { responsibleUser: true }`) | ✅ Navegação removida. A chave física continua como exceção registrada (seção 9.4) |
| A5 | `BadRequestException` na camada de aplicação | ✅ A validação dos identificadores foi para a entidade, com `BusinessRuleError`. O formato continua validado pelo DTO |
| A6 | DTO de cargas importava um DTO interno de Identidade e Acesso | ✅ `UserResponseDto` é publicado na API pública e construído a partir de um `UserSummary` |
| M1 | Entidade `ChemicalShipment` anêmica: setters públicos e métodos que recebiam a própria instância | ✅ Estado privado e métodos de intenção, com as mesmas regras |
| M2 | Guard e decorator em `infrastructure/auth/`; `@ApiRequiresAuthentication()` em `shared/` | ✅ Movidos para `user/presentation/` e publicados pela API pública |
| M3 | `PrismaModule` global | ✅ Importado explicitamente pelos módulos de contexto (seção 7.6) |
| M4 | Nenhuma verificação automática das fronteiras | ✅ Teste de arquitetura (seção 6) |
| B1 | Estrutura de pastas de cargas diferente da dos outros contextos | ✅ `entities/`, `enums/` e `use-cases/chemical-shipments/` |
| B2 | Arquivos vazios: um contrato duplicado e um arquivo de tipos de cargas em `shared/` | ✅ Removidos |
| B3 | Dois módulos NestJS no mesmo contexto | ✅ `AuthModule` incorporado ao `UserModule` |
| B4 | Extensões de import mistas (`.ts` e `.js`) | ✅ `.js` em todo `src/` |

A refatoração não alterou rotas, payloads nem o schema do banco. Há uma diferença de resposta: `POST /chemical-shipment` passou a devolver os dados do responsável em `responsibleUser`, como já faziam a consulta, a listagem e a atualização. Antes o campo vinha nulo nessa rota.

### 12.2. Pendências

| # | Pendência | Onde | Por que não foi resolvida na refatoração |
| --- | --- | --- | --- |
| P1 | ⚠️ `PATCH /chemical-shipment/:id` não valida o corpo como os demais endpoints. Ele não informa o DTO esperado (`expectedType`), e o campo `status` de `UpdateChemicalShipmentDto` não tem decorators do class-validator. Com o `tsx` o corpo não é validado. No build com metadados, o `ValidationPipe` global rejeitaria o campo `status` (`forbidNonWhitelisted`) | `chemical-shipment.controller.ts`, `update-chemical-shipment.dto.ts` | Problema preexistente de comportamento. Corrigir muda a resposta da rota e merece uma tarefa própria, com teste E2E da atualização de status |
| P2 | ⚠️ A carga aceita qualquer transição de status, desde que não esteja aprovada ou reprovada. O README descreve uma máquina de estados | `chemical-shipment.entity.ts` | Definir as transições permitidas é uma decisão de negócio, não uma refatoração |
| P3 | ⚠️ `ChemicalShipmentController` repete, em cada endpoint, um `try/catch` que registra o erro e converte erros inesperados em 500 com mensagem própria. Os casos de uso e o repositório também registram o mesmo erro | `chemical-shipment.controller.ts` | Remover muda a mensagem das respostas 500. Recomenda-se centralizar o tratamento de erros inesperados num único filtro ou interceptor |
| P4 | ⚠️ Remover um usuário que é responsável por cargas viola a chave estrangeira no banco e resulta em erro 500, sem uma regra de domínio que explique o motivo | `DeleteUserUseCase` | Decidir se usuários com histórico são removidos ou apenas inativados é uma regra de negócio |
| P5 | ⚠️ Linguagem ubíqua: a carga é `ChemicalShipment` em Gestão de Cargas e `cargo` em Inspeções | Vários arquivos | Unificar exige alterar contratos públicos (seção 13.2) |
| P6 | Os documentos da carga são um texto (`documentsIds`) dentro de Gestão de Cargas | `ChemicalShipment` | Pertencem a Conformidade Documental, que ainda não foi implementada. Mudar o campo altera payloads e o schema |
| P7 | Nenhum teste executa SQL real | `test/` | Exige infraestrutura de teste com MySQL em Docker (seção 10.2) |
| P8 | Schema Prisma num único arquivo | `prisma/schema.prisma` | Mudança de configuração do Prisma que deve ser validada com o banco (seção 9.6) |
| P9 | Scaffold do NestJS na raiz (`GET /`) | `app.controller.ts`, `app.service.ts` | Remover elimina uma rota e os testes que a cobrem. Tarefa própria |

---

## 13. Convenções de nomenclatura

### 13.1. Regras gerais

| Elemento | Convenção | Exemplo |
| --- | --- | --- |
| Diretórios e arquivos | kebab-case, em inglês | `use-cases/`, `create-inspection.use-case.ts` |
| Classes, interfaces e tipos | PascalCase | `CreateInspectionUseCase`, `InspectionRepository` |
| Métodos e variáveis | camelCase | `findById`, `cargoId` |
| Tokens de injeção | UPPER_SNAKE_CASE, `Symbol` com o nome do contrato | `INSPECTION_REPOSITORY = Symbol('InspectionRepository')` |
| Casos de uso | `<verbo>-<substantivo>.use-case.ts`, classe `<Verbo><Substantivo>UseCase` | `validate-session.use-case.ts` |
| Implementação Prisma | `prisma-<agregado>.repository.ts`, classe `Prisma<Agregado>Repository` | `PrismaUserRepository` |
| Especificador de import | Extensão `.js` e alias `@/` | `@/modules/user/domain/entities/user.entity.js` |
| Mensagens ao usuário | Português brasileiro | `'Apenas uma inspeção pendente pode ser iniciada.'` |

Sufixos:

```text
.entity.ts       entidade de domínio
.vo.ts           value object
.enum.ts         enum de domínio
.error.ts        erro de domínio específico
.repository.ts   contrato ou implementação de repositório
.contract.ts     contrato (porta) que não é repositório, interno ou publicado
.use-case.ts     caso de uso
.service.ts      serviço de domínio, de aplicação ou técnico
.dto.ts          tipo de entrada ou saída (HTTP ou de casos de uso)
.mapper.ts       conversor entre formatos
.adapter.ts      adaptador de integração
.config.ts       leitura de configuração
.controller.ts   controller HTTP
.guard.ts        guard HTTP
.decorator.ts    decorator
.filter.ts       filtro de exceção
.pipe.ts         pipe
.module.ts       módulo NestJS
.spec.ts         teste unitário ou de arquitetura
.e2e-spec.ts     teste E2E
.mock.ts         fake ou mock de teste
```

Evite nomes genéricos como `carga.service.ts`, `utils.ts` ou `helpers.ts`. Um caso de uso representa uma ação. Quando a ação tem significado no negócio, o nome deve dizê-lo: `release-shipment` comunica mais do que um `update-shipment` com o campo `status`.

### 13.2. Linguagem ubíqua: glossário

| Termo do negócio | Nome no código | Contexto |
| --- | --- | --- |
| Carga química | `ChemicalShipment` (Gestão de Cargas); `cargo` em referências de Inspeções | Gestão de Cargas |
| Situação da carga | `StatusShipment` | Gestão de Cargas |
| Responsável pela carga | `responsibleUserId` | Gestão de Cargas |
| Composição da carga e sua versão | `compositionVersion` | Inspeções |
| Item da carga | `cargoItemId` | Inspeções |
| Inspeção | `Inspection` | Inspeções |
| Verificação prevista | `InspectionRequirement` | Inspeções |
| Item de inspeção | `InspectionItem` | Inspeções |
| Conforme / não conforme | `InspectionItemResult.COMPLIANT` / `NON_COMPLIANT` | Inspeções |
| Fiscal | `inspectorId` | Inspeções |
| Usuário | `User`; para outros contextos, `UserSummary` | Identidade e Acesso |
| Perfil de acesso | `UserRole` | Identidade e Acesso |
| Situação do usuário | `UserStatus` | Identidade e Acesso |
| Sessão | `Session` | Identidade e Acesso |
| Produto químico | 🧭 `ChemicalProduct` | Produtos Químicos |
| Documento da carga | 🧭 `ShipmentDocument` | Conformidade Documental |

⚠️ **Decisão pendente.** O mesmo conceito, a carga, tem dois nomes no código: `ChemicalShipment` e `cargo`. Unificar exige escolher um termo e alterar contratos públicos: a rota `/chemical-shipment`, o campo `cargoId` no payload de inspeções ou o nome do modelo no banco. Por isso a decisão deve ser tomada pelo time, junto de uma estratégia de compatibilidade da API, e não como parte de uma refatoração estrutural.

---

## 14. Guia rápido

### 14.1. Onde criar um arquivo

```text
É regra de negócio de um objeto?                 → domain/entities ou domain/value-objects
É regra de negócio que envolve vários objetos?   → domain/services
É contrato de persistência?                      → domain/repositories
É uma ação pedida por usuário ou sistema?        → application/use-cases/<agregado>
É contrato para um serviço técnico?              → application/contracts
É algo que outro contexto precisa usar?          → public/ (contrato) + application/services (implementação)
Usa o Prisma?                                    → infrastructure/persistence/prisma
É implementação técnica de um contrato?          → infrastructure/services
Lê variáveis de ambiente?                        → infrastructure/config
Fala com um sistema externo?                     → infrastructure/integrations
Só existe por causa do HTTP?                     → presentation/
É usado por vários contextos e não tem regra?    → avaliar shared/ (critérios da seção 4.5)
```

### 14.2. Fluxo de uma nova funcionalidade

Exemplo: liberar uma carga.

1. **Identificar o contexto:** Gestão de Cargas.
2. **Definir a regra com o negócio:** em que situações uma carga pode ser liberada?
3. **Domínio:** método de intenção na entidade (`release()`), que verifica a regra e lança `BusinessRuleError`. Testes unitários da entidade.
4. **Aplicação:** `release-shipment.use-case.ts`, que busca a carga, chama `release()` e salva. Testes com o repositório falso.
5. **Persistência:** só se o contrato do repositório precisar de um método novo.
6. **Presentation:** rota, DTO (se houver corpo) e documentação Swagger. Teste E2E.
7. **Outros contextos:** se a liberação depender de informação de outro contexto, usar um contrato publicado por ele (seção 8.3).

Nem toda funcionalidade passa por todas as etapas.

### 14.3. Checklist antes de criar um arquivo

```text
[ ] Sei a qual contexto ele pertence?
[ ] Sei em qual camada ele fica?
[ ] Ele tem uma única responsabilidade?
[ ] O nome segue as convenções da seção 13?
[ ] Os imports respeitam a tabela da seção 6?
[ ] Estou usando outro contexto apenas pela API pública dele?
[ ] Existe um arquivo que já faz isso e deveria ser reutilizado?
[ ] A abstração que estou criando resolve um problema concreto?
```

### 14.4. Checklist antes de abrir um Pull Request

```text
[ ] Nenhuma regra de negócio em controller, DTO, mapper ou repositório?
[ ] Nenhuma relação do Prisma navegada entre contextos?
[ ] O módulo exporta apenas a API pública?
[ ] Os contratos novos têm token e são injetados com @Inject?
[ ] Os casos de uso têm testes com dependências substituídas?
[ ] Lint, build, testes unitários, de arquitetura e E2E passaram?
```

As regras de import (NestJS e Prisma fora do domínio, nenhuma exceção HTTP na aplicação, nenhum import interno de outro contexto) não estão na lista porque o teste de arquitetura as verifica.

### 14.5. Evite complexidade prematura

- serviço genérico para todo comportamento (`XService` com tudo dentro);
- value object para todo campo, mesmo sem regra;
- interface sem uma fronteira real ou com uma única implementação que nunca será trocada;
- adaptador que só repassa chamadas;
- mapper que só copia propriedades sem necessidade;
- código em `shared/` antes de ser usado por dois contextos;
- pastas, módulos ou camadas vazias para "completar" a estrutura;
- barramento de eventos antes do primeiro evento real.
