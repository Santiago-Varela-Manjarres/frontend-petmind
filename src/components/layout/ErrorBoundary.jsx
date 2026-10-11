import { Component } from 'react'
import { clearPersistentState } from '../../hooks/usePersistentState'
import styles from '../../views/NoEncontrada.module.css'

// Atrapa los errores de render de cualquier pantalla para mostrar un mensaje en lugar de dejar
// la app en blanco. Tiene que ser un componente de clase: React no ofrece esto con hooks.
// Vive fuera del router y de los contextos, por eso usa <a> y no <Link>.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Queda en la consola para depurar; aquí iría un servicio de monitoreo en producción.
    console.error('Error en la interfaz de PetMind:', error, info.componentStack)
  }

  // Los datos de la demo viven en localStorage: si quedaron dañados, reiniciarlos suele resolverlo.
  resetDemo = () => {
    clearPersistentState()
    window.location.assign('/')
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <section className={`container ${styles.page}`} role="alert">
        <title>Algo salió mal | PetMind</title>
        <span className="eyebrow">Error inesperado</span>
        <h1>Algo salió mal</h1>
        <p>Tuvimos un problema al mostrar esta página. Puedes volver a intentarlo o reiniciar los datos de la demo.</p>
        <div className={styles.actions}>
          <a className="btn btn-primary" href="/">
            Ir al inicio
          </a>
          <button className="btn btn-secondary" type="button" onClick={this.resetDemo}>
            Reiniciar datos de la demo
          </button>
        </div>
      </section>
    )
  }
}
