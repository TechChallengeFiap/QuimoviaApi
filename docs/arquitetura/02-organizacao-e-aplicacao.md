# Arquitetura do Quimovia — Organização e aplicação no projeto

Este é o segundo de dois documentos sobre a arquitetura do Quimovia.

| Documento | Pergunta que responde |
| --- | --- |
| [01 — Fundamentos e decisões](./01-fundamentos-e-decisoes.md) | O que é a arquitetura adotada, que problemas ela resolve e por que foi escolhida? |
| **02 — Organização e aplicação no projeto** (este) | Como esses conceitos viram pastas, módulos, providers e regras de código no repositório? |

Este documento é prático. Ele não repete as explicações do documento 01: quando um conceito aparece aqui, a referência indica onde ele é explicado.

O código é a fonte de verdade sobre **o que existe**. Este documento é a fonte de verdade sobre **o que deve existir**. Quando os dois divergem, a divergência está marcada e registrada na [seção 12](#12-diagnóstico-e-plano-de-refatoração).

| Marcador | Significado |
| --- | --- |
| ✅ | Implementado e de acordo com a arquitetura |
| ⚠️ | Implementado, mas em desacordo com a arquitetura. Há uma proposta de correção |
| 🧭 | Proposta: ainda não existe e é a organização-alvo para as próximas refatorações |

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
12. [Diagnóstico e plano de refatoração](#12-diagnóstico-e-plano-de-refatoração)
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
| `src/app.controller.ts`, `src/app.service.ts` | Scaffold inicial do NestJS (`GET /`) | ⚠️ Não servem de exemplo. Remover em tarefa própria, junto dos testes que os cobrem |

---

## 2. Contextos e módulos

Cada bounded context (documento 01, seção 3.4) é um diretório em `src/modules/` com **um único módulo NestJS**, que é a sua raiz de composição e a sua fronteira de encapsulamento.

| Contexto | Pasta | Módulo NestJS | Situação |
| --- | --- | --- | --- |
| Gestão de Cargas | `chemical-shipment/` | `ChemicalShipmentModule` | ⚠️ Implementado (cadastro, consulta, atualização e remoção lógica), com acoplamentos a Identidade e Acesso |
| Produtos Químicos | 🧭 `chemical-product/` | — | Não iniciado. Hoje a carga guarda `productId` como texto livre, sem validação |
| Conformidade Documental | 🧭 `document-compliance/` | — | Não iniciado. Hoje a carga guarda `documentsIds` como um texto |
| Inspeções | `inspection/` | `InspectionModule` | ✅ Implementado. Referencia a carga e o fiscal apenas por ID |
| Identidade e Acesso | `user/` | ⚠️ `UserModule` e `AuthModule` | Implementado: usuários, sessões, login, logout e guard. Dividido em dois módulos que expõem providers internos |

**Nome das pastas.** A pasta tem o nome do conceito central do contexto, em inglês, no singular e em kebab-case. A pasta `user/` abriga todo o contexto de Identidade e Acesso (usuários, sessões e autenticação), e não apenas a entidade usuário.

**Contextos ainda não implementados.** Não se cria pasta, módulo ou camada vazia antecipadamente. O diretório de um contexto nasce com a primeira funcionalidade dele.

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
│   ├── use-cases/<agregado>/  um arquivo por ação, com os tipos de entrada e saída no mesmo arquivo
│   ├── services/              serviços de aplicação que não são uma ação isolada (ex.: implementação de um contrato público)
│   └── contracts/             contratos para serviços técnicos + tokens
├── infrastructure/
│   ├── persistence/prisma/    repositórios Prisma e mappers
│   ├── services/              implementações técnicas (hash, token, armazenamento)
│   ├── integrations/          adaptadores para sistemas externos ou para traduzir outro contexto
│   └── config/                leitura e validação de configuração
├── presentation/
│   ├── controllers/
│   ├── dtos/                  entrada e saída HTTP (class-validator + Swagger)
│   ├── guards/
│   └── decorators/
├── public/                    🧭 API pública: o único ponto que outros contextos podem importar
│   ├── index.ts
│   └── *.contract.ts          contratos publicados para outros contextos
└── <contexto>.module.ts       módulo NestJS do contexto
```

**Subpastas por agregado.** Dentro de `application/use-cases/`, os casos de uso são agrupados pelo agregado no plural (`inspections/`, `users/`, `auth/`). Não se repete o nome do contexto em subpastas: `entities/chemical-shipment/chemical-shipment.entity.ts` é redundante, `entities/chemical-shipment.entity.ts` basta.

**API pública (`public/`).** É o contrato do contexto com o resto do sistema. O arquivo `public/index.ts` lista explicitamente tudo o que outros contextos podem usar: o módulo NestJS, os contratos publicados (interfaces, tokens e tipos), guards e decorators destinados a outros contextos. Os contratos publicados ficam fisicamente em `public/`, para que fique claro que alterá-los afeta outros contextos. Detalhes na seção 8.

---

## 4. Responsabilidades das camadas no projeto

O papel conceitual de cada camada está no documento 01, seção 4. Aqui está como ele se aplica no projeto.

### 4.1. Domain

**Contém:** entidades e raízes de agregado, value objects, enums, contratos de repositório, serviços de domínio e erros.

**Padrão das entidades** (✅ seguido em `Inspection`, `User` e `Session`):

- estado privado com campos `#`, exposto apenas por getters;
- `static create(data)` para criar, validando os dados e aplicando as regras de nascimento;
- `static restore(properties)` para reconstruir a partir da persistência, sem revalidar;
- métodos com nome de intenção de negócio (`start()`, `complete()`, `block()`, `unblock()`), que verificam as regras e lançam `BusinessRuleError`;
- `toObject()` para facilitar o mapeamento na infraestrutura.

**Bons exemplos no código:**

- `Inspection` (`inspection/domain/entities/inspection.entity.ts`) protege as invariantes de escopo e item, exige o resultado de todas as verificações para concluir e impede alterações depois da conclusão.
- `User` (`user/domain/entities/user.entity.ts`) controla as transições de situação. Um usuário bloqueado não volta a ficar ativo sem um desbloqueio explícito.

**Erros de domínio.** A hierarquia genérica está em `shared/domain/errors/domain.error.ts`:

| Erro | Uso | Resposta HTTP |
| --- | --- | --- |
| `BusinessRuleError` | Invariante violada | 422 |
| `ResourceNotFoundError` | Recurso inexistente | 404 |
| `ConflictError` | Conflito com recurso existente | 409 |
| `AuthenticationError` | Credencial ou token inválido | 401 |
| `AccessDeniedError` | Sem permissão para a operação | 403 |

Um erro específico de contexto (em `domain/errors/`) só é criado quando quem chama precisa distingui-lo dos demais. Nesse caso, ele estende uma dessas classes, e o mapeamento HTTP continua funcionando.

**Pode importar:** o próprio domínio, `shared/domain` e APIs da plataforma Node.js (por exemplo, `randomUUID`).

**Não pode importar:** `@nestjs/*`, `@/generated/prisma`, as camadas application, infrastructure e presentation, nem qualquer arquivo de outro contexto.

### 4.2. Application

**Casos de uso.** Uma classe por ação, com um método `execute`. O tipo de entrada fica no mesmo arquivo (por exemplo, `CreateInspectionInput`). Só se extrai para `application/dto/` um tipo usado por mais de um caso de uso. O caso de uso devolve entidades ou dados simples. A conversão para o formato HTTP é feita pela presentation.

**O que um caso de uso faz:** busca agregados pelos contratos de repositório, aciona os métodos do domínio, salva o resultado e coordena outros contratos. Regras que dependem de dados fora do agregado ficam aqui. Por exemplo, a unicidade do e-mail em `CreateUserUseCase` e `UpdateUserUseCase`.

**Contratos (`application/contracts/`).** São portas para serviços técnicos, com o token no mesmo arquivo. Exemplos ✅: `PasswordHasher`, `AccessTokenService`, `SessionSettings`, no contexto de Identidade e Acesso.

**Bom exemplo:** `ValidateSessionUseCase` usa três contratos (token de acesso, sessões e usuários) sem conhecer JWT nem Prisma.

**Uso permitido do NestJS:** somente `@Injectable()`, `@Inject()` e `Logger` (documento 01, seção 4.7).

**Não pode importar:** infrastructure, presentation, `@/generated/prisma`, `PrismaService`, exceções HTTP do NestJS, nem arquivos internos de outro contexto. Pode depender de **contratos publicados** por outro contexto em `public/` (seção 8).

### 4.3. Infrastructure

| Pasta | Conteúdo | Exemplos |
| --- | --- | --- |
| `persistence/prisma/` | Repositórios que implementam os contratos do domínio com o Prisma, e mappers | ✅ `PrismaInspectionRepository`, `PrismaUserRepository`, `PrismaSessionRepository` |
| `services/` | Implementações de contratos técnicos | ✅ `ScryptPasswordHasher`, `JwtAccessTokenService` |
| `config/` | Leitura e validação de configuração, falhando na inicialização se algo estiver inválido | ⚠️ `auth.config.ts`, hoje em `infrastructure/auth/` |
| `integrations/` | Adaptadores para sistemas externos, ou para traduzir o contrato de outro contexto quando ele não serve como está | 🧭 |

A infraestrutura não toma decisões de negócio. Por exemplo, um repositório não decide se uma carga pode ser liberada.

### 4.4. Presentation

| Elemento | Responsabilidade | Exemplos |
| --- | --- | --- |
| Controllers | Receber a requisição, chamar **um** caso de uso e converter o resultado em DTO de resposta | ✅ `InspectionsController`, `UsersController` |
| DTOs de entrada | Validar o formato com class-validator e documentar com Swagger | ✅ `CreateInspectionDto` |
| DTOs de resposta | Escolher explicitamente os campos expostos (`fromEntity`) | ✅ `UserResponseDto` não expõe o hash da senha |
| Guards | Verificar condições de acesso da requisição HTTP | ⚠️ `AuthGuard`, hoje em `user/infrastructure/auth/` |
| Decorators | Extrair dados da requisição ou documentar rotas | ⚠️ `@CurrentSession()`, hoje em `user/infrastructure/auth/`. ⚠️ `@ApiRequiresAuthentication()`, hoje em `shared/`, embora documente o guard de Identidade e Acesso |

**Tradução de erros.** O `DomainExceptionFilter` (`shared/presentation/filters/`) é registrado globalmente em `main.ts` e converte os erros de domínio em respostas HTTP (tabela da seção 4.1). Exceções HTTP do NestJS só são lançadas na presentation.

**Validação.** O `ValidationPipe` global está em `main.ts`. Como o ambiente de desenvolvimento (`tsx`) não emite metadados de tipo, cada parâmetro validado informa o DTO esperado com `validationPipeFor(Dto)` (`shared/presentation/pipes/validation.pipe.ts`) ou com `expectedType`.

### 4.5. `shared/`

```text
src/shared/
├── domain/errors/domain.error.ts             ✅ hierarquia de erros de domínio
├── infrastructure/
│   ├── config/swagger.config.ts              ✅ configuração do Swagger
│   └── persistence/prisma/                   ✅ PrismaService; ⚠️ PrismaModule marcado como @Global()
├── presentation/
│   ├── decorators/api-requires-authentication.decorator.ts  ⚠️ pertence a Identidade e Acesso
│   ├── filters/domain-exception.filter.ts    ✅
│   └── pipes/validation.pipe.ts              ✅ validationPipeFor()
└── types/chemical-shipment.types.ts          ⚠️ arquivo vazio e específico de um contexto
```

Algo só entra em `shared/` quando cumpre **todos** os critérios:

1. é usado por mais de um contexto;
2. não contém regra específica de um contexto;
3. é transversal (erros-base, conexão com o banco, filtros e pipes globais, configuração);
4. não cria acoplamento desnecessário entre contextos.

Uma pergunta ajuda: *se eu remover um contexto, este código ainda faz sentido?* Se a resposta for não, ele pertence ao contexto.

Tudo o que está em `shared/` é um contrato entre todos os contextos. Mudá-lo afeta todos. Numa extração futura, esse código é duplicado ou vira uma biblioteca. Por isso `shared/` deve continuar pequeno.

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
| Caso de uso + tipos de entrada | `application/use-cases/<agregado>/<ação>.use-case.ts` |
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
| Teste de arquitetura | 🧭 `test/architecture/` |
| Teste de integração | 🧭 `test/integration/<contexto>/` |
| Teste E2E | `test/e2e/` |
| Mock ou fake reutilizável | `test/mocks/` |

---

## 6. Direção das dependências

```text
                 presentation
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
- Interfaces são importadas com `import type`. Tokens são importados como valor.

### Verificação automática

🧭 As regras acima devem ser verificadas por um teste de arquitetura em `test/architecture/`, executado no `npm test` e, portanto, no CI. O teste lê os arquivos de `src/` e valida os imports de cada um. Sem essa verificação, nada impede um import proibido: o TypeScript e o NestJS não conhecem as fronteiras dos contextos.

---

## 7. Módulos, providers e injeção de dependência no NestJS

Os conceitos de DI e dos módulos do NestJS estão no documento 01, seção 7.

### 7.1. Anatomia de um módulo de contexto

O `InspectionModule` é um bom modelo:

```ts
@Module({
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

O token é um `Symbol` exportado no mesmo arquivo da interface. Um `Symbol` é único, o que evita colisões entre tokens, e só pode ser referenciado por quem importa o arquivo que o declara.

### 7.3. Injeção explícita

**Regra do projeto:** todo parâmetro de construtor injetado tem `@Inject(...)`, inclusive quando a dependência é uma classe (`@Inject(PrismaService)`, `@Inject(ValidateSessionUseCase)`). O motivo é que o `tsx`, usado em desenvolvimento, não emite os metadados `design:paramtypes`. Sem `@Inject`, o NestJS não sabe o que injetar. Os testes `*-no-metadata.e2e-spec.ts` verificam exatamente esse cenário.

### 7.4. Formas de provider usadas

| Forma | Uso no projeto | Exemplo |
| --- | --- | --- |
| Classe | Casos de uso e guards | `CreateInspectionUseCase`, `AuthGuard` |
| `useClass` | Contrato → implementação | `{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }` |
| `useFactory` | Valor calculado na inicialização | `{ provide: AUTH_CONFIG, useFactory: () => loadAuthConfig() }` |
| `useFactory` + `inject` | Valor derivado de outro provider | `SESSION_SETTINGS`, calculado a partir de `AUTH_CONFIG` |
| `useValue` | Substituição nos testes | `.overrideProvider(INSPECTION_REPOSITORY).useValue(mock)` |

### 7.5. O que um módulo de contexto pode exportar

| Pode exportar | Não pode exportar |
| --- | --- |
| Tokens de contratos publicados em `public/` | Tokens de repositórios |
| Guards destinados a outros contextos e as dependências que eles exigem (seção 7.7) | Contratos técnicos internos (hash, token de acesso) |
| | Casos de uso usados apenas pelos próprios controllers |

⚠️ **Estado atual:** o `UserModule` exporta `USER_REPOSITORY`, `SESSION_REPOSITORY` e `PASSWORD_HASHER`. Ele faz isso para atender o `AuthModule`, do mesmo contexto, mas a exportação vale para qualquer módulo que o importe. O `ChemicalShipmentModule` o importa e usa `USER_REPOSITORY` diretamente.

🧭 **Proposta:** um único módulo para Identidade e Acesso (`UserModule`, absorvendo o `AuthModule`). Os providers internos deixam de ser exportados, e o módulo exporta apenas a sua API pública.

### 7.6. Infraestrutura compartilhada

⚠️ **Estado atual:** o `PrismaModule` é `@Global()`. Qualquer módulo pode injetar `PrismaService` sem declarar essa dependência.

🧭 **Proposta:** o `PrismaModule` deixa de ser global e é importado explicitamente pelos módulos de contexto que têm persistência. A conexão continua centralizada numa única instância (o NestJS reaproveita o mesmo módulo em todos os imports), e cada módulo passa a declarar do que depende.

### 7.7. Raiz da aplicação, dependências entre módulos e guards

- `app.module.ts` importa os módulos de contexto. `main.ts` registra o `ValidationPipe` e o `DomainExceptionFilter` globais e configura o Swagger.
- Quando o módulo de um contexto importa o módulo de outro, essa é uma dependência explícita entre contextos. O grafo de imports deve continuar **acíclico**. Se surgir um ciclo (A precisa de B e B precisa de A), é um sinal de desenho: a responsabilidade está no lugar errado ou a comunicação deveria ser por evento. `forwardRef` não deve ser usado para esconder o ciclo.
- Um guard usado em `@UseGuards(AuthGuard)` é resolvido no módulo do controller que o usa. Por isso o módulo que fornece o guard exporta também as dependências dele: hoje, `AuthGuard` e `ValidateSessionUseCase`.

### 7.8. DI nos testes

✅ Os testes E2E importam apenas o módulo do contexto e substituem os repositórios pelos tokens (`overrideProvider(INSPECTION_REPOSITORY).useValue(mock)`). Assim, testam a rota HTTP completa sem banco de dados. Os testes unitários instanciam os casos de uso diretamente, passando mocks de `test/mocks/` pelo construtor.

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
| **Referência por ID** | Sempre que um contexto menciona algo de outro | ✅ `Inspection.cargoId` e `Inspection.inspectorId` |
| **Identidade da requisição** | Saber quem está chamando e com qual perfil | ✅ `@UseGuards(AuthGuard)` e `@CurrentSession()`, que entrega `{ userId, sessionId, role }` |
| **Contrato publicado** | Obter de outro contexto uma informação necessária agora | 🧭 Gestão de Cargas consultando o responsável pela carga em Identidade e Acesso |
| **Cópia de dados** | Guardar a informação de outro contexto como ela era num momento | ✅ `compositionVersion` na inspeção registra qual versão da composição da carga foi avaliada |
| **Evento** | Outro contexto precisa reagir a um fato, e o emissor não precisa da resposta | 🧭 Ainda não há caso real (seção 8.5) |

### 8.3. Contrato publicado: o padrão

O contexto **fornecedor** publica, em `public/`, uma interface com um token e os tipos que ela usa. Ele também implementa a interface e exporta o token pelo seu módulo. O contexto **consumidor** injeta o contrato pelo token e nunca conhece a implementação.

```ts
// user/public/user-directory.contract.ts — contrato publicado por Identidade e Acesso
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  /* ... somente dados que podem sair do contexto. Nunca o hash da senha */
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
exports: [USER_DIRECTORY],

// chemical-shipment/chemical-shipment.module.ts — o consumidor importa o módulo
imports: [UserModule],

// chemical-shipment/application/use-cases/... — o consumidor depende só do contrato
constructor(@Inject(USER_DIRECTORY) private readonly users: UserDirectory) {}
```

Por que essa forma:

- **DIP:** o caso de uso do consumidor depende de uma abstração, e não da implementação do fornecedor (documento 01, seção 6.7).
- **Encapsulamento:** o fornecedor expõe um resumo serializável, nunca a entidade nem o repositório.
- **Testabilidade:** o teste do caso de uso usa um fake do contrato, sem precisar de Identidade e Acesso.
- **Extração futura:** se o fornecedor virar um serviço, o consumidor registra uma implementação remota para o mesmo token (`{ provide: USER_DIRECTORY, useClass: HttpUserDirectory }`) e deixa de importar o módulo. Os casos de uso não mudam. Para isso, os métodos do contrato devem ser assíncronos e trafegar apenas dados serializáveis.

**Quando o consumidor define a própria porta.** Se o contrato publicado não serve ao consumidor como está, porque exige tradução de conceitos, o consumidor define uma porta em `application/contracts/`, na sua linguagem, e um adaptador em `infrastructure/integrations/` que a implementa usando o contrato publicado (documento 01, seção 6.7). Esse adaptador só deve existir se fizer uma tradução real. Um adaptador que apenas repassa chamadas é uma indireção sem benefício.

### 8.4. Identidade e Acesso para os outros contextos

Para exigir autenticação numa rota de outro contexto:

1. o módulo do contexto importa o `UserModule`;
2. o controller usa `@UseGuards(AuthGuard)` e `@ApiRequiresAuthentication()`;
3. o método recebe a sessão com `@CurrentSession()` e o tipo `AuthenticatedSession`.

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
| Registrar carga com produtos | Gestão de Cargas consulta Produtos Químicos | Contrato publicado |
| Indicar o responsável pela carga | Gestão de Cargas consulta Identidade e Acesso | Contrato publicado |
| Abrir inspeção de uma carga | Inspeções guarda `cargoId` e `compositionVersion` | Referência por ID e cópia de dados (✅ atual). Validar a carga exigirá um contrato publicado por Gestão de Cargas |
| Registrar resultado ou parecer | Inspeções ou Conformidade Documental → Gestão de Cargas | Evento (preferível, porque não cria dependência de Gestão de Cargas para Inspeções) |
| Decidir a liberação | Gestão de Cargas | Regra no agregado da carga |

Grafo de dependências entre módulos esperado, sem ciclos:

```text
chemical-shipment ──► user
chemical-shipment ──► chemical-product     (futuro)
inspection        ──► chemical-shipment    (futuro: validar a carga)
document-compliance ─► chemical-shipment   (futuro)
inspection, document-compliance ··► chemical-shipment   (eventos: sem import de módulo)
```

---

## 9. Persistência com Prisma e MySQL

### 9.1. Estado atual

- ✅ Um único `prisma/schema.prisma`, com `provider = "mysql"`.
- ✅ Client gerado em `src/generated/prisma` (generator `prisma-client`).
- ✅ `PrismaService` estende o `PrismaClient` usando o adaptador `PrismaMariaDb` e a variável `DATABASE_URL`.
- ✅ Um repositório Prisma por agregado, dentro do contexto dono.
- ✅ Conversão entre registros e entidades com `toDomain` (privado, no repositório) e `Entity.restore()`.
- ✅ Migrations em `prisma/migrations/` e configuração em `prisma7.config.ts`.
- ✅ MySQL 8.4 pelo `docker-compose.yml`, exposto na porta 3333.

### 9.2. A fronteira do Prisma

- O Prisma só aparece em `infrastructure/persistence/prisma/` de cada contexto e em `shared/infrastructure/persistence/prisma/`.
- Os tipos gerados (`@/generated/prisma/models`) não saem do repositório. Os contratos de repositório recebem e devolvem entidades.
- O domínio tem os seus próprios enums. O repositório converte os enums do Prisma para os do domínio.
- A exclusão lógica (`deletedAt`) é implementada no repositório.

### 9.3. Dono de cada tabela

| Modelo Prisma | Contexto dono |
| --- | --- |
| `User`, `Session` | Identidade e Acesso |
| `ChemicalShipment` | Gestão de Cargas |
| `Inspection`, `InspectionItem` | Inspeções |

Só os repositórios do contexto dono leem e alteram a tabela. O `PrismaService` dá acesso técnico a todos os modelos, então essa regra depende de convenção, de revisão e do teste de arquitetura.

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
| `ChemicalShipment.responsibleUserId` | Gestão de Cargas → Identidade e Acesso | ⚠️ Existe e é navegada no código (`include: { responsibleUser: true }` e reconstrução de `User` no repositório de cargas). 🧭 Manter apenas a chave física, sem navegação. O schema não precisa mudar |

### 9.5. Transações

- O padrão é um caso de uso alterar um agregado, numa única chamada atômica do repositório.
- Uma transação nunca envolve tabelas de dois contextos.
- Quando um caso de uso precisar alterar dois agregados do mesmo contexto de forma atômica, a necessidade deve ser resolvida explicitamente, por exemplo com um contrato de transação na aplicação implementado com `prisma.$transaction`. Hoje não há esse caso. Em `UpdateUserUseCase`, as sessões são encerradas antes de gravar o novo status, numa ordem escolhida para que uma falha não deixe sessões abertas.

### 9.6. Organização do schema

🧭 O Prisma permite dividir o schema em vários arquivos `.prisma` dentro de uma pasta. Um arquivo por contexto (`prisma/schema/user.prisma`, `prisma/schema/inspection.prisma`...) deixaria o dono de cada tabela visível na revisão de código. As migrations continuam únicas, porque o banco é um só. A mudança exige ajustar a configuração do Prisma e validar com `prisma validate` e `prisma migrate dev`.

---

## 10. Testes

### 10.1. Estado atual

- ✅ `test/unit/<contexto>/` cobre entidades e value objects (puros), casos de uso (com mocks), repositórios Prisma (com um fake do `PrismaService`, sem banco), guard, configuração e filtro.
- ✅ `test/e2e/` testa as rotas HTTP com supertest. Cada teste importa só o módulo do contexto e substitui os repositórios pelos tokens, sem banco. As variantes `*-swagger` verificam a documentação, e `*-no-metadata` verificam a execução sem metadados de tipo.
- ✅ `test/mocks/` reúne fakes reutilizáveis.
- ✅ O CI executa, nesta ordem: lint, `prisma generate`, build, testes unitários, testes E2E e cobertura.
- Nenhum teste fica em `src/`.

### 10.2. O que cada nível testa

| Nível | Alvo | Dependências |
| --- | --- | --- |
| Unitário de domínio | Entidades, value objects, serviços de domínio | Nenhuma |
| Unitário de aplicação | Casos de uso | Mocks dos contratos, pelo construtor |
| Unitário de infraestrutura | Repositórios, serviços técnicos, configuração | Fake do `PrismaService` ou da biblioteca |
| E2E | Rotas HTTP, validação, tradução de erros, Swagger | Módulo real com os repositórios substituídos |
| 🧭 Arquitetura | Regras de dependência da seção 6 | Leitura dos arquivos de `src/` |
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
| Um novo contexto | Nova pasta em `src/modules/`, módulo próprio e import em `app.module.ts` |

### 11.2. Prontidão de cada contexto para extração

Avaliação do estado atual, segundo as condições do documento 01, seção 5.4:

| Contexto | Importa internos de outro contexto? | Tem internos importados por outro? | Relação de banco navegada entre contextos? | Prontidão |
| --- | --- | --- | --- | --- |
| Inspeções | Não | Não | Não | Alta |
| Identidade e Acesso | Não | Sim: Gestão de Cargas usa o repositório, a entidade, os enums e o DTO de usuário | Sim, a partir de `ChemicalShipment` | Média |
| Gestão de Cargas | Sim, de Identidade e Acesso | Não | Sim | Baixa |

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

## 12. Diagnóstico e plano de refatoração

Inconsistências encontradas na análise do código, ordenadas por prioridade.

| # | Inconsistência | Onde | Impacto | Proposta |
| --- | --- | --- | --- | --- |
| A1 | Casos de uso de cargas injetam o repositório de usuários de outro contexto | `create-` e `update-chemical-shipment.use-case.ts` | Gestão de Cargas depende dos internos de Identidade e Acesso. A extração exigiria reescrita | Contrato publicado `UserDirectory` (seção 8.3) |
| A2 | A entidade `ChemicalShipment` contém a entidade `User` | `chemical-shipment.entity.ts` | Um agregado atravessa a fronteira de contexto. O repositório de cargas reconstrói `User`, incluindo o hash da senha | A carga guarda só `responsibleUserId`. O caso de uso obtém o resumo do responsável pelo contrato |
| A3 | O módulo de usuários exporta providers internos | `user.module.ts` | Qualquer módulo que o importe pode ler e alterar usuários e sessões | Um módulo por contexto, que exporta só a API pública (seção 7.5) |
| A4 | Relação do Prisma navegada entre contextos | `prisma-chemical-shipment.repository.ts` (`include: { responsibleUser: true }`) | Acoplamento de dados entre contextos | Remover a navegação. Manter a chave física como exceção registrada (seção 9.4) |
| A5 | Exceção HTTP na camada de aplicação | `create-chemical-shipment.use-case.ts` (`BadRequestException`) | O caso de uso pressupõe HTTP | Formato validado no DTO. Regra validada na entidade com `BusinessRuleError` |
| A6 | Representação HTTP de outro contexto importada diretamente | `chemical-shipment-response.dto.ts` importa `UserResponseDto` | Presentation acoplada a um arquivo interno de outro contexto | Publicar a representação do usuário na API pública de Identidade e Acesso |
| M1 | Entidade `ChemicalShipment` anêmica: setters públicos para todos os campos e métodos que recebem a própria instância como parâmetro | `chemical-shipment.entity.ts` | Qualquer código altera o estado sem passar pelas regras | Remover os setters e usar métodos de intenção que aplicam as regras existentes |
| M2 | Componentes de Identidade e Acesso fora do lugar | `AuthGuard` e `@CurrentSession()` em `infrastructure/auth/`; `@ApiRequiresAuthentication()` em `shared/` | Presentation misturada com infraestrutura. Código de um contexto em `shared/` | Mover para `user/presentation/` e publicar pela API pública |
| M3 | `PrismaModule` global | `shared/infrastructure/persistence/prisma/prisma.module.ts` | Dependências de persistência ficam implícitas | Importar explicitamente nos módulos de contexto (seção 7.6) |
| M4 | Nenhuma verificação automática das fronteiras | — | Violações passam despercebidas | Teste de arquitetura (seção 6) |
| M5 | Linguagem ubíqua inconsistente: a carga é `ChemicalShipment` em Gestão de Cargas, `cargoId` em Inspeções e "Carga Química" na API | Vários arquivos | Leitores supõem conceitos diferentes | Decisão de domínio pendente (seção 13.2) |
| M6 | Nenhum teste executa SQL real | `test/` | Consultas e migrations não são verificadas | Testes de integração com MySQL em Docker |
| B1 | Estrutura de pastas diferente para responsabilidades equivalentes | `chemical-shipment/`: `entities/chemical-shipment/`, `value-objects/chemical-shipment/status-shipment.vo.ts` (um enum), `use-cases/chemical-shipment/` | Convenção diferente da dos outros contextos | `entities/`, `enums/` e `use-cases/chemical-shipments/` |
| B2 | Arquivos vazios | `chemical-shipment/application/contracts/.../chemical-shipment-repository.contract.ts` e `shared/types/chemical-shipment.types.ts` | Sugerem abstrações inexistentes | Remover |
| B3 | Dois módulos NestJS no mesmo contexto | `user.module.ts` e `auth.module.ts` | Exige exportar providers internos entre eles (A3) | Unificar no `UserModule` |
| B4 | Extensões de import mistas (`.ts` e `.js`) | `chemical-shipment/`, `main.ts`, `app.module.ts`, `prisma.*` | Inconsistência de estilo | Padronizar em `.js` |
| B5 | Schema Prisma num único arquivo | `prisma/schema.prisma` | O dono de cada tabela não é visível | Um arquivo por contexto (seção 9.6) |
| B6 | Scaffold do NestJS na raiz | `app.controller.ts`, `app.service.ts` | Rota `GET /` sem função de negócio | Remover em tarefa própria |

**Ordem sugerida:**

1. Desacoplar Gestão de Cargas de Identidade e Acesso (A1 a A4, A6, B3), porque é o maior risco arquitetural.
2. Retirar HTTP da aplicação e enriquecer a entidade de cargas (A5, M1, B1, B2).
3. Corrigir a localização dos componentes de Identidade e Acesso e o módulo do Prisma (M2, M3).
4. Proteger as fronteiras com o teste de arquitetura (M4).
5. Itens que dependem de decisão do time ou de infraestrutura de teste: M5, M6, B5 e B6.

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
.contract.ts     contrato (porta) que não é repositório
.use-case.ts     caso de uso
.service.ts      serviço de domínio, de aplicação ou técnico
.mapper.ts       conversor entre formatos
.adapter.ts      adaptador de integração
.config.ts       leitura de configuração
.controller.ts   controller HTTP
.dto.ts          objeto de entrada ou saída HTTP
.guard.ts        guard HTTP
.decorator.ts    decorator
.filter.ts       filtro de exceção
.pipe.ts         pipe
.module.ts       módulo NestJS
.spec.ts         teste unitário
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
| Usuário | `User` | Identidade e Acesso |
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
[ ] Nenhum import de NestJS, Prisma ou HTTP no domínio?
[ ] Nenhuma exceção HTTP na camada de aplicação?
[ ] Nenhum import de arquivo interno de outro contexto?
[ ] Nenhuma relação do Prisma navegada entre contextos?
[ ] O módulo exporta apenas a API pública?
[ ] Os contratos novos têm token e são injetados com @Inject?
[ ] Os casos de uso têm testes com dependências substituídas?
[ ] Lint, build, testes unitários e E2E passaram?
```

### 14.5. Evite complexidade prematura

- serviço genérico para todo comportamento (`XService` com tudo dentro);
- value object para todo campo, mesmo sem regra;
- interface sem uma fronteira real ou com uma única implementação que nunca será trocada;
- adaptador que só repassa chamadas;
- mapper que só copia propriedades sem necessidade;
- código em `shared/` antes de ser usado por dois contextos;
- pastas, módulos ou camadas vazias para "completar" a estrutura;
- barramento de eventos antes do primeiro evento real.
