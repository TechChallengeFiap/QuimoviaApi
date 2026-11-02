# Regras de Negócio e Requisitos - Tech Challenge Fase 2 (QuimiPort / Quimovia)

Este documento sintetiza os requisitos obrigatórios, regras de negócio e critérios de avaliação do edital **POSTECH - FSDT - Tech Challenge - Fase 2.pdf**.

---

## 1. Visão Geral e Proposta
- **Contexto**: Primeira versão da API backend do QuimiPort (Quimovia), sistema de gerenciamento logístico de cargas químicas e produtos perigosos no Porto de Santos.
- **Stack Tecnológica Obrigatória**: Node.js, NestJS, TypeScript, Prisma ORM, PostgreSQL (ou MongoDB), Docker, GitHub Actions, Jest / Supertest.
- **Arquitetura**: Monólito Modular baseado em Domain-Driven Design (DDD) e Clean Architecture, conforme definido em [Fundamentos e decisões](../../docs/arquitetura/01-fundamentos-e-decisoes.md) e [Organização e aplicação](../../docs/arquitetura/02-organizacao-e-aplicacao.md).

---

## 2. Critérios de Avaliação (Composição da Nota - 100%)
1. **API e Regras de Negócio (30%)**:
   - Funcionamento correto dos endpoints REST.
   - Organização de rotas e separação em camadas.
   - Tratamento centralizado de erros e exceções de domínio.
   - Aplicação rigorosa das regras de negócio e invariantes.
2. **Persistência e Modelagem de Dados (20%)**:
   - Modelagem relacional consistente (chaves primárias, estrangeiras, índices e relacionamentos).
   - Relacionamento entre Carga Química e Produto Químico.
   - Inativação / exclusão lógica (`deletedAt`).
3. **Testes Automatizados (20%)**:
   - Cobertura de testes unitários e E2E para todos os fluxos críticos e bloqueios exigidos pelo edital.
4. **Docker e Ambiente (10%)**:
   - `Dockerfile` e `docker-compose.yml` funcionais para subir API e banco de dados localmente sem esforço manual.
5. **Documentação (10%)**:
   - `README.md` completo com justificativas arquiteturais, instruções de execução e endpoints.
   - Documentação OpenAPI/Swagger 100% funcional com exemplos de payloads e status codes.
6. **CI/CD com GitHub Actions (10%)**:
   - Pipeline de automação executando instalação, compilação (build) e testes.

---

## 3. Módulo de Produtos Químicos

### Atributos Mínimos da Entidade
- `id`: Identificador único (UUID).
- `name` / `technicalName`: Nome técnico do produto.
- `description` / `tradeName`: Descrição ou nome comercial.
- `unNumber`: Número ONU (4 dígitos numéricos).
- `riskClass`: Classe de risco conforme normas internacionais.
- `compatibilityGroup`: Grupo de compatibilidade química.
- `status`: Situação do produto (`ACTIVE`, `INACTIVE`, `BLOCKED`, `UNDER_ANALYSIS`).
- `responsibleUserId`: Usuário responsável técnico cadastrado.
- `createdAt` e `updatedAt`: Carimbos de data/hora.

### Regras de Negócio Obrigatórias
1. **Nome Obrigatório**: Um produto químico não pode ser cadastrado sem nome (`technicalName`).
2. **Classe de Risco Obrigatória**: Um produto químico não pode ser cadastrado sem classe de risco (`riskClass`).
3. **Status Válido**: O status do produto deve seguir os estados permitidos pelo domínio.
4. **Bloqueio de Produto Inativo**: **Um produto químico inativo (`INACTIVE` / `BLOCKED`) NÃO DEVE ser utilizado em novas cargas**.

### Endpoints REST Mínimos
- `POST /produtos-quimicos` (ou `/chemical-products`): Cadastra novo produto químico.
- `GET /produtos-quimicos`: Lista produtos químicos com paginação e filtros.
- `GET /produtos-quimicos/:id`: Busca produto químico por ID.
- `PUT /produtos-quimicos/:id`: Atualiza dados do produto químico.
- `PATCH /produtos-quimicos/:id/inativar`: Inativa um produto químico ativo.

---

## 4. Módulo de Cargas Químicas

