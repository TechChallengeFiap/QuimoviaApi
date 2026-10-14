import { readFileSync, readdirSync } from 'node:fs';
import { posix } from 'node:path';

/**
 * Leitura dos imports de src/ para os testes de arquitetura.
 *
 * Usa apenas a biblioteca padrão do Node: os testes verificam as regras de
 * dependência de docs/arquitetura/02-organizacao-e-aplicacao.md (seção 6) sem
 * depender de ferramentas externas.
 */

export type Layer =
  | 'domain'
  | 'application'
  | 'infrastructure'
  | 'presentation'
  | 'public'
  | 'module';

/** Localização de um arquivo de src/ na arquitetura. */
export interface Location {
  /** Caminho a partir da raiz do repositório, sem extensão. */
  path: string;
  /** Contexto (pasta em src/modules/), quando o arquivo pertence a um. */
  context: string | null;
  /** Camada dentro do contexto. */
  layer: Layer | null;
}

export interface SourceImport {
  specifier: string;
  /** Destino resolvido em src/, ou null para pacotes externos. */
  target: Location | null;
  /** Nomes importados entre chaves, sem `type` e sem alias. */
  names: string[];
}

export interface SourceFile extends Location {
  imports: SourceImport[];
}

const LAYERS: readonly Layer[] = [
  'domain',
  'application',
  'infrastructure',
  'presentation',
  'public',
];

export function locate(path: string): Location {
  const match = /^src\/modules\/([^/]+)\/(.+)$/.exec(path);

  if (!match) {
    return { path, context: null, layer: null };
  }

  const [, context, rest] = match;
  const firstSegment = rest.split('/')[0] as Layer;
  const layer = LAYERS.includes(firstSegment)
    ? firstSegment
    : rest.endsWith('.module')
      ? 'module'
      : null;

  return { path, context, layer };
}

function resolveSpecifier(fromPath: string, specifier: string): string | null {
  let target: string;

  if (specifier.startsWith('@/')) {
    target = `src/${specifier.slice(2)}`;
  } else if (specifier.startsWith('.')) {
    target = posix.join(posix.dirname(fromPath), specifier);
  } else {
    return null;
  }

  return target.replace(/\.(js|ts)$/, '');
}

/** Remove comentários para que exemplos em JSDoc não contem como imports. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const STATIC_IMPORT = /\b(?:import|export)\s+(?:type\s+)?([^'";]*?)\s*from\s*'([^']+)'/g;
const SIDE_EFFECT_IMPORT = /\bimport\s*'([^']+)'/g;
const DYNAMIC_IMPORT = /\bimport\(\s*'([^']+)'\s*\)/g;

function namesOf(clause: string): string[] {
  const braces = /\{([^}]*)\}/.exec(clause);

  if (!braces) {
    return [];
  }

  return braces[1]
    .split(',')
    .map((name) => name.replace(/^\s*type\s+/, '').split(/\s+as\s+/)[0].trim())
    .filter((name) => name.length > 0);
}

export function parseImports(path: string, source: string): SourceImport[] {
  const code = stripComments(source);
  const imports: SourceImport[] = [];
  const add = (specifier: string, names: string[]) => {
    const resolved = resolveSpecifier(path, specifier);
    imports.push({
      specifier,
      target: resolved ? locate(resolved) : null,
      names,
    });
  };

  for (const [, clause, specifier] of code.matchAll(STATIC_IMPORT)) {
    add(specifier, namesOf(clause));
  }
  for (const [, specifier] of code.matchAll(SIDE_EFFECT_IMPORT)) {
    add(specifier, []);
  }
  for (const [, specifier] of code.matchAll(DYNAMIC_IMPORT)) {
    add(specifier, []);
  }

  return imports;
}

/** Lê todos os arquivos .ts de src/, exceto o código gerado pelo Prisma. */
export function readSourceFiles(rootDir: string): SourceFile[] {
  const srcDir = posix.join(rootDir.split('\\').join('/'), 'src');

  return readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .map((entry) => `src/${String(entry).split('\\').join('/')}`)
    .filter(
      (path) => path.endsWith('.ts') && !path.startsWith('src/generated/'),
    )
    .map((file) => {
      const path = file.replace(/\.ts$/, '');
      const source = readFileSync(posix.join(rootDir, file), 'utf8');

      return { ...locate(path), imports: parseImports(path, source) };
    });
}

export const PRISMA_SERVICE =
  'src/shared/infrastructure/persistence/prisma/prisma.service';

export function isPrismaAccess(target: Location): boolean {
  return (
    target.path.startsWith('src/generated/prisma') ||
    target.path === PRISMA_SERVICE
  );
}

export function publicApiOf(context: string): string {
  return `src/modules/${context}/public/index`;
}

/** Ciclos no grafo de dependências entre contextos, como "a -> b -> a". */
export function findContextCycles(files: SourceFile[]): string[] {
  const edges = new Map<string, Set<string>>();

  for (const file of files) {
    if (!file.context) continue;
    for (const { target } of file.imports) {
      if (target?.context && target.context !== file.context) {
        const targets = edges.get(file.context) ?? new Set<string>();
        targets.add(target.context);
        edges.set(file.context, targets);
      }
    }
  }

  const cycles: string[] = [];
  const visit = (context: string, trail: string[]) => {
    for (const next of edges.get(context) ?? []) {
      if (trail.includes(next)) {
        cycles.push([...trail.slice(trail.indexOf(next)), next].join(' -> '));
      } else {
        visit(next, [...trail, next]);
      }
    }
  };

  for (const context of edges.keys()) {
    visit(context, [context]);
  }

  return [...new Set(cycles)];
}
