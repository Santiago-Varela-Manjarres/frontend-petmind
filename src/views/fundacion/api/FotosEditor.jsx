import { useId, useState } from 'react'
import Icon from '../../../components/ui/Icon'
import { esEnlaceDeFoto, MAX_URL } from '../../../services/archivosService'
import panelStyles from '../Fundacion.module.css'
import styles from './PanelApi.module.css'

// Fotos de una mascota o de una campaña del backend. El servidor guarda el enlace de cada imagen, así que se
// pega un enlace (https://…) o se elige una foto de la galería de PetMind. La primera es la portada.
// max = 1: una sola foto (la portada de una campaña); elegir otra la reemplaza.
export default function FotosEditor({ fotos, onChange, galeria, max = 8, nombre = 'la mascota', error }) {
  const id = useId()
  const [enlace, setEnlace] = useState('')
  const [aviso, setAviso] = useState('')
  const lleno = max > 1 && fotos.length >= max

  function agregar(url) {
    const valor = url.trim()
    if (!esEnlaceDeFoto(valor)) {
      setAviso(
        valor.length > MAX_URL
          ? `El enlace es muy largo (máximo ${MAX_URL} caracteres).`
          : 'Pega el enlace de una imagen publicada en internet: debe empezar por https://',
      )
      return false
    }
    if (fotos.includes(valor)) {
      setAviso('Esa foto ya está agregada.')
      return false
    }
    setAviso('')
    onChange(max === 1 ? [valor] : [...fotos, valor].slice(0, max))
    return true
  }

  function agregarEnlace() {
    if (agregar(enlace)) setEnlace('')
  }

  function hacerPortada(indice) {
    const lista = [...fotos]
    const [foto] = lista.splice(indice, 1)
    onChange([foto, ...lista])
  }

  return (
    <div className={styles.fotos}>
      {fotos.length > 0 && (
        <div className={panelStyles.galleryGrid}>
          {fotos.map((foto, indice) => (
            <figure key={foto}>
              <img src={foto} alt={`Foto ${indice + 1} de ${nombre}`} />
              {indice === 0 && <span>Portada</span>}
              <figcaption>
                {max > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => hacerPortada(indice)} disabled={indice === 0}>
                    Hacer portada
                  </button>
                )}
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Quitar foto ${indice + 1}`}
                  onClick={() => onChange(fotos.filter((_, posicion) => posicion !== indice))}
                >
                  <Icon name="trash" />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className={styles.linkRow}>
        <label className="sr-only" htmlFor={id}>
          Enlace de la foto
        </label>
        <input
          id={id}
          className="input"
          type="text"
          inputMode="url"
          placeholder="https://… (enlace de la foto)"
          value={enlace}
          disabled={lleno}
          onChange={(event) => {
            setEnlace(event.target.value)
            setAviso('')
          }}
          onKeyDown={(event) => {
            // Enter agrega la foto en lugar de enviar el formulario.
            if (event.key === 'Enter') {
              event.preventDefault()
              agregarEnlace()
            }
          }}
        />
        <button type="button" className="btn btn-secondary" onClick={agregarEnlace} disabled={!enlace.trim() || lleno}>
          <Icon name="plus" /> {max === 1 && fotos.length ? 'Cambiar foto' : 'Agregar foto'}
        </button>
      </div>
      {(aviso || error) && (
        <span className="field-error" role="alert">
          {aviso || error}
        </span>
      )}

      <div className={`${panelStyles.galleryChoices} ${styles.choices}`}>
        <strong>O elige una foto de la galería de PetMind</strong>
        {galeria.map((src) => {
          const elegida = fotos.includes(src)
          return (
            <button
              type="button"
              key={src}
              onClick={() => agregar(src)}
              aria-pressed={elegida}
              disabled={elegida || lleno}
              aria-label={`Usar la foto ${src.split('/').at(-1)}`}
            >
              <img src={src} alt="" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
