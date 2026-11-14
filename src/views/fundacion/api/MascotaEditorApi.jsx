import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PetCard from '../../../components/cards/PetCard'
import { Field, SelectInput } from '../../../components/forms/Field'
import { ChipSelect, SegmentedControl } from '../../../components/ui/Controls'
import Icon from '../../../components/ui/Icon'
import { useToast } from '../../../context/ToastContext'
import { ageOptions, personalityOptions } from '../../../data/pets'
import { guardarFotosDeMascota, listarArchivosDeMascota } from '../../../services/archivosService'
import {
  especiesApi,
  estadosAdopcionApi,
  formularioAMascota,
  labelOf,
  mascotaAFormulario,
  mascotaVacia,
  sexosApi,
  tamanosApi,
} from '../../../services/mascotaMapper'
import { actualizarMascota, crearMascota, obtenerMascota } from '../../../services/mascotasService'
import { formatAge } from '../../../utils/dates'
import { galleryChoices } from '../panel/panelData'
import FotosEditor from './FotosEditor'
import panelStyles from '../Fundacion.module.css'
import styles from './PanelApi.module.css'

const MIN_HISTORIA = 100
const MAX_FOTOS = 8
const respuestas = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
  { value: null, label: 'No sé' },
]
const publicaciones = [
  { value: 'PUBLICADA', label: 'Publicada' },
  { value: 'PAUSADA', label: 'Pausada' },
  { value: 'BORRADOR', label: 'Borrador' },
]
const localSpecies = { PERRO: 'Perro', GATO: 'Gato' }

// La mascota que se edita y sus fotos. Sin petId es una mascota nueva (status "new").
function useMascotaParaEditar(petId) {
  const [state, setState] = useState({ key: null, status: 'loading', mascota: null, fotos: [] })
  const [attempt, setAttempt] = useState(0)
  const key = petId ? `${petId}-${attempt}` : null

  useEffect(() => {
    if (!key) return undefined
    let active = true
    Promise.all([obtenerMascota(petId), listarArchivosDeMascota(petId).catch(() => [])])
      .then(([mascota, archivos]) => {
        // Solo las imágenes (los videos o documentos de la mascota no se tocan al guardar), con la portada primero.
        const fotos = (Array.isArray(archivos) ? archivos : [])
          .filter((archivo) => archivo.tipoMedio === 'IMAGEN' && archivo.url)
          .sort((a, b) => Number(Boolean(b.esPortada)) - Number(Boolean(a.esPortada)) || (a.orden ?? 0) - (b.orden ?? 0))
        if (active) setState({ key, status: 'success', mascota, fotos })
      })
      .catch((error) => {
        if (active) setState({ key, status: error.status === 404 ? 'not-found' : 'error', mascota: null, fotos: [] })
      })
    return () => {
      active = false
    }
  }, [key, petId])

  const retry = () => setAttempt((value) => value + 1)
  if (!key) return { status: 'new', retry }
  return state.key === key ? { ...state, retry } : { status: 'loading', retry }
}

// Publicar o editar una mascota en el backend (POST o PUT /mascotas y sus fotos en /archivos).
// fundacionId: fundación del representante (fija). Sin él, el administrador la elige en `fundaciones`.
// onSaved(mascota, { nueva, fotosGuardadas }) se llama después de guardar.
export default function MascotaEditorApi({ petId = null, fundacionId = null, fundaciones = null, ciudadFundacion = '', backTo, onSaved }) {
  const loaded = useMascotaParaEditar(petId)

  if (loaded.status === 'loading') return <p className={styles.status} role="status">Cargando la mascota…</p>
  if (loaded.status === 'not-found') return <Aviso texto="No encontramos esta mascota. Puede que la hayan eliminado." backTo={backTo} />
  if (loaded.status === 'error') {
    return (
      <div className="alert alert-error" role="alert">
        <Icon name="alert-circle" /> No pudimos cargar la mascota.
        <button type="button" className="btn btn-secondary btn-sm" onClick={loaded.retry}>
          Reintentar
        </button>
      </div>
    )
  }
  if (loaded.mascota && fundacionId != null && loaded.mascota.fundacionId !== fundacionId) {
    return <Aviso texto="Esta mascota es de otra fundación: solo la puede editar su fundación." backTo={backTo} />
  }

  return (
    <FormularioMascota
      key={petId ?? 'nueva'}
      anterior={loaded.mascota}
      fotosAnteriores={loaded.fotos ?? []}
      inicial={loaded.mascota ? mascotaAFormulario(loaded.mascota, loaded.fotos) : mascotaVacia(ciudadFundacion)}
      fundacionFija={fundacionId}
      fundaciones={fundaciones}
      backTo={backTo}
      onSaved={onSaved}
    />
  )
}

