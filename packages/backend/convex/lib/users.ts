// Pure domain logic — no Convex ctx references.
// Import the type from the generated data model only for the shape.

/**
 * Given an existing user document (or null), decide whether the invite flow
 * should grant access to an existing user or create a new stub first.
 */
export function resolveInviteTarget(
  existingUser: { _id: string } | null,
): 'grant_access' | 'create_and_grant' {
  if (existingUser) return 'grant_access'
  return 'create_and_grant'
}
