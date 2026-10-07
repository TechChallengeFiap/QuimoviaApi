# Arquitetura e organização do projeto Quimovia

Este documento é a referência única para entender a estrutura do projeto Quimovia e decidir onde criar novos arquivos.

Ele existe para responder rapidamente:

```text
Onde este código deve ficar?
Como este arquivo deve ser nomeado?
Qual é a responsabilidade desta pasta?
Do que este arquivo pode depender?
O que esta camada não deve fazer?
```

## Índice

- [Objetivo e estado atual](#1-objetivo)
- [Estrutura do projeto](#3-visão-geral-da-estrutura)
- [Camadas dos módulos](#6-domain)
- [Shared, bootstrap e testes](#10-shared)
- [Regras de dependência e comunicação](#13-regras-de-dependência)
- [Como criar novos arquivos](#16-preciso-criar-um-novo-arquivo-onde-ele-fica)
- [Boas práticas e checklists](#18-evite-complexidade-prematura)

## 1. Objetivo

O Quimovia usa uma arquitetura de Monólito Modular com DDD, Clean Architecture, NestJS, TypeScript e Prisma.

Na prática, isso significa:

- o sistema é uma única aplicação;
- o código é organizado por módulos de negócio;
- cada módulo protege suas próprias regras;
- detalhes técnicos ficam fora do domínio;
- novas funcionalidades devem nascer dentro de `src/modules/<modulo>/`;
- `shared/` deve ser pequeno e usado com cuidado.

Este documento não é um texto acadêmico sobre DDD. Ele é um manual de uso da estrutura do projeto.

## 2. Estado atual do projeto

O estado real do repositório é a fonte de verdade.

Hoje o projeto possui:

- aplicação NestJS com `src/main.ts` e `src/app.module.ts`;
- Swagger configurado em `src/main.ts`, a partir de `src/shared/infrastructure/config/swagger.config.ts`;
- cinco módulos principais em `src/modules/`;
- estrutura interna de pastas criada dentro dos módulos;
- Prisma schema em `prisma/schema.prisma`;
- Prisma Client gerado em `src/generated/prisma`;
- infraestrutura Prisma global em `src/shared/infrastructure/persistence/prisma`;
- testes unitários em `test/unit`;
- testes E2E em `test/e2e`;
- README ainda baseado no starter do NestJS, com seção de CI/CD.

### Arquivos ainda na raiz de `src/`

Existem arquivos como:

```text
src/main.ts
src/app.module.ts
src/app.controller.ts
src/app.service.ts
```

`main.ts` e `app.module.ts` devem continuar na raiz porque são bootstrap e composição da aplicação.

`app.controller.ts` e `app.service.ts` são scaffold inicial do NestJS. Eles não devem servir de exemplo para novas funcionalidades de negócio. Quando os módulos reais substituírem o endpoint de exemplo, esses arquivos podem ser removidos ou adaptados em uma tarefa própria.

### Organização atual dos testes

Os testes unitários estão em:

```text
test/unit/
├── app.controller.spec.ts
└── app.service.spec.ts
```

Os testes E2E ficam em:

```text
test/e2e/
```

Os testes não devem ficar junto ao código de produção em `src/`.

### Observação sobre Prisma em `shared`

A estrutura possui:

```text
src/shared/infrastructure/persistence/prisma/
src/shared/infrastructure/database/prisma/
```

O código existente usa:

```text
src/shared/infrastructure/persistence/prisma/
```

Portanto, preserve esse caminho enquanto ele for o caminho real importado pela aplicação. Se o time decidir padronizar para `database/prisma`, faça isso em uma tarefa específica, ajustando imports, testes e documentação.

## 3. Visão geral da estrutura

```text
src/
├── generated/
│   └── prisma/
├── modules/
│   ├── gestao-de-cargas/
│   ├── produtos-quimicos/
│   ├── conformidade-documental/
│   ├── inspection/
│   └── user/
├── shared/
├── app.module.ts
└── main.ts

test/
├── unit/
├── integration/
└── e2e/
```

### `src/modules/`

Contém os bounded contexts do Quimovia. Esta é a principal unidade de organização do projeto.

Comece por aqui quando for desenvolver uma funcionalidade de negócio.

### `src/shared/`

Contém código realmente transversal. Não é uma pasta para colocar tudo o que parece reutilizável.

### `src/generated/`

Contém código gerado pelo Prisma. Não edite manualmente.

### `src/main.ts`

Inicializa a aplicação NestJS e configura recursos globais, como Swagger.

### `src/app.module.ts`

Composição raiz da aplicação. Deve importar módulos reais quando eles forem implementados.

### `test/`

Contém os testes automatizados da aplicação, separados por nível de teste.

## 4. Módulos do domínio

### `gestao-de-cargas`

Responsável pelo ciclo de vida das cargas químicas.

Pode conter futuramente:

- `CargaQuimica`;
- itens da carga;
- composição da carga;
- status da carga;
- parecer técnico;
- autorização de movimentação;
- histórico da carga.

Aggregate Root principal previsto: `CargaQuimica`.

### `produtos-quimicos`

Responsável pelo catálogo de produtos químicos.

Pode conter futuramente:

- `ProdutoQuimico`;
- número ONU;
- classe de risco;
- grupo de compatibilidade;
- requisitos do produto;
- situação ativa ou inativa.

Aggregate Root principal previsto: `ProdutoQuimico`.

### `conformidade-documental`

Responsável por documentação e conformidade.

Pode conter futuramente:

- `DocumentoCarga`;
- tipos de documento;
- validade;
- exigências documentais;
- parecer de conformidade.

Aggregate Root principal previsto: `DocumentacaoCarga` ou o nome definido pela linguagem do domínio durante a implementação.

### `inspection`

Responsável pelo processo de inspeção.

Pode conter futuramente:

- `Inspecao`;
- escopo;
- evidências;
- resultado;
- laudo;
- status da inspeção.

Aggregate Root principal previsto: `Inspecao`.

### `user`

Responsável por identidade, autenticação e autorização.

Hoje contém:

- `Usuario` e o seu cadastro (`UserModule`);
- `Sessao` (`Session`), com repositório próprio;
- login, logout e o guard global que exige uma sessão ativa nas rotas (`AuthModule`, importado só pelo `AppModule`, porque o guard vale para a aplicação inteira).

Pode conter futuramente:

- `Perfil`;
- permissões;
- autorização por perfil e permissão.

Aggregate Roots principais previstos: `Usuario` e `Perfil`.

## 5. Estrutura interna de um módulo

Cada módulo segue esta estrutura:

```text
src/modules/<modulo>/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── enums/
│   ├── repositories/
│   ├── services/
│   └── errors/
├── application/
│   ├── use-cases/
│   ├── dto/
│   └── contracts/
├── infrastructure/
│   ├── persistence/
│   │   └── prisma/
│   ├── services/
│   └── integrations/
├── presentation/
│   ├── controllers/
│   └── dtos/
└── ...
```

O módulo `user` também possui:

```text
src/modules/user/infrastructure/auth/
```

## 6. Domain

`domain/` é o núcleo do negócio.

Use quando o código representa regra que continuaria existindo mesmo se NestJS, HTTP, Prisma ou banco fossem trocados.

Não use para:

- Prisma;
- DTO HTTP;
- controllers;
- decorators do NestJS;
- SQL;
- JWT;
- integração externa.

### `domain/entities/`

**Finalidade**

Entidades representam conceitos com identidade e ciclo de vida.

**Quando criar**

Crie uma entity quando o conceito:

- tem identidade própria;
- possui comportamento de domínio;
- protege invariantes;
- participa de um aggregate.

**Quando não criar**

Não crie entity só para espelhar tabela do banco ou payload HTTP.

**Nomenclatura**

```text
carga-quimica.entity.ts
produto-quimico.entity.ts
inspecao.entity.ts
```

**Pode depender de**

Value objects, enums, errors e services de domínio do mesmo módulo.

**Não deve depender de**

Prisma, DTOs, controllers, NestJS ou banco.

### `domain/value-objects/`

**Finalidade**

Representar valores com significado e validação próprios.

**Quando criar**

Crie quando o valor precisa encapsular regra, validação ou normalização.

**Quando não criar**

Não transforme todo atributo em Value Object. Se não existe regra ou significado relevante, um tipo simples pode bastar.

**Nomenclatura**

```text
quantidade.vo.ts
classe-risco.vo.ts
numero-onu.vo.ts
email.vo.ts
```

### `domain/enums/`

**Finalidade**

Representar listas finitas e estáveis do domínio.

**Quando criar**

Use para status, resultados ou tipos com conjunto conhecido.

**Quando não criar**

Evite enum se os valores são configuráveis, mudam com frequência ou exigem comportamento próprio.

**Nomenclatura**

```text
status-carga.enum.ts
status-produto.enum.ts
resultado-inspecao.enum.ts
```

### `domain/repositories/`

**Finalidade**

Guardar contratos de persistência.

O domínio define o que precisa. A infraestrutura define como fazer.

**Onde fica o contrato**

```text
src/modules/<modulo>/domain/repositories/produto-quimico.repository.ts
```

**Onde fica a implementação Prisma**

```text
src/modules/<modulo>/infrastructure/persistence/prisma/prisma-produto-quimico.repository.ts
```

**Não deve fazer**

O contrato não deve importar Prisma, SQL ou modelos gerados.

### `domain/services/`

**Finalidade**

Guardar regra de domínio que não pertence naturalmente a uma entity ou value object.

**Quando criar**

Crie somente quando:

- a regra é de domínio;
- não pertence claramente a uma entity;
- tem nome e significado no negócio.

**Quando não criar**

Não crie `ProdutoService`, `CargaService` ou `UsuarioService` para agrupar funções aleatórias.

**Nomenclatura**

```text
compatibilidade-produtos-domain.service.ts
politica-liberacao-carga-domain.service.ts
```

### `domain/errors/`

**Finalidade**

Representar violações de regra de negócio.

**Quando criar**

Crie quando uma regra do domínio for violada.

**Não deve fazer**

Não misture status HTTP dentro de erro de domínio.

**Nomenclatura**

```text
transicao-status-invalida.error.ts
carga-bloqueada.error.ts
produto-inativo.error.ts
```

## 7. Application

`application/` coordena casos de uso.

Não é camada para regra técnica e não deve conhecer HTTP.

### `application/use-cases/`

**Finalidade**

Representar ações claras da aplicação.

Um Use Case representa uma ação, não uma entidade.

**Quando criar**

Crie para operações como:

- registrar carga;
- liberar carga;
- cancelar carga;
- cadastrar produto;
- inativar produto;
- registrar inspeção.

**Quando não criar**

Evite nomes genéricos:

```text
carga.use-case.ts
produto.use-case.ts
sistema.use-case.ts
```

**Nomenclatura**

```text
registrar-carga.use-case.ts
liberar-carga.use-case.ts
cancelar-carga.use-case.ts
cadastrar-produto.use-case.ts
```

**Pode depender de**

Domain, contratos de repository e contracts de aplicação.

**Não deve depender de**

Controllers, Express, Prisma direto ou implementação concreta de repository.

### `application/dto/`

**Finalidade**

Representar entrada ou saída de casos de uso, sem vínculo obrigatório com HTTP.

**Quando criar**

Crie quando o Use Case precisa de um formato próprio de entrada ou saída.

**Quando não criar**

Não use como entity e não misture com DTO HTTP.

**Nomenclatura**

```text
registrar-carga-input.dto.ts
registrar-carga-output.dto.ts
```

### `application/contracts/`

**Finalidade**

Guardar contratos necessários para a aplicação, especialmente portas para integrações técnicas.

**Quando criar**

Crie quando houver consumidor real.

**Quando não criar**

Não crie interface apenas por hábito.

**Nomenclatura**

```text
notificador-documental.contract.ts
consulta-produto-quimico.contract.ts
```

## 8. Infrastructure

`infrastructure/` contém detalhes tecnológicos.

Pode conhecer Prisma, SDKs, banco, hashing, JWT e integrações externas.

Não deve concentrar regra de negócio.

### `infrastructure/persistence/prisma/`

**Finalidade**

Implementar persistência com Prisma.

**Quando criar**

Use para:

- repositories Prisma;
- mappers Prisma;
- componentes específicos de banco, como o seed do administrador inicial (`seed/initial-admin.seed.ts`, executado por `prisma/seed.ts`).

**Nomenclatura**

```text
prisma-produto-quimico.repository.ts
produto-quimico.mapper.ts
```

**Não deve fazer**

Não coloque regra de negócio aqui. Regras pertencem ao domínio ou ao caso de uso.

### Mappers

**Finalidade**

Converter dados entre formatos técnicos e objetos da aplicação/domínio.

**Quando criar**

Crie quando a conversão entre Prisma e domínio começar a se repetir ou poluir o repository.

**Não deve fazer**

Mapper não valida regra de negócio e não decide fluxo.

### `infrastructure/services/`

**Finalidade**

Serviços técnicos.

**Exemplos**

```text
password-hasher.service.ts
jwt.service.ts
file-storage.service.ts
```

Não coloque regra de domínio nesses services.

### `infrastructure/integrations/`

**Finalidade**

Isolar comunicação com sistemas externos.

Use para clients, gateways e adapters externos.

### `infrastructure/auth/`

Existe em:

```text
src/modules/user/infrastructure/auth/
```

Use para guards, strategies e adapters técnicos de autenticação.

Hoje contém o `AuthGuard` (guard global), a leitura da configuração (`JWT_SECRET` e `JWT_EXPIRES_IN_SECONDS`) e o decorator `@CurrentSession()`, que entrega ao controller a sessão validada.

Regras de usuário, perfil e permissão pertencem ao domínio ou aplicação de `user`.

Para liberar uma rota do login, use `@Public()` (`src/shared/presentation/decorators/`). Nas rotas protegidas, `@ApiRequiresAuthentication()` documenta a resposta 401 no Swagger.

## 9. Presentation

`presentation/` é a borda HTTP.

### `presentation/controllers/`

**Finalidade**

Receber requisições, chamar Use Cases e devolver respostas.

Fluxo esperado:

```text
Request
  -> Controller
  -> Use Case
  -> Domain
  -> Repository
```

Evite:

```text
Controller
  -> Prisma
  -> if gigante
  -> regra de negócio
```

**Nomenclatura**

```text
cargas-quimicas.controller.ts
produtos-quimicos.controller.ts
```

### `presentation/dtos/`

**Finalidade**

Representar entrada e saída HTTP.

**Quando criar**

Use para body, query params e responses específicas.

**Não deve fazer**

DTO não é entity e não contém regra de negócio.

**Nomenclatura**

```text
criar-produto.dto.ts
atualizar-produto.dto.ts
criar-carga.dto.ts
atualizar-status-carga.dto.ts
```

## 10. Shared

`shared/` deve ser pequeno.

Só coloque algo em `shared` quando:

1. for usado por mais de um módulo;
2. não possuir regra específica de um domínio;
3. for transversal;
4. não criar acoplamento desnecessário.

Estrutura atual:

```text
src/shared/
├── domain/
├── application/
│   └── pagination/
├── infrastructure/
│   ├── config/
│   ├── database/
│   │   └── prisma/
│   ├── logging/
│   └── persistence/
│       └── prisma/
└── presentation/
    ├── decorators/
    ├── filters/
    ├── interceptors/
    └── pipes/
```

### Pode entrar em `shared`

- paginação genérica;
- filtros globais;
- pipes globais;
- logger transversal;
- config global;
- Prisma global;
- erro base sem regra específica;
- decorators transversais, como `@Public()`.

### Não deve entrar em `shared`

- `CargaQuimica`;
- `ProdutoQuimico`;
- `Inspecao`;
- `DocumentoCarga`;
- regra de liberação de carga;
- repository específico de produto;
- mapper de um módulo específico.

Pergunta útil:

```text
Se eu remover um módulo específico, este código ainda faz sentido?
```

Se a resposta for não, provavelmente ele pertence ao módulo.

## 11. Bootstrap da aplicação

### `src/main.ts`

Responsável por inicializar a aplicação NestJS.

Pode conter:

- criação da aplicação;
- configuração global;
- Swagger;
- porta de execução.

Não deve conter regra de negócio.

### `src/app.module.ts`

Responsável por compor a aplicação.

Pode importar módulos NestJS reais quando forem implementados.

Não deve conter lógica de negócio.

### `app.controller.ts` e `app.service.ts`

São scaffold inicial. Não crie novas funcionalidades copiando esse padrão na raiz de `src/`.

Novos controllers e services devem nascer dentro dos módulos.

## 12. Testes

Os testes ficam fora de `src/`, dentro da pasta `test/`.

### Testes de domínio e aplicação

Os testes unitários ficam em:

```text
test/unit/
```

Use para validar componentes isoladamente, sem depender de banco de dados ou serviços externos reais.

Os testes unitários podem validar:

- entidades;
- value objects;
- domain services;
- erros de domínio;
- use cases;
- funções ou serviços isolados.

Quando necessário, utilize mocks, stubs ou fakes para isolar dependências.

Exemplos:

```text
test/unit/app.controller.spec.ts
test/unit/app.service.spec.ts
test/unit/carga-quimica.spec.ts
```

A localização do teste não precisa reproduzir a árvore completa de `src/`. O objetivo é separar o código de produção dos testes unitários.

### Testes de integração

Onde:

```text
test/integration/
```

Use quando for necessário validar a interação entre componentes reais da aplicação.

Exemplos:

- Use Case + Repository;
- Repository + Prisma;
- aplicação + banco de dados;
- integração com um serviço externo controlado.

Esses testes podem depender de infraestrutura real ou controlada.

### Testes E2E

Onde:

```text
test/e2e/
```

Use para validar o fluxo completo da aplicação através da interface HTTP.

Exemplo:

```text
HTTP Request
  ↓
Controller
  ↓
Use Case
  ↓
Domain
  ↓
Repository
  ↓
Database
```

Exemplos:

```text
test/e2e/
├── produtos-quimicos.e2e-spec.ts
├── cargas-quimicas.e2e-spec.ts
└── autenticacao.e2e-spec.ts
```

### Regra geral

Não coloque novos testes em `src/`.

O código de produção deve ficar em:

```text
src/
```

e os testes em:

```text
test/
```

Isso mantém uma separação clara entre código executado pela aplicação e código utilizado para validação automatizada.

## 13. Regras de dependência

Direção principal:

```text
Presentation
  -> Application
  -> Domain
```

Infraestrutura implementa contratos:

```text
Infrastructure
  -> Domain/Application contracts
```

### Permitido

`presentation` pode importar Use Cases e DTOs de presentation.

`application` pode importar domain e contracts.

`domain` pode importar apenas elementos do próprio domínio e tipos simples.

`infrastructure` pode importar contracts, Prisma, SDKs externos e shared técnico.

### Evite

- domain importando Prisma;
- domain importando NestJS;
- domain importando DTO;
- controller importando repository Prisma;
- use case importando controller;
- módulo importando infraestrutura interna de outro módulo;
- shared importando regra específica de módulo.

## 14. Comunicação entre módulos

Módulos podem se relacionar, mas não devem acessar detalhes internos uns dos outros.

Exemplo:

```text
Gestão de Cargas
  -> Produtos Químicos
```

Gestão de Cargas pode precisar saber se um produto químico existe ou está ativo. Isso não significa importar diretamente a entity, mapper ou repository Prisma de Produtos Químicos.

Prefira:

- identificadores;
- contracts;
- Use Cases expostos;
- serviços de aplicação;
- eventos quando fizer sentido;
- objetos de entrada e saída específicos.

Outro exemplo:

```text
Gestão de Cargas
  -> Conformidade Documental
  -> Inspeções
```

A relação de negócio não autoriza acoplamento técnico profundo.

## 15. Convenções de nomenclatura

### Diretórios

Use `kebab-case`.

```text
gestao-de-cargas
produtos-quimicos
conformidade-documental
value-objects
use-cases
```

### Arquivos

Use `kebab-case`.

```text
registrar-carga.use-case.ts
carga-quimica.entity.ts
produto-quimico.repository.ts
```

### Classes

Use `PascalCase`.

```text
CargaQuimica
ProdutoQuimico
RegistrarCargaUseCase
PrismaProdutoQuimicoRepository
```

### Métodos e variáveis

Use `camelCase`.

```text
registrarCarga
buscarProduto
alterarStatus
produtoAtivo
cargaId
```

### Sufixos

```text
.entity.ts       entity de domínio
.vo.ts           value object
.enum.ts         enum de domínio
.repository.ts   contrato ou implementação de repository
.use-case.ts     caso de uso
.service.ts      service de domínio ou infraestrutura
.mapper.ts       conversor entre formatos
.controller.ts   controller HTTP
.dto.ts          objeto de entrada ou saída
.error.ts        erro específico
.module.ts       módulo NestJS
.spec.ts         teste unitário
.e2e-spec.ts     teste E2E
```

### Linguagem ubíqua

Use termos do domínio:

```text
CargaQuimica
ProdutoQuimico
Inspecao
DocumentoCarga
ParecerTecnico
AutorizacaoMovimentacao
ResponsavelTecnico
```

Termos técnicos podem seguir convenção técnica:

```text
Repository
Controller
Mapper
UseCase
DTO
Module
```

## 16. Preciso criar um novo arquivo. Onde ele fica?

```text
É regra de negócio?
  |
  +-- Sim -> src/modules/<modulo>/domain/
  |
  +-- Não
      |
      +-- É uma ação da aplicação?
      |     +-- Sim -> application/use-cases/
      |
      +-- É contrato de persistência?
      |     +-- Sim -> domain/repositories/
      |
      +-- É contrato técnico usado por Use Case?
      |     +-- Sim -> application/contracts/
      |
      +-- É acesso a banco ou Prisma?
      |     +-- Sim -> infrastructure/persistence/prisma/
      |
      +-- É integração externa?
      |     +-- Sim -> infrastructure/integrations/
      |
      +-- É serviço técnico?
      |     +-- Sim -> infrastructure/services/
      |
      +-- É HTTP?
      |     +-- Sim -> presentation/
      |
      +-- É transversal a vários módulos?
            +-- Sim -> avaliar shared/
```

Resumo rápido:

```text
Entity                  -> domain/entities/
Value Object            -> domain/value-objects/
Enum                    -> domain/enums/
Erro de domínio         -> domain/errors/
Contrato repository     -> domain/repositories/
Use Case                -> application/use-cases/
DTO de Use Case         -> application/dto/
Contrato de aplicação   -> application/contracts/
Repository Prisma       -> infrastructure/persistence/prisma/
Mapper Prisma           -> infrastructure/persistence/prisma/
Controller              -> presentation/controllers/
DTO HTTP                -> presentation/dtos/
Teste unitário          -> test/unit/
Teste de integração     -> test/integration/
Teste E2E               -> test/e2e/
```

## 17. Fluxo para nova funcionalidade

Exemplo: liberar carga.

```text
1. Identificar o módulo
   -> gestao-de-cargas

2. Definir regra de negócio
   -> quando uma carga pode ser liberada?

3. Criar ou alterar domain, se necessário
   -> Entity, VO, Enum, Error ou Domain Service

4. Criar Use Case
   -> application/use-cases/liberar-carga.use-case.ts

5. Criar ou alterar contrato de repository
   -> domain/repositories/carga-quimica.repository.ts

6. Implementar persistência
   -> infrastructure/persistence/prisma/prisma-carga-quimica.repository.ts

7. Criar DTO HTTP, se houver endpoint
   -> presentation/dtos/liberar-carga.dto.ts

8. Criar ou alterar Controller
   -> presentation/controllers/cargas-quimicas.controller.ts

9. Criar testes
   -> test/unit, test/integration ou test/e2e
```

Nem toda funcionalidade exige todos esses passos. Use somente o necessário.

## 18. Evite complexidade prematura

Não crie abstrações sem necessidade.

Evite:

- service para todo comportamento;
- value object para todo campo;
- interface sem consumidor real;
- mapper que só copia propriedades;
- código em `shared` antes da hora;
- use case genérico demais;
- pasta ou arquivo só para parecer arquiteturalmente completo.

A prioridade é:

```text
clareza > complexidade
manutenibilidade > abstração
domínio > framework
modularidade > organização técnica genérica
```

## 19. Exemplos certo x errado

### Repository

Certo:

```text
domain/repositories/produto-quimico.repository.ts
infrastructure/persistence/prisma/prisma-produto-quimico.repository.ts
```

Errado:

```text
domain/prisma-produto.repository.ts
```

### Controller

Certo:

```text
Controller -> Use Case
```

Errado:

```text
Controller -> Prisma
```

### Entity

Certo:

```text
Entity com comportamento de domínio e invariantes.
```

Errado:

```text
Entity usada apenas como espelho de tabela.
```

### Shared

Certo:

```text
shared/application/pagination/
shared/presentation/filters/
shared/infrastructure/config/
```

Errado:

```text
shared/domain/carga-quimica.entity.ts
shared/repositories/produto-quimico.repository.ts
```

## 20. Checklists

### Antes de criar um arquivo

```text
[ ] Sei a qual módulo ele pertence?
[ ] Sei qual camada deve receber esse arquivo?
[ ] O arquivo tem responsabilidade única?
[ ] O nome segue kebab-case?
[ ] A classe segue PascalCase?
[ ] O sufixo comunica a função?
[ ] A dependência importada é realmente necessária?
[ ] A regra de negócio está na camada correta?
[ ] Estou evitando abstração sem uso real?
[ ] Estou evitando acessar outro módulo diretamente?
[ ] Existe arquivo existente que deveria ser reutilizado?
[ ] O arquivo terá teste?
```

### Antes de abrir um Pull Request

```text
[ ] A funcionalidade ficou no módulo correto?
[ ] Não coloquei regra de negócio em controller, DTO ou mapper?
[ ] Não importei Prisma no domínio?
[ ] Não importei DTO no domínio?
[ ] Não acessei repository interno de outro módulo?
[ ] Não coloquei código específico de módulo em shared?
[ ] Use Cases possuem intenção clara?
[ ] Services criados têm motivo real?
[ ] Value Objects criados têm validação ou significado real?
[ ] Repositories têm contrato separado da implementação?
[ ] Testes cobrem regra de negócio ou fluxo principal?
[ ] Nomes seguem as convenções deste documento?
[ ] Build, lint e testes foram executados quando o ambiente permitir?
```
