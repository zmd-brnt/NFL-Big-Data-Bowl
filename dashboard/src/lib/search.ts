const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export interface Searchable { label: string; keywords?: string }

/** Filtra sin distinguir mayúsculas ni acentos. Una consulta vacía devuelve todo. */
export function filterItems<T extends Searchable>(query: string, items: T[]): T[] {
  const q = norm(query)
  if (!q) return items
  return items.filter(i => norm(i.label).includes(q) || (i.keywords ? norm(i.keywords).includes(q) : false))
}
