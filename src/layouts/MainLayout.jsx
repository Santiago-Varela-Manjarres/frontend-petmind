import { Suspense } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { Outlet } from 'react-router-dom'
import PageLoader from '../components/layout/PageLoader'

const MainLayout = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content" id="contenido">
        {/* Las pantallas se cargan bajo demanda: el menú se queda visible mientras llegan. */}
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
