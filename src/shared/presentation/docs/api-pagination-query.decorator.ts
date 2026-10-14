import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

/**
 * Documenta no Swagger os parâmetros de paginação das listagens, `page` e
 * `pageSize`, com os mesmos limites validados pelos DTOs de consulta.
 *
 * @param itemsLabel nome dos itens no plural, como em "Quantidade de
 * inspeções por página".
 */
export function ApiPaginationQuery(itemsLabel: string) {
  // O applyDecorators aplica a lista em ordem, enquanto decorators empilhados
  // são aplicados de baixo para cima. pageSize vem antes para reproduzir a
  // ordem de aplicação de quando page e pageSize eram empilhados nessa
  // sequência, o que mantém a ordem dos parâmetros no Swagger.
  return applyDecorators(
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 100,
      default: 20,
      description: `Quantidade de ${itemsLabel} por página (máximo 100)`,
      example: 20,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      minimum: 1,
      default: 1,
      description: 'Número da página desejada',
      example: 1,
    }),
  );
}
