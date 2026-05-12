'use client'
import { useState } from 'react'
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native'
import { YStack } from 'tamagui'
import { ExploreHeader } from '../../components/molecules/ExploreHeader'
import { FilterBar, FilterState } from '../../components/molecules/FilterBar'
import { CourtList } from '../../components/organisms/CourtList'
import { CourtMap } from '../../components/organisms/CourtMap'
import { MOCK_COURTS } from '../../data/mock-courts'

export default function ExploreScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filters, setFilters] = useState<FilterState>({
    date: null,
    time: null,
    type: null,
  })

  const filteredCourts = MOCK_COURTS.filter(court => {
    if (filters.type && court.type !== filters.type) return false
    return true
  })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />

      <ExploreHeader
        userName="Matías"
        location="Palermo, Buenos Aires"
        notificationCount={2}
      />

      <FilterBar filters={filters} onChange={setFilters} />

      <YStack flex={1}>
        {viewMode === 'list' ? (
          <CourtList
            courts={filteredCourts}
            viewMode={viewMode}
            onToggleView={setViewMode}
          />
        ) : (
          <CourtMap
            courts={filteredCourts}
            viewMode={viewMode}
            onToggleView={setViewMode}
          />
        )}
      </YStack>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
})