function Aviso({ texto, backTo }) {
  return (
    <div className={`${styles.card} ${styles.empty}`}>
      <Icon name="paw" />
      <strong>{texto}</strong>
      <Link className="btn btn-secondary btn-sm" to={backTo}>
        Volver a la lista
      </Link>
    </div>
  )
}

function sugerirHistoria(form) {
  const nombre = form.nombre.trim() || 'Esta mascota'
  const rasgos = form.etiquetas.slice(0, 2).map((rasgo) => rasgo.toLowerCase()).join(' y ') || 'cariñosa y sociable'
  const edad = formatAge(Number(form.edadMeses) || 12)
  return `${nombre} es ${rasgos}. Tiene ${edad} y busca una familia responsable que le dé un hogar seguro, tiempo para adaptarse y mucho cariño. Llegó a la fundación hace poco, ya recibió sus cuidados y está lista para conocer a su nueva familia.`
}

function FormularioMascota({ anterior, fotosAnteriores, inicial, fundacionFija, fundaciones, backTo, onSaved }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(inicial)
  const [fundacionId, setFundacionId] = useState(String(anterior?.fundacionId ?? fundacionFija ?? ''))
  const [publicacion, setPublicacion] = useState(anterior?.estadoPublicacion ?? 'PUBLICADA')
  const [errores, setErrores] = useState({})
  const [saving, setSaving] = useState(false)
  const editando = Boolean(anterior)
  const eligeFundacion = Array.isArray(fundaciones)

  function patch(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrores((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function elegirFundacion(value) {
    setFundacionId(value)
    setErrores((prev) => ({ ...prev, fundacion: undefined }))
    // La ciudad de la mascota suele ser la de la fundación: se completa si todavía está vacía.
    const ciudad = fundaciones?.find((item) => String(item.id) === value)?.direccion?.ciudad
    if (ciudad && !form.ciudad.trim()) patch('ciudad', ciudad)
  }

  const historiaLista = form.historia.trim().length >= MIN_HISTORIA
  const datosBasicos = Boolean(form.nombre.trim() && form.ciudad.trim() && form.edadMeses)
  const checks = [
    ['Al menos una foto', form.fotos.length > 0],
    ['Datos básicos completos', datosBasicos],
    [`Historia de ${MIN_HISTORIA}+ caracteres`, historiaLista],
  ]
  const edades = ageOptions.some((item) => String(item.value) === form.edadMeses) || !form.edadMeses
    ? ageOptions
    : [...ageOptions, { value: Number(form.edadMeses), label: formatAge(Number(form.edadMeses)) }].sort((a, b) => a.value - b.value)
  const rasgos = [...new Set([...personalityOptions, ...form.etiquetas])]

  function revisar(publicar) {
    const found = {}
    if (eligeFundacion && !fundacionId) found.fundacion = 'Elige la fundación que publica la mascota.'
    if (!form.nombre.trim()) found.nombre = 'Escribe el nombre.'
    if (form.pesoKg && !Number.isFinite(Number(String(form.pesoKg).replace(',', '.')))) found.pesoKg = 'Escribe el peso en kilos, por ejemplo 12,5.'
    if (publicar) {
      if (!form.fotos.length) found.fotos = 'Agrega al menos una foto.'
      if (!form.ciudad.trim()) found.ciudad = 'Escribe la ciudad donde está la mascota.'
      if (!form.edadMeses) found.edadMeses = 'Elige la edad aproximada.'
      if (!historiaLista) found.historia = `Cuenta su historia con al menos ${MIN_HISTORIA} caracteres.`
    }
    return found
  }

  async function guardar(estadoPublicacion) {
    const found = revisar(estadoPublicacion === 'PUBLICADA')
    setErrores(found)
    if (Object.values(found).some(Boolean)) {
      showToast(estadoPublicacion === 'PUBLICADA' ? 'Para publicar, completa los datos marcados.' : 'Revisa los datos marcados.', { tone: 'error' })
      return
    }
    setSaving(true)
    try {
      const datos = formularioAMascota(form, { fundacionId: Number(fundacionId), estadoPublicacion, anterior })
      const mascota = anterior ? await actualizarMascota(anterior.id, datos) : await crearMascota(datos)
      // La mascota ya quedó guardada: si fallan las fotos se avisa, pero no se pierde lo demás.
      let fotosGuardadas = true
      try {
        await guardarFotosDeMascota(mascota.id, form.fotos, fotosAnteriores)
      } catch {
        fotosGuardadas = false
      }
      setSaving(false)
      onSaved(mascota, { nueva: !anterior, fotosGuardadas })
    } catch (error) {
      setSaving(false)
      showToast(`No pudimos guardar la mascota. ${error.message}`, { tone: 'error' })
    }
  }

  const sexo = labelOf(sexosApi, form.sexo) ?? ''
  const preview = {
    id: 'vista-previa',
    source: 'backend',
    name: form.nombre.trim() || 'Tu mascota',
    species: localSpecies[form.especie] ?? 'Otro',
    sex: sexo,
    ageMonths: form.edadMeses ? Number(form.edadMeses) : null,
    size: labelOf(tamanosApi, form.tamano) ?? '',
    city: form.ciudad.trim(),
    traits: form.etiquetas,
    photo: form.fotos[0] ?? null,
    status: 'Disponible',
    createdAt: anterior?.fechaPublicacion ?? new Date().toISOString(),
  }

  return (
    <div className={panelStyles.editorLayout}>
      <form
        className={panelStyles.editor}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          guardar(editando ? publicacion : 'PUBLICADA')
        }}
      >
        <div className={panelStyles.sectionHead}>
          <div>
            <h2>{editando ? `Editar a ${anterior.nombre}` : 'Publicar una mascota'}</h2>
            <p>Se guarda en el servidor de PetMind: al publicarla aparece en Adoptar y las personas pueden enviar su solicitud.</p>
          </div>
          <Link className="btn btn-ghost btn-sm" to={backTo}>
            Volver
          </Link>
        </div>

        {eligeFundacion && (
          <fieldset className={panelStyles.formSection}>
            <legend>
              <b>0</b> Fundación
            </legend>
            <Field label="¿Qué fundación la publica?" htmlFor="mapi-fundacion" error={errores.fundacion}>
              <SelectInput id="mapi-fundacion" icon="building" value={fundacionId} onChange={(event) => elegirFundacion(event.target.value)} invalid={Boolean(errores.fundacion)}>
                <option value="">Elige una fundación</option>
                {fundaciones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {item.estadoVerificacion === 'VERIFICADA' ? '' : ' · sin verificar'}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </fieldset>
        )}

        <fieldset className={panelStyles.formSection}>
          <legend>
            <b>1</b> Fotos
          </legend>
          <p>Agrega hasta {MAX_FOTOS} fotos con buena luz. La primera es la portada que se ve en Adoptar.</p>
          <FotosEditor
            fotos={form.fotos}
            onChange={(fotos) => patch('fotos', fotos)}
            galeria={galleryChoices}
            max={MAX_FOTOS}
            nombre={form.nombre.trim() || 'la mascota'}
            error={errores.fotos}
          />
        </fieldset>

        <fieldset className={panelStyles.formSection}>
          <legend>
            <b>2</b> Datos básicos
          </legend>
          <div className="form-row">
            <Field label="Nombre" htmlFor="mapi-nombre" error={errores.nombre}>
              <input
                id="mapi-nombre"
                className="input"
                maxLength={100}
                value={form.nombre}
                aria-invalid={Boolean(errores.nombre) || undefined}
                onChange={(event) => patch('nombre', event.target.value)}
              />
            </Field>
            <Field label="Ciudad" htmlFor="mapi-ciudad" error={errores.ciudad}>
              <input
                id="mapi-ciudad"
                className="input"
                maxLength={100}
                value={form.ciudad}
                placeholder="Medellín"
                aria-invalid={Boolean(errores.ciudad) || undefined}
                onChange={(event) => patch('ciudad', event.target.value)}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Especie" htmlFor="mapi-especie">
              <SelectInput id="mapi-especie" value={form.especie} onChange={(event) => patch('especie', event.target.value)}>
                {especiesApi.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Raza" htmlFor="mapi-raza" optional>
              <input
                id="mapi-raza"
                className="input"
                maxLength={100}
                value={form.raza}
                placeholder="Criollo"
                onChange={(event) => patch('raza', event.target.value)}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Edad aproximada" htmlFor="mapi-edad" error={errores.edadMeses}>
              <SelectInput id="mapi-edad" value={form.edadMeses} onChange={(event) => patch('edadMeses', event.target.value)}>
                <option value="">Elige la edad</option>
                {edades.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Tamaño" htmlFor="mapi-tamano">
              <SelectInput id="mapi-tamano" value={form.tamano} onChange={(event) => patch('tamano', event.target.value)}>
                {tamanosApi.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Sexo">
            <SegmentedControl label="Sexo" options={sexosApi} value={form.sexo} onChange={(value) => patch('sexo', value)} variant="buttons" />
          </Field>
          <div className="form-row">
            <Field label="Peso (kg)" htmlFor="mapi-peso" optional error={errores.pesoKg}>
              <input
                id="mapi-peso"
                className="input"
                inputMode="decimal"
                value={form.pesoKg}
                placeholder="12,5"
                onChange={(event) => patch('pesoKg', event.target.value)}
              />
            </Field>
            <Field label="Color del pelaje" htmlFor="mapi-color" optional>
              <input
                id="mapi-color"
                className="input"
                maxLength={50}
                value={form.colorPelaje}
                placeholder="Café con blanco"
                onChange={(event) => patch('colorPelaje', event.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className={panelStyles.formSection}>
          <legend>
            <b>3</b> Salud
          </legend>
          <div className={panelStyles.checks}>
            {[
              ['vacunasAlDia', 'Vacunas al día'],
              ['desparasitado', 'Desparasitado/a'],
              ['esterilizado', 'Esterilizado/a'],
              ['tieneMicrochip', 'Tiene microchip'],
              ['aptoApadrinamiento', 'Se puede apadrinar'],
            ].map(([key, label]) => (
              <label className="checkbox" key={key}>
                <input type="checkbox" checked={form[key]} onChange={(event) => patch(key, event.target.checked)} />
                {label}
              </label>
            ))}
          </div>
          <Field label="Condiciones médicas" htmlFor="mapi-condiciones" optional>
            <textarea
              id="mapi-condiciones"
              className="textarea"
              maxLength={500}
              value={form.condicionesMedicas}
              placeholder="Alergias, enfermedades o tratamientos activos"
              onChange={(event) => patch('condicionesMedicas', event.target.value)}
            />
          </Field>
          <Field label="Cuidados especiales" htmlFor="mapi-cuidados" optional>
            <textarea
              id="mapi-cuidados"
              className="textarea"
              maxLength={500}
              value={form.cuidadosEspeciales}
              placeholder="Cuéntanos si requiere algún cuidado adicional"
              onChange={(event) => patch('cuidadosEspeciales', event.target.value)}
            />
          </Field>
        </fieldset>

        <fieldset className={panelStyles.formSection}>
          <legend>
            <b>4</b> Personalidad e historia
          </legend>
          <ChipSelect label="Rasgos de personalidad" options={rasgos} values={form.etiquetas} onChange={(value) => patch('etiquetas', value)} />
          <div className="form-row">
            {[
              ['conviveNinos', '¿Convive con niños?'],
              ['convivePerros', '¿Convive con perros?'],
              ['conviveGatos', '¿Convive con gatos?'],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <SegmentedControl label={label} options={respuestas} value={form[key]} onChange={(value) => patch(key, value)} variant="buttons" />
              </Field>
            ))}
          </div>
          <Field label="Resumen" htmlFor="mapi-descripcion" optional hint="Una o dos frases que se leen primero en su perfil.">
            <textarea
              id="mapi-descripcion"
              className="textarea"
              maxLength={1000}
              value={form.descripcion}
              placeholder="Ej.: Juguetona, le encantan los paseos largos y dormir al sol."
              onChange={(event) => patch('descripcion', event.target.value)}
            />
          </Field>
          <Field
            label="Su historia"
            htmlFor="mapi-historia"
            error={errores.historia}
            extra={
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => patch('historia', sugerirHistoria(form))}>
                ✦ Sugerir texto
              </button>
            }
          >
            <textarea
              id="mapi-historia"
              className="textarea"
              maxLength={2000}
              value={form.historia}
              placeholder="Cuéntanos cómo llegó a la fundación y qué hogar está buscando"
              aria-invalid={Boolean(errores.historia) || undefined}
              onChange={(event) => patch('historia', event.target.value)}
            />
            <small className={styles.counter}>
              {form.historia.trim().length}/{MIN_HISTORIA} caracteres mínimo para publicar
            </small>
          </Field>
        </fieldset>

        {editando && (
          <fieldset className={panelStyles.formSection}>
            <legend>
              <b>5</b> Estado
            </legend>
            <div className={styles.stateRow}>
              <Field label="Adopción" htmlFor="mapi-estado">
                <SelectInput id="mapi-estado" value={form.estadoAdopcion} onChange={(event) => patch('estadoAdopcion', event.target.value)}>
                  {estadosAdopcionApi.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Publicación">
                <SegmentedControl label="Publicación" options={publicaciones} value={publicacion} onChange={setPublicacion} />
              </Field>
            </div>
            <p className={panelStyles.hint}>En Adoptar solo aparecen las mascotas publicadas y disponibles.</p>
          </fieldset>
        )}

        <div className={panelStyles.formActions}>
          {editando ? (
            <Link className="btn btn-secondary" to={backTo}>
              Cancelar
            </Link>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => guardar('BORRADOR')} disabled={saving}>
              Guardar borrador
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar'}
          </button>
        </div>
      </form>

      <aside className={panelStyles.previewAside}>
        <span className="eyebrow">VISTA PREVIA</span>
        <PetCard preview pet={preview} />
        <section className={`${styles.card} ${styles.checklist}`}>
          <h3>Antes de publicar</h3>
          {checks.map(([label, done]) => (
            <p className={done ? styles.done : ''} key={label}>
              <Icon name={done ? 'check-circle' : 'minus'} />
              {label}
            </p>
          ))}
        </section>
      </aside>
    </div>
  )
}
