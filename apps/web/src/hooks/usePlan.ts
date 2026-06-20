'use client'

import { useQuery } from 'convex/react'
import { api } from '@canchero/backend'

export function usePlan(): 'free' | 'pro' {
  return useQuery(api.functions.users.queries.getMyPlan) ?? 'free'
}
