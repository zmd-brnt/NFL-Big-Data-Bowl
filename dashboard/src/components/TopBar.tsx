import { useLang } from '../i18n/LangContext'
import { Icon, Seg } from './ui'

export default function TopBar({ onSearch }: { onSearch: () => void }) {
  const { t, lang, setLang, unit, setUnit } = useLang()
  return (
    <div className="no-print mb-4 flex flex-wrap items-center justify-end gap-3">
      <button
        type="button" onClick={onSearch}
        className="flex min-w-[220px] items-center gap-2 rounded-[10px] border border-line px-3 py-[7px] text-[13px] text-mute hover:border-mute md:min-w-[260px]"
      >
        <Icon name="search" className="h-4 w-4" />
        <span>{t('app.search')}</span>
        <kbd className="ml-auto rounded-[5px] border border-line px-1.5 font-mono text-[11px]">Ctrl K</kbd>
      </button>
      <Seg label={t('app.units')} value={unit} onChange={setUnit} options={[{ value: 'yd', label: 'yd' }, { value: 'm', label: 'm' }]} />
      <Seg label={t('app.lang')} value={lang} onChange={setLang} options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]} />
    </div>
  )
}
