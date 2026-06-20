export type Plan = 'free' | 'pro'

export const FREE_LIMITS = {
  venues:    1,
  courts:    3,
  employees: 1,
} as const

export function getPlan(user: { plan?: 'free' | 'pro' }): Plan {
  return user.plan ?? 'free'
}
