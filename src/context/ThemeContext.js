import { createRequiredContext } from './createRequiredContext'

export const [ThemeContext, useTheme] = createRequiredContext('useTheme', 'ThemeProvider')
