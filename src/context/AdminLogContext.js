import { createRequiredContext } from './createRequiredContext'

export const [AdminLogContext, useAdminLog] = createRequiredContext('useAdminLog', 'AdminLogProvider')
