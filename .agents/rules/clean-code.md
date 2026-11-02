# Clean Code & Arquitetura - Diretrizes do Projeto

## Princípio Geral
Sempre que encontrar qualquer inconsistência de clean code, code smells, duplicação de regras ou quebra de arquitetura limpa: **alerte e arrume**.

---

## 1. Separação de Responsabilidades por Camada (Clean Architecture / DDD)

### A. Apresentação (Controllers & DTOs)
- **Responsabilidade**: Entrada e saída de dados HTTP, validação sintática e documentação da API.
- **Validação**: Validação de formato, tipos, presença e valores básicos usando `class-validator` nos DTOs (`@IsNotEmpty()`, `@IsString()`, `@IsPositive()`, etc.).
- **Swagger**: Toda documentação de contrato (`@ApiProperty()`, `@ApiOperation()`, `@ApiResponse()`, `@ApiBody()`) deve refletir exatamente os campos aceitos e validados.
- **Não deve conter**: Regras de negócio ou consultas diretas ao banco.

### B. Aplicação (Use Cases)
- **Responsabilidade**: Orquestração do fluxo de negócio, transações e validação de contexto/existência relacional.
- **Validações permitidas**:
  - Verificar existência de entidades relacionadas no banco (ex.: `userRepository.findById`, `productRepository.findById`).
  - Lançar exceções de domínio apropriadas (`ResourceNotFoundError`, `ConflictError`).
- **NÃO FAZER**:
  - Não importar ou lançar exceções HTTP do framework (ex.: `BadRequestException`, `NotFoundException` de `@nestjs/common`).
  - Não duplicar validações sintáticas já garantidas pelo DTO/ValidationPipe (ex.: checar se string é vazia ou se número é nulo).

### C. Domínio (Entities & Value Objects)
- **Responsabilidade**: Garantir invariantes de negócio e regras intrínsecas da entidade.
- **Encapsulamento**:
  - Propriedades privadas/protegidas (`#prop`).
  - Métodos de instância modificam o próprio objeto via `this`. **NUNCA** receber a própria instância como parâmetro em métodos de instância (ex.: `shipment.updateStatus(status)` e NÃO `shipment.updateStatus(shipment, status)`).
- **Validação de Invariantes**:
  - Lançar `BusinessRuleError` quando uma regra de negócio for violada (ex.: quantidade menor ou igual a zero, transição de status inválida).
- **Isolamento Total**:
  - Camada de domínio nunca depende de NestJS, Prisma, TypeORM ou qualquer framework externo.

### D. Infraestrutura (Filtros, Repositórios & Prisma)
- **Filtros Globais**: O `DomainExceptionFilter` é responsável por capturar exceções de domínio e convertê-las nos status HTTP corretos:
  - `ResourceNotFoundError` -> 404 (Not Found)
  - `ConflictError` -> 409 (Conflict)
  - `BusinessRuleError` -> 422 (Unprocessable Entity)
- **Repositórios**: Convertem modelos de persistência (Prisma) para entidades de domínio e vice-versa.

---

## 2. Padrões de Código e TypeScript

### A. Módulos ESM e Extensões de Import
- Como o projeto usa NodeNext ESM, todos os imports locais relativos ou com alias `@/` devem usar a extensão `.js` (ex.: `import { User } from '@/modules/user/domain/entities/user.entity.js';`).
- Nunca usar `.ts` nos imports.

### B. Testes Automatizados
- **Testes de Entidade**: Testar criação, mutações de estado e invariantes (`BusinessRuleError`).
- **Testes de Use Case**: Testar fluxo de orquestração, interações com repositórios e tratamento de erros de dependência (`ResourceNotFoundError`, `ConflictError`).
- **Testes de DTO/Controller**: Testar validações de entrada e respostas HTTP.

---

## 3. Identificação e Correção Proativa
Ao trabalhar em qualquer funcionalidade ou arquivo:
1. Checar se há métodos com parâmetros redundantes ou quebras de encapsulamento OOP.
2. Checar se exceções HTTP estão vazando para casos de uso ou domínio.
3. Checar se validações sintáticas estão duplicadas no Use Case.
4. Checar integridade de imports `.js` e tipagem estrita.
5. Alertar claramente ao usuário as inconsistências encontradas e aplicar as correções.
