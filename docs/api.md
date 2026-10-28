# Referência da API

Consulte o [Swagger](http://localhost:3000/api) com a aplicação em execução.

As regras e o diagrama do ciclo de vida estão no [controle de status das cargas](../README.md#92-controle-de-status-das-cargas).

## Exemplos de requisição e resposta

### 1. Consulta de transições permitidas

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

### 2. Alteração de status

```http
PATCH /chemical-shipment/326d18f1-f7a5-40ae-9e3d-b32f085bfca7/status
Content-Type: application/json

{
  "status": "ANALYZING"
}
```

**Resposta resumida (200 OK):**

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

### 3. Tentativa de liberação sem documentação suficiente

```http
PATCH /chemical-shipment/326d18f1-f7a5-40ae-9e3d-b32f085bfca7/release
```

**Resposta de erro de negócio (422 Unprocessable Entity):**

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Uma carga não pode ser liberada sem documentação obrigatória."
}
```

## Códigos de erro HTTP

| Código                     | Significado            | Quando Ocorre                                                                                                        |
| :------------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`          | Validação de entrada   | Campos obrigatórios ausentes, formato ou tipo inválido e valores fora dos limites definidos no DTO.                  |
| `401 Unauthorized`         | Não autenticado        | Token JWT expirado/inválido, ou ausência de token em uma rota que exige autenticação.                                |
| `403 Forbidden`            | Não Autorizado         | Usuário autenticado não possui papel operacional permitido para executar a ação.                                     |
| `404 Not Found`            | Recurso Não Encontrado | Identificador de carga química, usuário responsável ou produto químico não localizado.                               |
| `409 Conflict`             | Conflito               | Código ou e-mail já cadastrado, conflito de atualização ou edição documental fora da preparação.                     |
| `422 Unprocessable Entity` | Regra de negócio       | Transição de status proibida, tentativa de liberação sem documentação suficiente ou movimentação de carga bloqueada. |

## Autenticação (`/auth`)

- `POST /auth/login` — Confere e-mail e senha, inicia uma sessão e devolve o token de acesso (`401` para credenciais inválidas e `403` para conta inativa ou bloqueada).
- `POST /auth/logout` — Encerra a sessão do token enviado, que deixa de valer na hora.

Bloquear, inativar ou excluir um usuário encerra as sessões dele, e reativar a conta não as reativa: é preciso fazer login de novo.

A autorização por perfil é aplicada às operações restritas de gestão de usuários e à consulta de auditoria. As consultas de usuários (`GET /users` e `GET /users/:id`) são públicas. As rotas de produtos, documentação e inspeções ainda não exigem autenticação. As rotas de cargas usam autenticação opcional para identificar o autor quando um token é fornecido.

## Produtos químicos (`/chemical-products`)

- `POST /chemical-products` — Cadastra um produto; o status padrão é `UNDER_ANALYSIS`.
- `GET /chemical-products` — Lista produtos com filtros e paginação.
- `GET /chemical-products/:id` — Consulta um produto.
- `PATCH /chemical-products/:id` — Atualiza dados cadastrais.
- `PATCH /chemical-products/:id/status` — Altera o status, incluindo ativação e inativação. Somente produtos `ACTIVE` podem ser usados em novas cargas.
- `DELETE /chemical-products/:id` — Solicita a remoção do produto; para inativar sem excluir, utilize a rota de status.

Os documentos do produto são gerenciados em `/chemical-products/:id/documents`, com `POST` e `GET` na coleção e `GET`, `PATCH` e `DELETE` em `/:documentId`. Esses documentos são distintos da documentação da carga usada na liberação.

## Cargas químicas (`/chemical-shipment`)

- `POST /chemical-shipment` — Registra uma nova carga química (status inicial `REGISTERED`).
- `GET /chemical-shipment` — Lista cargas químicas com paginação e filtros (`status`, `productId`, `responsibleUserId`, `documentsIds`).
- `GET /chemical-shipment/:id` — Retorna os detalhes de uma carga química pelo ID.
- `GET /chemical-shipment/:id/transitions` — Consulta as opções de transição válidas para o status atual da carga.
- `PATCH /chemical-shipment/:id` — Atualiza o produto químico associado, o responsável técnico, a referência documental e a quantidade da carga. Permitido nos status `REGISTERED` e `ANALYZING`.
- `PATCH /chemical-shipment/:id/status` — Altera o status da carga respeitando as transições permitidas.
- `PATCH /chemical-shipment/:id/release` — Libera a carga química (`APPROVED`), consultando a documentação associada à carga.
- `PATCH /chemical-shipment/:id/block` — Bloqueia a carga química (`REPROVED`) a partir do status de inspeção.
- `PATCH /chemical-shipment/:id/cancel` — Cancela a carga química a partir dos status permitidos.
- `DELETE /chemical-shipment/:id` — Realiza a exclusão lógica da carga química.

## Inspeções portuárias (`/inspections`)

- `POST /inspections` — Registra nova inspeção técnica para a carga total ou item específico.
- `GET /inspections` — Lista inspeções cadastradas com filtros de status e escopo.
- `GET /inspections/:id` — Consulta o resultado e detalhes de uma inspeção por identificador.
- `PATCH /inspections/:id` — Atualiza o status (`IN_PROGRESS`, `COMPLETED`) e resultado dos itens (`COMPLIANT`, `NON_COMPLIANT`).
- `DELETE /inspections/:id` — Remove uma inspeção pendente.

## Documentação das cargas (`/shipment-documents`)

- `POST /shipment-documents` — Cadastra a documentação da carga em preparação, com anexos opcionais.
- `GET /shipment-documents` — Lista documentos com paginação e filtros por carga, embarcador e status.
- `GET /shipment-documents/:id` — Consulta o documento e o histórico dos anexos.
- `PATCH /shipment-documents/:id` — Adiciona, substitui ou remove anexos enquanto o documento está em preparação.
- `DELETE /shipment-documents/:id` — Exclui a documentação em preparação.

## Usuários e acessos (`/users`)

Cadastrar usuários internos, remover e trocar o perfil de usuários exige o token de um Administrador do Sistema (`401` sem token e `403` para os outros perfis). Na edição, o administrador altera qualquer usuário, e os demais perfis só os próprios dados, sem poder se bloquear. Os embarcadores (usuários externos) se cadastram sozinhos pela rota pública `POST /users/shippers`.

- `POST /users` — Cadastra operador, fiscal ou responsável técnico com hash seguro de senha.
- `POST /users/shippers` — Cadastro público do embarcador, sem token: o perfil é sempre `SHIPPER_DRIVER` e a conta já nasce ativa; enviar `role` ou `status` retorna `400`, e o e-mail de um usuário excluído retorna `409` (só o administrador reativa a conta).
- `GET /users` — Lista usuários cadastrados com suporte a busca por e-mail, perfil e status.
- `GET /users/:id` — Busca informações cadastrais do usuário.
- `PATCH /users/:id` — Atualiza nome, e-mail, senha ou status (`ACTIVE`, `INACTIVE`, `BLOCKED`).
- `PATCH /users/:id/role` — Troca o perfil de acesso do usuário (só o administrador).
- `DELETE /users/:id` — Exclui o usuário logicamente (`isDeleted` e `deletedAt`): ele some das buscas e da listagem e perde o acesso, mas o registro é mantido. Cadastrar de novo o mesmo e-mail em `POST /users` reativa esse registro, com o mesmo id.

## Auditoria (`/logs`)

As consultas exigem uma sessão ativa com perfil `SYSTEM_ADMIN`:

- `GET /logs/users` — Histórico de ações em usuários.
- `GET /logs/chemical-products` — Histórico de produtos químicos.
- `GET /logs/chemical-shipments` — Histórico de cargas químicas.
- `GET /logs/inspections` — Histórico de inspeções.
- `GET /logs/shipment-documents` — Histórico da documentação das cargas.

As listagens aceitam filtros por entidade e autor e possuem paginação. A auditoria registra ações do negócio; os logs de execução utilizam o `Logger` do NestJS nos fluxos que o adotam, sem uma plataforma externa de monitoramento configurada.
