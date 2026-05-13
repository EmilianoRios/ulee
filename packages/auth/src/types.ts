export type UserRole = 'admin' | 'owner' | 'employee' | 'client'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}
