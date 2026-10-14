import { ApiParam } from '@nestjs/swagger';

/** Documenta no Swagger o parâmetro de rota `id` de um recurso. */
export function ApiIdParam(description: string, example: string) {
  return ApiParam({ name: 'id', type: String, description, example });
}
