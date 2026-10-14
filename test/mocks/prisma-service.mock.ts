/**
 * Substitui o PrismaService nos testes que montam módulos de contexto: os
 * repositórios são trocados por fakes, e nenhuma conexão com o banco é aberta.
 */
export function createPrismaServiceStub() {
  return {
    $connect: async () => undefined,
    $disconnect: async () => undefined,
  };
}
