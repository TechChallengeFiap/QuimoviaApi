# Diretrizes do Projeto QuimoviaApi para Agentes de IA

Este é o documento mestre de instruções para qualquer Agente de IA trabalhando no projeto **QuimoviaApi** (sistema QuimiPort para o Tech Challenge - Fase 2 da PósTech em Full Stack Development).

---

## 🚨 DIRETIVA SUPREMA: ALERTE E ARRUME
> **Sempre que encontrar qualquer inconsistência de clean code, violação de arquitetura em camadas (Clean Architecture / DDD), divergência das regras do edital ou code smells: ALERTE E ARRUME imediatamente.**

---

## 📚 Fontes Canônicas de Verdade (Leitura Obrigatória)
Toda e qualquer decisão, criação de arquivos ou alteração de código deve levar em consideração:
1. **Arquitetura e Organização**: [docs/arquitetura-e-organizacao.md](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/docs/arquitetura-e-organizacao.md) — Manual único de estrutura, pastas, responsabilidades e convenções de nomenclatura.
2. **Edital do Tech Challenge Fase 2**: `POSTECH - FSDT - Tech Challenge - Fase 2.pdf` e [.agents/rules/tech-challenge-fase-2.md](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/.agents/rules/tech-challenge-fase-2.md) — Regras de negócio, atributos obrigatórios, máquina de estados e matriz de avaliação.
3. **Diretrizes de Clean Code**: [.agents/rules/clean-code.md](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/.agents/rules/clean-code.md) — Separação estrita de camadas e higiene de código.

---

## 🏗️ 1. Arquitetura do Projeto (Clean Architecture + DDD)
Conforme documentado em [docs/arquitetura-e-organizacao.md](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/docs/arquitetura-e-organizacao.md), a aplicação é um **Monólito Modular** dividido em Bounded Contexts em `src/modules/<modulo>/`:

