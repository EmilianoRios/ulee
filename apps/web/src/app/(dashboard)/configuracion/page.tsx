'use client'

import { useCallback, useState } from 'react'
import { Check } from 'lucide-react'
import { useTheme } from 'tamagui'
import { ModuleLayout } from '@/components/templates/module-layout'
import { ConfigGeneral  } from '@/components/organisms/config-general'
import { ConfigHorarios } from '@/components/organisms/config-horarios'
import { ConfigPrecios  } from '@/components/organisms/config-precios'
import { ConfigFeriados } from '@/components/organisms/config-feriados'

type Tab = 'general' | 'horarios' | 'precios' | 'feriados'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general',  label: 'Información general' },
  { id: 'horarios', label: 'Horarios'             },
  { id: 'precios',  label: 'Precios y pagos'      },
  { id: 'feriados', label: 'Feriados'             },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const t = useTheme()

  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [dirtyTabs, setDirtyTabs] = useState<Set<Tab>>(new Set())
  const [savedTab,  setSavedTab]  = useState<Tab | null>(null)

  const isDirty   = dirtyTabs.has(activeTab)
  const justSaved = savedTab === activeTab

  // ─── Stable dirty callbacks per tab ───────────────────────────────────────

  const onGeneralDirty  = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); d ? n.add('general')  : n.delete('general');  return n }), [])
  const onHorariosDirty = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); d ? n.add('horarios') : n.delete('horarios'); return n }), [])
  const onPreciosDirty  = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); d ? n.add('precios')  : n.delete('precios');  return n }), [])
  const onFeriadosDirty = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); d ? n.add('feriados') : n.delete('feriados'); return n }), [])

  // ─── Stable saved callbacks per tab ───────────────────────────────────────

  const markSaved = useCallback((tab: Tab) => {
    setDirtyTabs(p => { const n = new Set(p); n.delete(tab); return n })
    setSavedTab(tab)
    setTimeout(() => setSavedTab(prev => prev === tab ? null : prev), 2000)
  }, [])

  const onGeneralSaved  = useCallback(() => markSaved('general'),  [markSaved])
  const onHorariosSaved = useCallback(() => markSaved('horarios'), [markSaved])
  const onPreciosSaved  = useCallback(() => markSaved('precios'),  [markSaved])
  const onFeriadosSaved = useCallback(() => markSaved('feriados'), [markSaved])

  const FORM_ID = `config-form-${activeTab}`

  // ─── Strip ────────────────────────────────────────────────────────────────

  const strip = (
    <>
      {/* Dark header */}
      <div style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 32px',
        backgroundColor: t.cabeceraOscura.val,
      }}>
        <span style={{
          fontSize:      15,
          fontWeight:    600,
          color:         'oklch(97% 0.006 220)',
          letterSpacing: '-0.01em',
          lineHeight:    1,
          userSelect:    'none',
        }}>
          Configuración
        </span>

        <button
          form={FORM_ID}
          type="submit"
          disabled={!isDirty}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            padding:         '6px 14px',
            borderRadius:    7,
            border:          'none',
            backgroundColor: justSaved
              ? 'oklch(45% 0.14 155)'
              : isDirty ? t.verdeCancha.val : 'oklch(36% 0.008 228)',
            color:           isDirty || justSaved
              ? 'oklch(98% 0.004 155)'
              : 'oklch(55% 0.010 228)',
            fontSize:        12,
            fontWeight:      500,
            cursor:          isDirty ? 'pointer' : 'default',
            lineHeight:      1,
            fontFamily:      'inherit',
            transition:      'background-color 200ms ease-out, color 200ms ease-out',
          }}
          onMouseEnter={(e) => {
            if (!isDirty) return
            e.currentTarget.style.backgroundColor = t.verdeCanchaProfundo.val
          }}
          onMouseLeave={(e) => {
            if (!isDirty) return
            e.currentTarget.style.backgroundColor = isDirty ? t.verdeCancha.val : 'oklch(36% 0.008 228)'
          }}
        >
          {justSaved && <Check size={12} strokeWidth={2.5} />}
          {justSaved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display:         'flex',
        alignItems:      'stretch',
        padding:         '0 24px',
        borderBottom:    `1px solid ${t.divisor.val}`,
        backgroundColor: t.superficieContenido.val,
        height:          44,
        gap:             0,
      }}>
        {TABS.map(tab => {
          const isActive   = tab.id === activeTab
          const hasUnsaved = dirtyTabs.has(tab.id) && tab.id !== activeTab

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position:     'relative',
                display:      'flex',
                alignItems:   'center',
                gap:          6,
                padding:      '0 14px',
                border:       'none',
                borderBottom: isActive ? `2px solid ${t.verdeCancha.val}` : '2px solid transparent',
                marginBottom: -1,
                backgroundColor: 'transparent',
                color:        isActive ? t.verdeCanchaProfundo.val : t.textoMuted.val,
                fontSize:     13,
                fontWeight:   isActive ? 500 : 400,
                cursor:       'pointer',
                fontFamily:   'inherit',
                lineHeight:   1,
                userSelect:   'none',
                transition:   'color 120ms ease-out, border-color 120ms ease-out',
              }}
              onMouseEnter={(e) => {
                if (isActive) return
                e.currentTarget.style.color = t.textoPrimario.val
              }}
              onMouseLeave={(e) => {
                if (isActive) return
                e.currentTarget.style.color = t.textoMuted.val
              }}
            >
              {tab.label}
              {hasUnsaved && (
                <span style={{
                  width:           5,
                  height:          5,
                  borderRadius:    '50%',
                  backgroundColor: t.acentoTerraza.val,
                  flexShrink:      0,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <ModuleLayout strip={strip}>
      <div style={{
        height:    '100%',
        overflowY: 'auto',
        padding:   '32px',
        boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth: 640, width: '100%' }}>
          {activeTab === 'general'  && (
            <ConfigGeneral
              formId={FORM_ID}
              onDirtyChange={onGeneralDirty}
              onSaved={onGeneralSaved}
            />
          )}
          {activeTab === 'horarios' && (
            <ConfigHorarios
              formId={FORM_ID}
              onDirtyChange={onHorariosDirty}
              onSaved={onHorariosSaved}
            />
          )}
          {activeTab === 'precios'  && (
            <ConfigPrecios
              formId={FORM_ID}
              onDirtyChange={onPreciosDirty}
              onSaved={onPreciosSaved}
            />
          )}
          {activeTab === 'feriados' && (
            <ConfigFeriados
              formId={FORM_ID}
              onDirtyChange={onFeriadosDirty}
              onSaved={onFeriadosSaved}
            />
          )}
        </div>
      </div>
    </ModuleLayout>
  )
}
