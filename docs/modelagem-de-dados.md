# Modelagem de dados

## Estrutura dos dados

O [`schema.prisma`](../prisma/schema.prisma) descreve as tabelas, os campos, as chaves primárias, as chaves estrangeiras e os índices. As alterações estão versionadas em [`prisma/migrations`](../prisma/migrations).

| Modelo                          | Dados e relacionamentos principais                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ChemicalProduct`               | `id` como chave primária; `code` único; `technicalName`, `tradeName` opcional, `unNumber`, `riskClass`, `physicalState`, `status`, `responsibleUserId`, `createdAt` e `updatedAt`. Relaciona-se ao usuário responsável, aos documentos do produto e às cargas.                 |
| `ProductDocument`               | `id` como chave primária; `productId` como chave estrangeira do produto; tipo, número, referência do arquivo e validade opcional.                                                                                                                                              |
| `ChemicalShipment`              | `id` como chave primária; `productId` e `responsibleUserId` como chaves estrangeiras; `quantityProduct`, `documentsIds`, `status`, `createdAt`, `updatedAt` e `deletedAt`. Cada carga referencia um produto e um responsável.                                                  |
| `ShipmentDocument`              | `id` como chave primária; `shipmentId` único, `shipperId`, versão da composição, status, revisão e datas. A relação com os anexos utiliza chave estrangeira; as referências a carga e usuários são armazenadas por identificador, sem chave estrangeira entre esses contextos. |
| `ShipmentDocumentAttachment`    | Referência à documentação, nome, tipo, referência do arquivo, escopos, datas de emissão e validade e histórico de substituição ou remoção.                                                                                                                                     |
| `Inspection` e `InspectionItem` | Inspeção vinculada à carga e ao fiscal por chaves estrangeiras; escopo, versão da composição, status, verificações, resultados e datas.                                                                                                                                        |
| `User` e `Session`              | Usuários, perfis, status, hash de senha e sessões com expiração e encerramento. Usuários usam exclusão lógica.                                                                                                                                                                 |
| Tabelas de auditoria            | Histórico de usuários, produtos, cargas, inspeções e documentos, com entidade, autor, ação, descrição, detalhes e data, sem chaves estrangeiras para preservar o histórico.                                                                                                    |

`documentsIds` é um campo textual do cadastro da carga. A liberação consulta a documentação pelo `shipmentId` no módulo `document-compliance`; preencher esse campo textual, por si só, não libera a carga. Os anexos armazenam referências de arquivos; este cadastro não implementa upload de arquivos.

## Status e rastreabilidade

O status da carga é persistido como `ENUM`, com valor inicial `REGISTERED`. As transições são definidas em [`shipment-status-transitions.ts`](../src/modules/chemical-shipment/domain/value-objects/chemical-shipment/shipment-status-transitions.ts) e validadas pela entidade [`ChemicalShipment`](../src/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.ts). Há índices para consulta por status e responsável.

O histórico registra o autor, a data e a ação realizada. Nas mudanças de status, a tabela `ChemicalShipmentLog` também registra a situação anterior e a nova nos campos `from` e `to`, com a ação `STATUS_CHANGED`.

As consultas da auditoria são restritas ao Administrador do Sistema. A API não expõe edição ou exclusão desses registros; a gravação da carga e a gravação da auditoria são operações separadas.

As transições permitidas estão no [controle de status do README](../README.md#92-controle-de-status-das-cargas).
