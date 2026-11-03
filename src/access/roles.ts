import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'editora' | 'autora' | 'cliente'

type U = { role?: Role } | null | undefined

export const isAdmin = (user: U) => user?.role === 'admin'
export const isStaff = (user: U) => ['admin', 'editora', 'autora'].includes(user?.role ?? '')

export const adminOnly: Access = ({ req }) => isAdmin(req.user as U)
export const staffOnly: Access = ({ req }) => isStaff(req.user as U)
export const publicRead: Access = () => true
export const adminFieldOnly: FieldAccess = ({ req }) => isAdmin(req.user as U)

/** Staff ve todo; un cliente sólo ve los documentos donde `field` apunta a él. */
export const staffOrOwner =
  (field = 'user'): Access =>
  ({ req }) => {
    if (isStaff(req.user as U)) return true
    if (req.user) return { [field]: { equals: req.user.id } }
    return false
  }
