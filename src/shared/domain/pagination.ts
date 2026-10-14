/** Página e tamanho usados quando a listagem não os informa. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

/** Uma página de resultados de uma listagem. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
