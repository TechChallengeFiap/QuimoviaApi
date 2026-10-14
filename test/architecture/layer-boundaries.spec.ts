import {
  findContextCycles,
  isPrismaAccess,
  publicApiOf,
  readSourceFiles,
  type SourceFile,
  type SourceImport,
} from './import-graph.js';

/**
 * Regras de dependência entre camadas e contextos
 * (docs/arquitetura/02-organizacao-e-aplicacao.md, seção 6).
 *
 * O TypeScript e o NestJS não conhecem as fronteiras da arquitetura: sem estes
 * testes, um import proibido passaria despercebido.
 */
const files = readSourceFiles(process.cwd());

/** Lista "arquivo -> import" para cada import que viola a regra. */
function violations(
  selectFiles: (file: SourceFile) => boolean,
  isForbidden: (entry: SourceImport, file: SourceFile) => boolean,
): string[] {
  return files
    .filter(selectFiles)
    .flatMap((file) =>
      file.imports
        .filter((entry) => isForbidden(entry, file))
        .map((entry) => `${file.path} -> ${entry.specifier}`),
    );
}

const isSharedOutsideDomain = (path: string) =>
  path.startsWith('src/shared/infrastructure/') ||
  path.startsWith('src/shared/presentation/');

const PERSISTENCE_INFRASTRUCTURE =
  /^src\/(modules\/[^/]+|shared)\/infrastructure\/persistence\//;

describe('Arquitetura: fronteiras entre camadas e contextos', () => {
  it('lê os arquivos de todos os contextos implementados', () => {
    const contexts = new Set(files.map((file) => file.context));

    expect([...contexts]).toEqual(
      expect.arrayContaining(['chemical-shipment', 'inspection', 'user']),
    );
  });

  it('o domínio depende apenas do próprio domínio, de shared/domain e do Node', () => {
    const forbidden = violations(
      (file) => file.layer === 'domain',
      ({ specifier, target }, file) => {
        if (target === null) return !specifier.startsWith('node:');
        if (target.path.startsWith('src/shared/')) {
          return !target.path.startsWith('src/shared/domain/');
        }
        return target.context !== file.context || target.layer !== 'domain';
      },
    );

    expect(forbidden).toEqual([]);
  });

  it('a aplicação não depende de infraestrutura, presentation, Prisma ou HTTP', () => {
    const allowedFromNest = new Set(['Inject', 'Injectable', 'Logger']);
    const forbidden = violations(
      (file) => file.layer === 'application',
      (entry) => {
        if (entry.specifier === '@nestjs/common') {
          return entry.names.some((name) => !allowedFromNest.has(name));
        }
        if (entry.target === null) return !entry.specifier.startsWith('node:');
        return (
          entry.target.layer === 'infrastructure' ||
          entry.target.layer === 'presentation' ||
          isSharedOutsideDomain(entry.target.path)
        );
      },
    );

    expect(forbidden).toEqual([]);
  });

  it('a presentation não acessa a infraestrutura dos contextos', () => {
    const forbidden = violations(
      (file) => file.layer === 'presentation',
      ({ target }) => target?.layer === 'infrastructure',
    );

    expect(forbidden).toEqual([]);
  });

  it('um contexto usa outro apenas pela API pública (public/index)', () => {
    const forbidden = violations(
      (file) => file.context !== null,
      ({ target }, file) => {
        if (target === null || target.context === null) return false;
        return (
          target.context !== file.context &&
          target.path !== publicApiOf(target.context)
        );
      },
    );

    expect(forbidden).toEqual([]);
  });

  it('os arquivos internos de um contexto não importam a própria API pública', () => {
    const forbidden = violations(
      (file) => file.context !== null,
      ({ target }, file) =>
        target !== null &&
        file.context !== null &&
        target.path === publicApiOf(file.context),
    );

    expect(forbidden).toEqual([]);
  });

  it('shared/ não depende de nenhum contexto', () => {
    const forbidden = violations(
      (file) => file.path.startsWith('src/shared/'),
      ({ target }) => target !== null && target.context !== null,
    );

    expect(forbidden).toEqual([]);
  });

  it('só a infraestrutura de persistência acessa o Prisma', () => {
    const forbidden = violations(
      (file) => !PERSISTENCE_INFRASTRUCTURE.test(file.path),
      ({ target }) => target !== null && isPrismaAccess(target),
    );

    expect(forbidden).toEqual([]);
  });

  it('as dependências entre contextos não formam ciclos', () => {
    expect(findContextCycles(files)).toEqual([]);
  });
});
