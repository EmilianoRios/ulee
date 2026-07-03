'use client'

import { useTheme } from 'tamagui'
import { ActionButton } from '../ActionButton'

export function AusenteActions({ onEdit, onDeleteRequest }: {
  onEdit:          () => void
  onDeleteRequest: () => void
}) {
  const t = useTheme()
  return (
    <>
      <span style={{ fontSize: 13, color: t.textoInactivo.val }}>
        Cancha liberada.
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionButton
          label="Editar"
          onClick={onEdit}
          variant="secondary"
          compact
        />
        <ActionButton
          label="Eliminar reserva"
          onClick={onDeleteRequest}
          variant="danger"
        />
      </div>
    </>
  )
}
