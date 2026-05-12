'use client'
import { ScrollView } from 'react-native'
import { XStack } from 'tamagui'
import type { CourtType } from '../../data/mock-courts'
import { FilterPill } from '../atoms/FilterPill'

export interface FilterState {
  date: string | null
  time: string | null
  type: CourtType | null
}

interface FilterBarProps {
  filters: FilterState
  onChange: (next: FilterState) => void
}

const DATE_DEFAULT = 'Hoy'
const TIME_DEFAULT = '18:00'
const TYPE_OPTIONS: CourtType[] = ['Fútbol 5', 'Fútbol 7', 'Pádel', 'Tenis', 'Básquet']

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$2"
      backgroundColor="$superficieContenido"
      borderBottomWidth={1}
      borderBottomColor="$divisor"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <FilterPill
          label="Cualquier día"
          value={filters.date ?? undefined}
          active={filters.date !== null}
          onPress={() => onChange({ ...filters, date: filters.date ? null : DATE_DEFAULT })}
        />
        <FilterPill
          label="Cualquier hora"
          value={filters.time ?? undefined}
          active={filters.time !== null}
          onPress={() => onChange({ ...filters, time: filters.time ? null : TIME_DEFAULT })}
        />
        <FilterPill
          label="Todas"
          value={filters.type ?? undefined}
          active={filters.type !== null}
          onPress={() => {
            const next = TYPE_OPTIONS.find(t => t !== filters.type) ?? TYPE_OPTIONS[0]
            onChange({ ...filters, type: filters.type ? null : next })
          }}
        />
      </ScrollView>
    </XStack>
  )
}
