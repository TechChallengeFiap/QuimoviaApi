import type { Logger } from '@nestjs/common';

/**
 * Registra o erro capturado por um caso de uso, com a mensagem de contexto e a
 * pilha. Quem chama continua responsável por propagar o erro.
 */
export function logError(
  logger: Logger,
  context: string,
  error: unknown,
): void {
  logger.error(
    `${context}: ${error instanceof Error ? error.message : String(error)}`,
    error instanceof Error ? error.stack : undefined,
  );
}
