import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'
import { AuthProvider } from './context/AuthProvider'
import { FoundationsProvider } from './context/FoundationsProvider'
import { PetsProvider } from './context/PetsProvider'
import { CampaignsProvider } from './context/CampaignsProvider'
import { DonationsProvider } from './context/DonationsProvider'
import { AdoptionsProvider } from './context/AdoptionsProvider'
import { ReportsProvider } from './context/ReportsProvider'
import { FavoritesProvider } from './context/FavoritesProvider'
import { StoriesProvider } from './context/StoriesProvider'
import { AdminLogProvider } from './context/AdminLogProvider'
import AppRoutes from './routes/routes'
import ScrollToTop from './routes/ScrollToTop'

// Estado global con Context API: un provider por dominio (sesión, mascotas, campañas, donaciones,
// solicitudes de adopción, reportes, fundaciones, favoritos, historias y la bitácora del panel de
// administración). Las páginas leen cada uno con su hook.
function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <FoundationsProvider>
            <PetsProvider>
              <CampaignsProvider>
                <DonationsProvider>
                  <AdoptionsProvider>
                    <ReportsProvider>
                      <FavoritesProvider>
                        <StoriesProvider>
                          <AdminLogProvider>
                            <ScrollToTop />
                            <AppRoutes />
                          </AdminLogProvider>
                        </StoriesProvider>
                      </FavoritesProvider>
                    </ReportsProvider>
                  </AdoptionsProvider>
                </DonationsProvider>
              </CampaignsProvider>
            </PetsProvider>
          </FoundationsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
