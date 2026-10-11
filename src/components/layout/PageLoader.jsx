// Se muestra mientras llega el código de una pantalla que se carga bajo demanda (React.lazy).
export default function PageLoader() {
  return (
    <div className="container page" role="status" aria-live="polite">
      Cargando…
    </div>
  )
}