### Estrutura de Camadas em Cada Módulo:
1. **`domain/` (Núcleo do Negócio - Puro)**:
   - Contém `entities/`, `value-objects/`, `enums/`, `repositories/` (interfaces/contratos), `services/` e `errors/`.
   - **Regra de Ouro**: É 100% isolado. **NUNCA** importar NestJS, Prisma, TypeORM, HTTP, DTOs ou controllers.
   - As entidades protegem suas próprias invariantes lançando [BusinessRuleError](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/domain/errors/domain.error.ts#L6-L10).
   - Métodos de instância alteram o próprio estado (`this`), **NUNCA** recebendo a si mesmas como parâmetro.

2. **`application/` (Casos de Uso e Orquestração)**:
   - Contém `use-cases/`, `dto/` e `contracts/`.
   - Representa ações claras de negócio (ex.: `CreateChemicalShipmentUseCase`, `ChangeChemicalProductStatusUseCase`).
   - Valida dependências externas e integridade relacional via repositórios (ex.: `userRepository.findById`, `productRepository.findById`), lançando [ResourceNotFoundError](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/domain/errors/domain.error.ts#L29-L38) ou [ConflictError](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/domain/errors/domain.error.ts#L20-L24).
   - **Regra de Ouro**: **NUNCA** importar ou lançar exceções HTTP (`BadRequestException`, `NotFoundException`, etc.) em Use Cases.
   - **NUNCA** duplicar validações sintáticas que já são garantidas pelos DTOs e pelo `ValidationPipe`.

3. **`presentation/` (Controllers e DTOs HTTP)**:
   - Contém `controllers/` e `dtos/`.
   - Entrada e saída HTTP via NestJS.
   - Validação sintática (presença, tipos, formato, `@IsPositive()`, `@IsNotEmpty()`) pertence exclusivamente aos DTOs com `class-validator`.
   - Swagger (`@ApiProperty()`, `@ApiOperation()`, `@ApiResponse()`, `@ApiBody()`) deve estar 100% sincronizado com os DTOs, incluindo exemplos realistas e possíveis códigos de erro.

4. **`infrastructure/` (Implementações Técnicas)**:
   - Implementa contratos de repositório com Prisma em `persistence/prisma/`.
   - Converte modelos do Prisma para entidades de domínio e vice-versa.

5. **`shared/` (Apenas Recursos Transversais)**:
   - Contém filtros globais ([DomainExceptionFilter](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/presentation/filters/domain-exception.filter.ts)), pipes, configuração do Swagger e Prisma global.
   - **NUNCA** colocar regras de negócio, entidades ou repositórios específicos de um módulo dentro de `shared/`.

6. **Organização de Testes**:
   - Código de teste fica estritamente fora de `src/`, sob `test/unit/`, `test/e2e/` ou `test/integration/`.

---

## 🎯 2. Regras de Negócio e Requisitos do Tech Challenge (Fase 2)
O projeto é avaliado rigorosamente conforme o edital **POSTECH - FSDT - Tech Challenge - Fase 2.pdf**:

### Matriz de Avaliação (100%):
- **API e Regras de Negócio (30%)**
- **Persistência e Modelagem de Dados (20%)**
- **Testes Automatizados (20%)**
- **Docker e Execução (10%)**
- **Documentação (10%)**
- **CI/CD com GitHub Actions (10%)**

### A. Módulo de Produtos Químicos:
- **Atributos Obrigatórios**: `id`, `code`, `technicalName` (nome do produto), `tradeName` / descrição, `unNumber` (número ONU de 4 dígitos), `riskClass` (classe de risco), `status` (`ACTIVE`, `INACTIVE`, `BLOCKED`, `UNDER_ANALYSIS`), `responsibleUserId`, `createdAt`, `updatedAt`.
- **Regras Inegociáveis**:
  1. Produto químico **não pode ser cadastrado sem nome** (`technicalName`).
  2. Produto químico **não pode ser cadastrado sem classe de risco** (`riskClass`).
  3. Produto químico **não pode ter status inválido**.
  4. **Um produto químico inativo (`INACTIVE` / `BLOCKED`) NÃO DEVE ser utilizado em novas cargas**.

### B. Módulo de Cargas Químicas:
- **Atributos Obrigatórios**: `id`, `code` (código da carga), `productId` (produto químico associado), `quantityProduct` (quantidade), `responsibleUserId` (responsável técnico), `documentsIds` (documentação obrigatória), `status` (status da carga), `createdAt`, `updatedAt`, `deletedAt`.
- **Regras Inegociáveis**:
  1. Carga química **não pode ser registrada sem produto químico associado**.
  2. **Carga química NÃO PODE ser registrada com produto químico inativo**.
  3. A quantidade da carga **deve ser obrigatoriamente maior que zero** (`quantityProduct > 0`). Rejeitar 0 e valores negativos com [BusinessRuleError](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/domain/errors/domain.error.ts#L6-L10).
  4. Toda carga **deve possuir responsável técnico informado e existente** no sistema.
  5. Uma carga **não pode ser liberada sem documentação obrigatória**.
  6. Uma carga bloqueada **não pode entrar em movimentação**.
  7. Uma carga cancelada **não pode ser liberada nem reativada**.
  8. Uma carga em inspeção **não pode ser finalizada sem antes ser liberada**.

### C. Ciclo de Vida e Máquina de Estados da Carga:
- **Status Permitidos**: `Registrada` (`REGISTERED`), `Em análise` (`ANALYZING`), `Em inspeção` (`INSPECTION`), `Liberada` (`APPROVED`), `Bloqueada` (`REPROVED`), `Em movimentação` (`IN_TRANSIT`), `Finalizada` (`COMPLETED`), `Cancelada` (`CANCELLED`).
- **Fluxo Principal**: `Registrada` → `Em análise` → `Em inspeção` → `Liberada` → `Em movimentação` → `Finalizada`.
- **Fluxos Alternativos**:
  - `Registrada` → `Cancelada`
  - `Em análise` → `Cancelada`
  - `Em inspeção` → `Bloqueada` ou `Cancelada`
  - `Liberada` → `Cancelada`
  - `Bloqueada` → `Cancelada`
- **Estados Terminais (Imutáveis)**: `Finalizada` e `Cancelada` (não podem sofrer novas alterações de status).
- **Transições Proibidas (Devem Lançar `BusinessRuleError`)**:
  - `Cancelada` → `Liberada`
  - `Finalizada` → `Em movimentação`
  - `Bloqueada` → `Em movimentação`
  - `Registrada` → `Finalizada`
  - `Em inspeção` → `Finalizada` (sem passar por `Liberada`)
  - `Liberada` → `Registrada`

---

## 🧪 3. Checklist Obrigatório de Testes Automatizados (Edital)
Toda alteração deve preservar e garantir testes automatizados cobrindo:
- [x] Cadastro de produto químico válido.
- [x] Bloqueio de cadastro de produto químico sem nome.
- [x] Bloqueio de cadastro de produto químico sem classe de risco.
- [x] Registro de carga química com produto e usuário válidos.
- [x] **Bloqueio de carga com produto químico inativo**.
- [x] **Bloqueio de carga com quantidade menor ou igual a zero**.
- [x] Bloqueio de liberação de carga sem documentação obrigatória.
- [x] Transições de status permitidas da carga.
- [x] **Bloqueio de transições proibidas de status**.
- [x] Cancelamento de carga a partir dos status permitidos.
- [x] **Tentativa de movimentar carga bloqueada bloqueada com erro de negócio**.

---

## ⚙️ 4. Padrões Técnicos e Convenções
1. **Módulos ESM e Extensões de Arquivo**:
   - O projeto compila com NodeNext ESM.
   - **SEMPRE usar extensão `.js`** nos imports relativos e com alias `@/` (ex.: `import { User } from '@/modules/user/domain/entities/user.entity.js';`).
   - **NUNCA usar extensão `.ts`** em imports.
2. **Tratamento de Exceções**:
   - Domínio lança [BusinessRuleError](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/domain/errors/domain.error.ts#L6-L10) (status 400).
   - Aplicação lança [ResourceNotFoundError](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/domain/errors/domain.error.ts#L29-L38) (status 404) ou [ConflictError](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/domain/errors/domain.error.ts#L20-L24) (status 409).
   - O [DomainExceptionFilter](file:///c:/Users/Takashi/Documents/P%C3%B3sTech/TechChallenge/QuimoviaApi/src/shared/presentation/filters/domain-exception.filter.ts) converte automaticamente para as respostas HTTP correspondentes.
3. **Build e Verificação Contínua**:
   - Sempre valide suas alterações rodando `npm test` e `npm run build` antes de concluir qualquer tarefa.
