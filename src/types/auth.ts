export type UserRole = 'punter' | 'comic' | 'promoter'

export interface Profile {
  id: string
  displayName: string
  avatarUrl: string | null
  role: UserRole
  createdAt: string
}
