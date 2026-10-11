import { createRequiredContext } from './createRequiredContext'

export const [AuthContext, useAuth] = createRequiredContext('useAuth', 'AuthProvider')
