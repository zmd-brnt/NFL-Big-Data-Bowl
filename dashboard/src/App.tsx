import { Suspense, useEffect, useRef, useState } from 'react'
import { LangProvider } from './i18n/LangContext'
import { useRoute } from './lib/useRoute'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import CommandPalette from './components/CommandPalette'
import { renderPage } from './pages'

function Shell() {
  const route = useRoute()
  const [expanded, setExpanded] = useState(false)
  const [palette, setPalette] = useState(false)
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(p => !p) }
      else if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { main.current?.scrollTo(0, 0); setExpanded(false) }, [route.id])

  return (
    <div className="flex h-full">
      <Sidebar route={route.id} expanded={expanded} onToggle={() => setExpanded(e => !e)} />
      <main ref={main} className="min-w-0 flex-1 overflow-auto px-4 pb-12 pt-5 md:px-8" onClick={() => expanded && setExpanded(false)}>
        <TopBar onSearch={() => setPalette(true)} />
        <Suspense fallback={<div className="py-16 text-center text-mute" role="status">…</div>}>{renderPage(route)}</Suspense>
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}

export default function App() {
  return <LangProvider><Shell /></LangProvider>
}
