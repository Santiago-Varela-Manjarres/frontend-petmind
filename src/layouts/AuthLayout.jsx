import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import styles from './AuthLayout.module.css'
import PageLoader from '../components/layout/PageLoader'

// Acceso (01): cada pantalla trae su propia barra superior (logo + enlace), como en los mockups.
const AuthLayout = () => {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        {/* Las pantallas se cargan bajo demanda: el menú se queda visible mientras llegan. */}
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export default AuthLayout
