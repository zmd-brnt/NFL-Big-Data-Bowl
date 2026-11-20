import { ROUTES, type RouteId } from '../lib/route'
import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { Icon } from './ui'

interface Props { route: RouteId; expanded: boolean; onToggle: () => void }

/** Riel de 68 px que se expande a 272 px por encima del contenido, como vidrio translúcido. */
export default function Sidebar({ route, expanded, onToggle }: Props) {
  const { t } = useLang()
  return (
    <div className="no-print relative z-30 w-[68px] flex-none">
      <aside
        className={`glass absolute inset-y-0 left-0 flex flex-col gap-0.5 overflow-hidden border-r border-line bg-[rgba(20,36,29,0.74)] p-2.5 backdrop-blur-[22px] backdrop-saturate-150 transition-[width,box-shadow] duration-[280ms] ease-[cubic-bezier(.2,.8,.2,1)] ${expanded ? 'w-[272px] shadow-[28px_0_70px_rgba(0,0,0,0.5)]' : 'w-[68px]'}`}
        aria-label="Navigation"
      >
        <button type="button" onClick={onToggle} aria-label={t('app.menu')} aria-expanded={expanded} className="flex w-full items-center gap-3.5 whitespace-nowrap rounded-[10px] px-[11px] py-[9px] text-left text-[#C5D1CA] hover:bg-chalk/10">
          <Icon name="menu" />
          <span className={`font-semibold transition-opacity ${expanded ? 'opacity-100 delay-100' : 'opacity-0'}`}>{t('app.brand')}</span>
        </button>
        {ROUTES.map((r, i) => {
          const prev = ROUTES[i - 1]
          const name = t(`nav.${r.id}` as DictKey)
          const desc = t(`nav.${r.id}.d` as DictKey)
          const active = r.id === route
          return (
            <div key={r.id} className={r.group === 3 ? 'mt-auto' : ''}>
              {(!prev || prev.group !== r.group) && <div className="mx-2.5 my-2 h-px bg-line" />}
              <a
                href={`#/${r.id}`} title={name} aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3.5 whitespace-nowrap rounded-[10px] px-[11px] py-[9px] ${active ? 'bg-hl/15 text-hl' : 'text-[#C5D1CA] hover:bg-chalk/10'}`}
              >
                <Icon name={r.icon} />
                <span className={`flex flex-col transition-opacity ${expanded ? 'opacity-100 delay-100 duration-200' : 'opacity-0 duration-100'}`} aria-hidden={!expanded}>
                  <span className="text-sm font-semibold">{name}</span>
                  <span className="text-xs opacity-65">{desc}</span>
                </span>
                <span className="sr-only">{name}</span>
              </a>
            </div>
          )
        })}
      </aside>
    </div>
  )
}
