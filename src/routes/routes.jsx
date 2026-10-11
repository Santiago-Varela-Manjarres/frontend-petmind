import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import Inicio from '../views/Inicio'
import DonarMonto from '../views/donaciones/DonarMonto'
import DonarDatos from '../views/donaciones/DonarDatos'
import DonarPago from '../views/donaciones/DonarPago'
import CheckoutLayout from '../layouts/CheckoutLayout'
import NoEncontrada from '../views/NoEncontrada'
import RequireAuth from './RequireAuth'
import DashboardLayout from '../layouts/DashboardLayout'

// Carga diferida (code splitting): cada pantalla baja su código solo cuando se visita.
// Inicio, la página 404 y los pasos del flujo de donación se cargan de una vez porque se usan
// desde el primer momento o entre pasos seguidos. Los layouts muestran <PageLoader /> mientras tanto.
const Login = lazy(() => import('../views/acceso/Login'))
const Registro = lazy(() => import('../views/acceso/Registro'))
const RegistroPersona = lazy(() => import('../views/acceso/RegistroPersona'))
const RegistroFundacion = lazy(() => import('../views/acceso/RegistroFundacion'))
const VerificarCorreo = lazy(() => import('../views/acceso/VerificarCorreo'))
const RecuperarContrasena = lazy(() => import('../views/acceso/RecuperarContrasena'))
const EnlaceEnviado = lazy(() => import('../views/acceso/EnlaceEnviado'))
const NuevaContrasena = lazy(() => import('../views/acceso/NuevaContrasena'))
const ContrasenaActualizada = lazy(() => import('../views/acceso/ContrasenaActualizada'))
const Adoptar = lazy(() => import('../views/adopcion/Adoptar'))
const PerfilDeLaMascota = lazy(() => import('../views/adopcion/PerfilDeLaMascota'))
const SolicitudAdopcion = lazy(() => import('../views/adopcion/SolicitudAdopcion'))
const SolicitudEnviada = lazy(() => import('../views/adopcion/SolicitudEnviada'))
const SeguimientoSolicitud = lazy(() => import('../views/adopcion/SeguimientoSolicitud'))
const Donar = lazy(() => import('../views/donaciones/Donar'))
const DetallesCampana = lazy(() => import('../views/donaciones/DetallesCampana'))
const DonarFlujo = lazy(() => import('../views/donaciones/DonarFlujo'))
const DonacionExitosa = lazy(() => import('../views/donaciones/DonacionExitosa'))
const Legal = lazy(() => import('../views/institucional/Legal'))
const DirectorioFundaciones = lazy(() => import('../views/fundaciones/DirectorioFundaciones'))
const PerfilFundacion = lazy(() => import('../views/fundaciones/PerfilFundacion'))
const ListaHistorias = lazy(() => import('../views/historias/ListaHistorias'))
const DetalleHistoria = lazy(() => import('../views/historias/DetalleHistoria'))
const Nosotros = lazy(() => import('../views/institucional/Nosotros'))
const Contacto = lazy(() => import('../views/institucional/Contacto'))
const Reportar = lazy(() => import('../views/institucional/Reportar'))
const ReporteEnviado = lazy(() => import('../views/institucional/ReporteEnviado'))
const PanelCuenta = lazy(() => import('../views/cuenta/PanelCuenta'))
const PanelFundacion = lazy(() => import('../views/fundacion/PanelFundacion'))

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Inicio />} />

        {/* 02 · Adopción */}
        <Route path="/adoptar" element={<Adoptar />} />
        <Route path="/adoptar/:id" element={<PerfilDeLaMascota />} />
        <Route element={<RequireAuth role="persona" />}>
          <Route path="/adoptar/:id/solicitud" element={<SolicitudAdopcion />} />
          <Route path="/cuenta/solicitudes/:id" element={<SeguimientoSolicitud />} />
          <Route path="/cuenta/solicitudes/:id/enviada" element={<SolicitudEnviada />} />
        </Route>

        {/* 03 · Donaciones */}
        <Route path="/donar" element={<Donar />} />
        <Route path="/donar/:id" element={<DetallesCampana />} />
        <Route path="/donar/gracias/:id" element={<DonacionExitosa />} />
        <Route path="/fundaciones" element={<DirectorioFundaciones />} />
        <Route path="/fundaciones/:id" element={<PerfilFundacion />} />
        <Route path="/historias" element={<ListaHistorias />} />
        <Route path="/historias/:id" element={<DetalleHistoria />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/reportar" element={<Reportar />} />
        <Route path="/reportar/enviado/:id" element={<ReporteEnviado />} />

        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>

      {/* 03 · Donaciones: los 3 pasos van sin menú, solo con "Salir sin donar" */}
      <Route element={<CheckoutLayout />}>
        <Route path="/donar/:id/aportar" element={<DonarFlujo />}>
          <Route index element={<DonarMonto />} />
          <Route path="datos" element={<DonarDatos />} />
          <Route path="pago" element={<DonarPago />} />
        </Route>
      </Route>

      <Route element={<RequireAuth role="persona" />}>
        <Route element={<DashboardLayout />}>
          <Route path="/cuenta" element={<PanelCuenta />} />
          <Route path="/cuenta/solicitudes" element={<PanelCuenta />} />
          <Route path="/cuenta/favoritos" element={<PanelCuenta />} />
          <Route path="/cuenta/donaciones" element={<PanelCuenta />} />
          <Route path="/cuenta/reportes" element={<PanelCuenta />} />
          <Route path="/cuenta/mensajes" element={<PanelCuenta />} />
          <Route path="/cuenta/perfil" element={<PanelCuenta />} />
        </Route>
      </Route>
      <Route element={<RequireAuth role="fundacion" />}>
        <Route element={<DashboardLayout variant="fundacion" />}>
          <Route path="/fundacion" element={<PanelFundacion />} />
          <Route path="/fundacion/mascotas" element={<PanelFundacion />} />
          <Route path="/fundacion/mascotas/nueva" element={<PanelFundacion />} />
          <Route path="/fundacion/mascotas/:petId/editar" element={<PanelFundacion />} />
          <Route path="/fundacion/solicitudes" element={<PanelFundacion />} />
          <Route path="/fundacion/solicitudes/:id" element={<PanelFundacion />} />
          <Route path="/fundacion/campanas" element={<PanelFundacion />} />
          <Route path="/fundacion/campanas/nueva" element={<PanelFundacion />} />
          <Route path="/fundacion/campanas/:campaignId/editar" element={<PanelFundacion />} />
          <Route path="/fundacion/donaciones" element={<PanelFundacion />} />
          <Route path="/fundacion/reportes" element={<PanelFundacion />} />
          <Route path="/fundacion/mensajes" element={<PanelFundacion />} />
          <Route path="/fundacion/equipo" element={<PanelFundacion />} />
          <Route path="/fundacion/documentos" element={<PanelFundacion />} />
        </Route>
      </Route>

      {/* 01 · Acceso */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/registro/persona" element={<RegistroPersona />} />
        <Route path="/registro/fundacion" element={<RegistroFundacion />} />
        <Route path="/registro/verificar" element={<VerificarCorreo />} />
        <Route path="/recuperar" element={<RecuperarContrasena />} />
        <Route path="/recuperar/enviado" element={<EnlaceEnviado />} />
        <Route path="/recuperar/nueva" element={<NuevaContrasena />} />
        <Route path="/recuperar/listo" element={<ContrasenaActualizada />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
