import { describe, it, expect } from 'vitest'
import { getCurrentUser } from './auth'
import { ConvexError } from 'convex/values'

function makeCtx(identity: Record<string, unknown> | null) {
  return {
    auth: {
      getUserIdentity: async () => identity,
    },
  } as never
}

describe('getCurrentUser', () => {
  it('returns identity when getUserIdentity resolves with a value', async () => {
    const identity = { subject: 'clerk|123', name: 'Ana', email: 'ana@example.com' }
    const result = await getCurrentUser(makeCtx(identity))
    expect(result).toBe(identity)
  })

  it('throws ConvexError with message "unauthenticated" when getUserIdentity returns null', async () => {
    await expect(getCurrentUser(makeCtx(null))).rejects.toThrow(ConvexError)
    await expect(getCurrentUser(makeCtx(null))).rejects.toMatchObject({ data: 'unauthenticated' })
  })
})
