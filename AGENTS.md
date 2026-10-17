# Diretrizes do Projeto QuimoviaApi para Agentes

Consulte o arquivo de regras completas em [.agents/rules/clean-code.md](file:///.agents/rules/clean-code.md).

## Diretiva Principal
Sempre que encontrar qualquer inconsistência de clean code, violação de arquitetura em camadas (Clean Architecture) ou code smells: **alerte e arrume**.

### Regras Essenciais:
1. **Camada de Apresentação (DTOs / Controllers)**:
   - Validações sintáticas (tipos, presença, formato, números positivos) pertencem aos DTOs com `class-validator`.
   - O Swagger deve estar sempre 100% sincronizado com os DTOs.
2. **Camada de Aplicação (Use Cases)**:
   - Use Cases orquestram regras e validam dependências de banco (`userRepository.findById`, etc.), lançando `ResourceNotFoundError` ou `ConflictError`.
   - **NUNCA** importar ou lançar exceções HTTP (`BadRequestException`, `NotFoundException`, etc.) em Use Cases.
   - **NUNCA** duplicar validações sintáticas que já são garantidas pelo DTO/ValidationPipe.
3. **Camada de Domínio (Entities & Value Objects)**:
   - Entidades protegem suas próprias invariantes lançando `BusinessRuleError`.
   - Métodos de instância alteram o próprio estado (`this`), **NUNCA** recebendo a si mesmas como parâmetro.
4. **Infraestrutura**:
   - `DomainExceptionFilter` mapeia erros de domínio para códigos HTTP (400, 404, 409).
5. **Imports ESM**:
   - Sempre usar extensão `.js` nos imports locais e aliases `@/`, nunca `.ts`.