### Atributos Mínimos da Entidade
- `id`: Identificador único (UUID).
- `code`: Código identificador da carga (ex.: `CARGO-2026-001`).
- `productId`: ID do produto químico associado.
- `quantityProduct` / `quantity`: Quantidade de produto químico.
- `unit`: Unidade de medida (kg, toneladas, litros, etc.).
- `origin`: Origem da carga (porto/porto de embarque).
- `destination`: Destino da carga.
- `responsibleUserId`: Usuário responsável técnico / operador portuário.
- `documentsIds` / `documents`: Documentação obrigatória anexada.
- `status`: Status do ciclo de vida da carga.
- `entryDate`: Data de entrada no terminal portuário.
- `createdAt` e `updatedAt`: Carimbos de auditoria.

### Regras de Negócio Obrigatórias
1. **Produto Associado**: Uma carga química não pode ser registrada sem produto químico associado.
2. **Produto Ativo**: **Uma carga química não pode ser registrada com produto químico inativo**.
3. **Quantidade Positiva**: A quantidade da carga deve ser obrigatoriamente maior que zero (`quantityProduct > 0`). Não pode ser 0 nem negativa.
4. **Responsável Técnico**: Toda carga deve possuir um responsável técnico válido e existente.
5. **Documentação Obrigatória para Liberação**: Uma carga não pode ser liberada (`APPROVED` / `RELEASED`) sem documentação obrigatória anexada e válida.
6. **Bloqueio de Movimentação**: Uma carga com status Bloqueada (`REPROVED` / `BLOCKED`) **não pode entrar em movimentação**.
7. **Carga Cancelada Imutável**: Uma carga cancelada não pode ser liberada nem reativada.
8. **Finalização Prévia**: Uma carga em inspeção não pode ser finalizada sem antes ser liberada.

---

## 5. Máquina de Estados e Ciclo de Vida da Carga

### Status Permitidos
- `Registrada` (`REGISTERED`)
- `Em análise` (`ANALYZING`)
- `Em inspeção` (`INSPECTION`)
- `Liberada` (`APPROVED` / `RELEASED`)
- `Bloqueada` (`REPROVED` / `BLOCKED`)
- `Em movimentação` (`IN_TRANSIT` / `IN_TRANSIT_MOVEMENT`)
- `Finalizada` (`COMPLETED` / `FINALIZED`)
- `Cancelada` (`CANCELLED`)

### Fluxo Principal Permitido
`Registrada` → `Em análise` → `Em inspeção` → `Liberada` → `Em movimentação` → `Finalizada`

### Fluxos Alternativos Permitidos
- `Registrada` → `Cancelada`
- `Em análise` → `Cancelada`
- `Em inspeção` → `Bloqueada`
- `Em inspeção` → `Cancelada`
- `Liberada` → `Cancelada`
- `Bloqueada` → `Cancelada`

### Estados Terminais (Imutáveis)
- `Finalizada`
- `Cancelada`
*(Cargas nesses estados não podem sofrer nenhuma transição posterior)*

### Transições Proibidas (Devem Lançar `BusinessRuleError`)
- `Cancelada` → `Liberada`
- `Finalizada` → `Em movimentação`
- `Bloqueada` → `Em movimentação`
- `Registrada` → `Finalizada`
- `Em inspeção` → `Finalizada` (sem passar por `Liberada`)
- `Liberada` → `Registrada`

---

## 6. Checklist de Testes Automatizados Obrigatórios (Edital)
Qualquer alteração na API deve assegurar que os seguintes testes unitários ou E2E existam e passem:
- [x] Cadastro de produto químico válido.
- [x] Bloqueio de cadastro de produto químico sem nome.
- [x] Bloqueio de cadastro de produto químico sem classe de risco.
- [x] Registro de carga química com produto válido e ativo.
- [x] **Bloqueio de carga com produto químico inativo**.
- [x] **Bloqueio de carga com quantidade menor ou igual a zero (0 ou negativa)**.
- [x] Bloqueio de liberação de carga sem documentação obrigatória.
- [x] Atualização de status da carga pelo fluxo permitido.
- [x] **Bloqueio das transições proibidas de status**.
- [x] Cancelamento de carga a partir dos status permitidos.
- [x] **Tentativa bloqueada de movimentar carga com status Bloqueada**.
