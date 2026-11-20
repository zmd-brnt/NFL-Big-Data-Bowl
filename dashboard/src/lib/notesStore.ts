/** Punto para comentar fijado. Guarda los dos idiomas para mostrarlo en el idioma actual. */
export interface Note { id: string; en: string; es: string; sample: boolean }

const isNote = (x: unknown): x is Note => {
  const n = x as Note
  return !!n && typeof n.id === 'string' && typeof n.en === 'string' && typeof n.es === 'string' && typeof n.sample === 'boolean'
}

export function parseNotes(raw: string | null): Note[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isNote) : []
  } catch {
    return []
  }
}
export const serializeNotes = (notes: Note[]): string => JSON.stringify(notes)
export const addNote = (notes: Note[], note: Note): Note[] => (notes.some(n => n.id === note.id) ? notes : [...notes, note])
export const removeNote = (notes: Note[], id: string): Note[] => notes.filter(n => n.id !== id)

const KEY = 'booth-notes'
export function loadNotes(): Note[] {
  try { return parseNotes(window.localStorage.getItem(KEY)) } catch { return [] }
}
export function saveNotes(notes: Note[]): void {
  try { window.localStorage.setItem(KEY, serializeNotes(notes)) } catch { /* sin almacenamiento */ }
}
