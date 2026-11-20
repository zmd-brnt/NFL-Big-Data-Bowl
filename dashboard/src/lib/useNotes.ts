import { useCallback, useState } from 'react'
import { addNote, loadNotes, removeNote, saveNotes, type Note } from './notesStore'

/** Puntos fijados, guardados en localStorage. */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const commit = useCallback((next: Note[]) => { setNotes(next); saveNotes(next) }, [])
  return {
    notes,
    has: (id: string) => notes.some(n => n.id === id),
    pin: (n: Note) => commit(addNote(notes, n)),
    unpin: (id: string) => commit(removeNote(notes, id)),
  }
}
