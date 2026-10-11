import { createRequiredContext } from './createRequiredContext'

export const [ToastContext, useToast] = createRequiredContext('useToast', 'ToastProvider')
