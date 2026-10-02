import { jest } from '@jest/globals';

/**
 * Simula runtimes que transpilam o TypeScript com esbuild (como o tsx), que não
 * emitem a metadata `design:*` usada pelo Nest para injetar dependências,
 * validar DTOs e montar o Swagger.
 *
 * Deve ser chamado antes de importar os módulos da aplicação, para que os
 * decorators já sejam avaliados sem essa metadata.
 */
export function disableDesignMetadata() {
  const getMetadata = Reflect.getMetadata.bind(Reflect);

  return jest
    .spyOn(Reflect, 'getMetadata')
    .mockImplementation((metadataKey, target, propertyKey) =>
      String(metadataKey).startsWith('design:')
        ? undefined
        : getMetadata(metadataKey, target, propertyKey),
    );
}
