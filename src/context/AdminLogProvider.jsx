import { AdminLogContext } from './AdminLogContext'
import { initialAdminLog } from '../data/adminLog'
import { usePersistentState } from '../hooks/usePersistentState'

// Se guardan las últimas 200 decisiones; la más reciente va primero.
const MAX_ENTRIES = 200
let sequence = 0

export function AdminLogProvider({ children }) {
  const [entries, setEntries] = usePersistentState('adminLog', initialAdminLog)

  // entry: { by, action, tone, target: { type, id, name }, reason }
  function record(entry) {
    sequence += 1
    const item = { ...entry, id: `log-${Date.now().toString(36)}-${sequence}`, date: new Date().toISOString() }
    setEntries((prev) => [item, ...prev].slice(0, MAX_ENTRIES))
  }

  function entriesFor(type, id) {
    return entries.filter((entry) => entry.target?.type === type && entry.target?.id === id)
  }

  const value = { entries, record, entriesFor }

  return <AdminLogContext.Provider value={value}>{children}</AdminLogContext.Provider>
}
