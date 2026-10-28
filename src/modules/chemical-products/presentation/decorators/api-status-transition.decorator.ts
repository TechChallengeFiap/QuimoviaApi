import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { ApiParamOptions, ApiResponseMetadata } from '@nestjs/swagger';

export interface ApiStatusTransitionOptions {
  summary: string;
  description: string;
  /** DTO devolvido com o recurso já no novo status (mesmo tipo aceito por @ApiOkResponse). */
  responseType: NonNullable<ApiResponseMetadata['type']>;
  params: ApiParamOptions[];
  notFoundDescription: string;
  notFoundExample: object;
  /** Mensagem de exemplo do 422; quando omitida, a operação não documenta esse erro. */
  businessRuleExample?: string;
}

/**
 * Documenta no Swagger um endpoint de ação que muda o status de um recurso
 * (ativar, bloquear, aprovar um lote...). Esses endpoints não têm corpo, exceto
 * quando o próprio controller adiciona um @ApiBody, e devolvem 200 com o
 * recurso atualizado.
 */
export function ApiStatusTransition(options: ApiStatusTransitionOptions) {
  const decorators = [
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: options.summary, description: options.description }),
    ...options.params.map((param) => ApiParam(param)),
    ApiOkResponse({
      description: `${options.summary}: operação realizada com sucesso.`,
      type: options.responseType,
    }),
    ApiNotFoundResponse({
      description: options.notFoundDescription,
      schema: { example: options.notFoundExample },
    }),
    ApiInternalServerErrorResponse({
      description: `Erro interno do servidor ao processar: ${options.summary.toLowerCase()}.`,
    }),
  ];

  if (options.businessRuleExample) {
    decorators.push(
      ApiUnprocessableEntityResponse({
        description: 'A transição de status não é permitida a partir da situação atual.',
        schema: {
          example: {
            message: options.businessRuleExample,
            error: 'Unprocessable Entity',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          },
        },
      }),
    );
  }

  return applyDecorators(...decorators);
}
