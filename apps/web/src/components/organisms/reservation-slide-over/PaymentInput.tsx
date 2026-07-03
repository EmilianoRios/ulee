'use client'

import { useState } from 'react'
import { useTheme } from 'tamagui'
import { Banknote, CreditCard, ArrowLeftRight } from 'lucide-react'
import { PaymentMethodButton } from './PaymentMethodButton'

export function PaymentInput({ pendingBalance, cashAmount, onlineAmount, paymentReady, onChange }: {
  pendingBalance: number
  cashAmount:     number
  onlineAmount:   number
  paymentReady:   boolean
  onChange:       (cash: number, online: number) => void
}) {
  const t = useTheme()
  const [mode, setMode] = useState<'cash' | 'online' | 'split'>('cash')
  const [cashStr,   setCashStr]   = useState(String(cashAmount))
  const [onlineStr, setOnlineStr] = useState(String(onlineAmount))

  const inputStyle: React.CSSProperties = {
    width:           '100%',
    padding:         '7px 10px',
    borderRadius:    6,
    border:          `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: t.superficie.val,
    color:           t.textoPrimario.val,
    fontSize:        13,
    fontFamily:      'inherit',
    outline:         'none',
    boxSizing:       'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize:     11,
    fontWeight:   500,
    color:        t.textoMuted.val,
    marginBottom: 4,
    display:      'block',
  }

  function selectMode(next: 'cash' | 'online' | 'split') {
    setMode(next)
    if (next === 'cash')   onChange(pendingBalance, 0)
    if (next === 'online') onChange(0, pendingBalance)
    if (next === 'split')  { setCashStr(String(cashAmount)); setOnlineStr(String(onlineAmount)); onChange(cashAmount, onlineAmount) }
  }

  const totalAssigned = cashAmount + onlineAmount

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <PaymentMethodButton
          label="Efectivo"
          icon={<Banknote size={14} strokeWidth={2} />}
          selected={mode === 'cash'}
          onClick={() => selectMode('cash')}
        />
        <PaymentMethodButton
          label="Mercado Pago"
          icon={<CreditCard size={14} strokeWidth={2} />}
          selected={mode === 'online'}
          onClick={() => selectMode('online')}
        />
        <PaymentMethodButton
          label="Mixto"
          icon={<ArrowLeftRight size={14} strokeWidth={2} />}
          selected={mode === 'split'}
          onClick={() => selectMode('split')}
        />
      </div>

      {mode === 'split' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Efectivo ($)</label>
            <input
              type="number"
              min={0}
              value={cashStr}
              onChange={(e) => { setCashStr(e.target.value); onChange(Math.max(0, Number(e.target.value) || 0), onlineAmount) }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Mercado Pago ($)</label>
            <input
              type="number"
              min={0}
              value={onlineStr}
              onChange={(e) => { setOnlineStr(e.target.value); onChange(cashAmount, Math.max(0, Number(e.target.value) || 0)) }}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {mode === 'split' && (
        <div style={{
          fontSize:   12,
          fontWeight: 500,
          color:      paymentReady ? t.verdeCanchaProfundo.val : t.textoMuted.val,
          transition: 'color 150ms ease-out',
        }}>
          Asignado: ${totalAssigned.toLocaleString('es-AR')} de ${pendingBalance.toLocaleString('es-AR')}
        </div>
      )}
    </div>
  )
}
