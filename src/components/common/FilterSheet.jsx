import { useState } from 'react'
import { X } from 'lucide-react'

const WAR_CHIPS = [
  { id: 'iron_swords', label: 'חרבות ברזל' },
  { id: 'six_days',    label: 'ששת הימים'  },
  { id: 'yom_kippur',  label: 'יום כיפור'  },
  { id: 'lebanon',     label: 'לבנון'       },
]

const TYPE_CHIPS = [
  { id: 'monument',  label: 'אנדרטה'     },
  { id: 'cemetery',  label: 'בית קברות'  },
  { id: 'museum',    label: 'מוזיאון'    },
  { id: 'lookout',   label: 'מצפה'       },
]

const REGION_CHIPS = [
  { id: 'north',     label: 'צפון'    },
  { id: 'center',    label: 'מרכז'    },
  { id: 'south',     label: 'דרום'    },
  { id: 'jerusalem', label: 'ירושלים' },
]

function ChipGroup({ chips, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {chips.map(chip => (
        <button
          key={chip.id}
          onClick={() => onToggle(chip.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${selected.has(chip.id)
              ? 'bg-olive-700 text-white'
              : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'}`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}

// ── Sheet shell (shared chrome) ───────────────────────────────────────────────
function SheetShell({ onClose, onReset, title, children, footer }) {
  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/50" onClick={onClose} />
      <div
        dir="rtl"
        className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl
                   px-5 pt-4 pb-8 max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            איפוס
          </button>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="סגור"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <div className="flex flex-col gap-5">
          {children}
          {footer}
        </div>
      </div>
    </>
  )
}

/**
 * Controlled, config-driven variant used by the Routes page.
 * `groups`  : [{ key, title, options:[{value,label}] }]
 * `values`  : { [key]: selectedValue | 'all' }
 * `onChange`: (key, value) => void   (single-select per group; re-pick clears)
 */
function ControlledFilterSheet({ isOpen, onClose, groups, values, onChange, onReset }) {
  if (!isOpen) return null
  const activeCount = Object.values(values).filter(v => v && v !== 'all').length
  return (
    <SheetShell title="סינון מסלולים" onClose={onClose} onReset={onReset}>
      {groups.map(group => (
        <div key={group.key}>
          <h3 className="text-sm font-semibold text-slate-700 mb-2.5 text-right">
            {group.title}
          </h3>
          <div className="flex flex-wrap gap-2 justify-end">
            {group.options.map(opt => {
              const active = values[group.key] === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange(group.key, opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${active
                      ? 'bg-olive-700 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'}`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <button
        onClick={onClose}
        className="w-full py-3 bg-olive-700 text-white text-sm font-semibold rounded-full
                   hover:bg-olive-800 active:scale-95 transition-all duration-150"
      >
        {activeCount > 0 ? `הצג תוצאות (${activeCount} מסננים)` : 'הצג תוצאות'}
      </button>
    </SheetShell>
  )
}

export default function FilterSheet({ groups, ...props }) {
  // Routes page passes `groups` → controlled, config-driven sheet.
  // Map / Memorials pass no groups → legacy uncontrolled sheet (unchanged).
  return groups
    ? <ControlledFilterSheet groups={groups} {...props} />
    : <LegacyFilterSheet {...props} />
}

function LegacyFilterSheet({ isOpen, onClose, onApply }) {
  const [wars,    setWars   ] = useState(new Set())
  const [types,   setTypes  ] = useState(new Set())
  const [regions, setRegions] = useState(new Set())
  const [radius,  setRadius ] = useState(50)

  function toggle(setter, id) {
    setter(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const activeCount =
    wars.size + types.size + regions.size + (radius !== 50 ? 1 : 0)

  function handleApply() {
    onApply?.({ wars: [...wars], types: [...types], regions: [...regions], radius })
    onClose()
  }

  function handleReset() {
    setWars(new Set())
    setTypes(new Set())
    setRegions(new Set())
    setRadius(50)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/50" onClick={onClose} />

      <div
        dir="rtl"
        className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl
                   px-5 pt-4 pb-8 max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between mb-5">
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            איפוס
          </button>
          <h2 className="text-base font-bold text-slate-800">סינון מתקדם</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2.5 text-right">
              מלחמה / מבצע
            </h3>
            <ChipGroup chips={WAR_CHIPS} selected={wars} onToggle={id => toggle(setWars, id)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2.5 text-right">סוג אתר</h3>
            <ChipGroup chips={TYPE_CHIPS} selected={types} onToggle={id => toggle(setTypes, id)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2.5 text-right">אזור</h3>
            <ChipGroup
              chips={REGION_CHIPS}
              selected={regions}
              onToggle={id => toggle(setRegions, id)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-olive-700 font-semibold">{radius} ק"מ</span>
              <h3 className="text-sm font-semibold text-slate-700">רדיוס חיפוש</h3>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="w-full accent-[#4c5a28]"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>100 ק"מ</span>
              <span>1 ק"מ</span>
            </div>
          </div>

          <button
            onClick={handleApply}
            className="w-full py-3 bg-olive-700 text-white text-sm font-semibold rounded-full
                       hover:bg-olive-800 active:scale-95 transition-all duration-150"
          >
            {activeCount > 0 ? `החל סינון (${activeCount})` : 'החל סינון'}
          </button>
        </div>
      </div>
    </>
  )
}
