import { useState } from 'react'
import { Link } from 'react-router-dom'
import CampaignCard from '../../../components/cards/CampaignCard'
import { Field, SelectInput } from '../../../components/forms/Field'
import { OptionCard } from '../../../components/forms/OptionCard'
import { Toggle } from '../../../components/ui/Controls'
import Icon from '../../../components/ui/Icon'
import { useCampaigns } from '../../../context/CampaignsContext'
import { useToast } from '../../../context/ToastContext'
import { useMascotasBackend } from '../../../hooks/useMascotasBackend'
import { crearPortadaDeCampana } from '../../../services/archivosService'
import { categoriaDe, categoriasCampana } from '../../../services/campanaMapper'
import { crearCampana, crearGasto } from '../../../services/campanasService'
import { fromDateInput, toDateInput } from '../../../utils/dates'
import { formatCOP, initials } from '../../../utils/format'
import FotosEditor from './FotosEditor'
import panelStyles from '../Fundacion.module.css'
import styles from './PanelApi.module.css'

const DAY = 86_400_000
const MIN_HISTORIA = 40
const galeria = [
  '/img/fotos/historia-rocky-antes-del-rescate.jpg',
  '/img/fotos/portada-mujer-abrazando-perro.jpg',
  '/img/fotos/mascota-luna-perra.jpg',
  '/img/fotos/mascota-simon-gato.jpg',
  '/img/fotos/mascota-max-perro.jpg',
  '/img/fotos/mascota-nala-gata.jpg',
  '/img/fotos/miniatura-video-pequenos-gestos.jpg',
]

function campanaVacia() {
  return {
    categoria: 'SALUD',
    titulo: '',
    mascotaId: '',
    fotos: [],
    descripcion: '',
    fechaFin: '',
    gastos: [{ concepto: '', monto: '' }],
    urgente: false,
  }
}

const monto = (valor) => Number(String(valor ?? '').replace(/\D/g, '')) || 0

// Crear una campaña de donación en el backend: POST /campanas-donacion, sus gastos en /gastos-campana y la
// portada en /archivos. El backend la deja ACTIVA: sale en Donar en cuanto se guarda.
// fundacionId: la del representante (fija). Sin él, el administrador la elige en `fundaciones`.
// onSaved(campana, { gastosGuardados, portadaGuardada }) se llama después de guardar.
export default function CampanaEditorApi({ fundacionId = null, fundaciones = null, nombreFundacion = '', backTo, onSaved }) {
  const { showToast } = useToast()
  const { loadApiCampaigns } = useCampaigns()
  const [form, setForm] = useState(campanaVacia)
  const [elegida, setElegida] = useState(fundacionId == null ? '' : String(fundacionId))
  const [errores, setErrores] = useState({})
  const [saving, setSaving] = useState(false)
  const [hoy] = useState(() => new Date())
  const eligeFundacion = Array.isArray(fundaciones)
  // Las mascotas de la fundación elegida, para relacionar la campaña con una de ellas.
  const mascotas = useMascotasBackend({ fundacionId: elegida ? Number(elegida) : null, enabled: Boolean(elegida) })
  const opcionesMascota = mascotas.pets.filter((pet) => pet.raw.estadoAdopcion !== 'ADOPTADO').sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const mascota = mascotas.pets.find((pet) => pet.id === form.mascotaId)
  const fundacion = eligeFundacion ? fundaciones.find((item) => String(item.id) === elegida) : null
  const nombre = fundacion?.nombre ?? nombreFundacion
  const gastosValidos = form.gastos.filter((gasto) => gasto.concepto.trim() && monto(gasto.monto) > 0)
  const meta = gastosValidos.reduce((total, gasto) => total + monto(gasto.monto), 0)
  const portada = form.fotos[0] ?? mascota?.photo ?? ''
  const manana = toDateInput(new Date(hoy.getTime() + DAY))

  function patch(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrores((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function cambiarGasto(indice, key, value) {
    patch(
      'gastos',
      form.gastos.map((gasto, posicion) => (posicion === indice ? { ...gasto, [key]: value } : gasto)),
    )
  }

  function revisar() {
    const found = {}
    if (eligeFundacion && !elegida) found.fundacion = 'Elige la fundación que crea la campaña.'
    if (!form.titulo.trim()) found.titulo = 'Escribe el título.'
    if (form.descripcion.trim().length < MIN_HISTORIA) found.descripcion = `Cuenta la historia con al menos ${MIN_HISTORIA} caracteres.`
    if (!gastosValidos.length) found.gastos = 'Agrega al menos un gasto con concepto y monto.'
    if (!form.fechaFin || form.fechaFin < manana) found.fechaFin = 'Elige una fecha de cierre a partir de mañana.'
    if (!portada) found.fotos = 'Agrega una foto de portada o relaciona una mascota que tenga foto.'
    return found
  }

  async function guardar() {
    const found = revisar()
    setErrores(found)
    if (Object.values(found).some(Boolean)) {
      showToast('Para publicar la campaña, completa los datos marcados.', { tone: 'error' })
      return
    }
    setSaving(true)
    let campana
    try {
      campana = await crearCampana({
        fundacionId: Number(elegida),
        mascotaId: form.mascotaId ? Number(form.mascotaId) : null,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        categoria: form.categoria,
        metaMonto: meta,
        fechaInicio: toDateInput(new Date()),
        fechaFin: form.fechaFin,
        esUrgente: form.urgente,
      })
    } catch (error) {
      setSaving(false)
      showToast(`No pudimos crear la campaña. ${error.message}`, { tone: 'error' })
      return
    }
    // La campaña ya existe: si fallan los gastos o la portada se avisa, pero no se pierde.
    // Los gastos y la portada no dependen entre sí: se envían a la vez.
    const [gastos, portadaResultado] = await Promise.all([
      Promise.allSettled(
        gastosValidos.map((gasto, indice) =>
          crearGasto({ campanaId: campana.id, concepto: gasto.concepto.trim(), monto: monto(gasto.monto), orden: indice + 1 }),
        ),
      ),
      form.fotos[0] ? crearPortadaDeCampana(campana.id, form.fotos[0]).then(() => true, () => false) : true,
    ])
    const gastosGuardados = gastos.every((resultado) => resultado.status === 'fulfilled')
    const portadaGuardada = portadaResultado
    // Donar y los paneles leen la lista actualizada.
    await loadApiCampaigns({ force: true })
    setSaving(false)
    onSaved(campana, { gastosGuardados, portadaGuardada })
  }

  const categoria = categoriaDe(form.categoria)
  const preview = {
    id: 'vista-previa',
    title: form.titulo.trim() || 'Título de la campaña',
    photo: portada,
    category: categoria.publica,
    urgent: form.urgente,
    foundation: nombre ? { name: nombre, initials: initials(nombre), color: 'primary', verified: fundacion ? fundacion.estadoVerificacion === 'VERIFICADA' : true } : null,
    raised: 0,
    donors: 0,
    endDate: form.fechaFin ? fromDateInput(form.fechaFin) : new Date(hoy.getTime() + 30 * DAY).toISOString(),
    expenses: [{ concept: 'Meta', amount: meta }],
  }

  return (
    <div className={panelStyles.editorLayout}>
      <form
        className={panelStyles.editor}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          guardar()
        }}
      >
        <div className={panelStyles.sectionHead}>
          <div>
            <h2>Crear una campaña</h2>
            <p>Se guarda en el servidor de PetMind y aparece en Donar en cuanto la publicas.</p>
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
            <Field label="¿Qué fundación crea la campaña?" htmlFor="capi-fundacion" error={errores.fundacion}>
              <SelectInput
                id="capi-fundacion"
                icon="building"
                value={elegida}
                invalid={Boolean(errores.fundacion)}
                onChange={(event) => {
                  setElegida(event.target.value)
                  patch('mascotaId', '')
                  setErrores((prev) => ({ ...prev, fundacion: undefined }))
                }}
              >
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
            <b>1</b> ¿Para qué es la campaña?
          </legend>
          <div className={panelStyles.categoryGrid}>
            {categoriasCampana.map((item) => (
              <OptionCard
                key={item.value}
                name="capi-categoria"
                value={item.value}
                checked={form.categoria === item.value}
                onChange={(value) => patch('categoria', value)}
                icon={item.icon}
                title={item.label}
                layout="center"
                tone="accent"
              />
            ))}
          </div>
          <Field label="Título de la campaña" htmlFor="capi-titulo" error={errores.titulo}>
            <input
              id="capi-titulo"
              className="input"
              maxLength={150}
              value={form.titulo}
              placeholder="Ej.: Cirugía de cadera para Bruno"
              aria-invalid={Boolean(errores.titulo) || undefined}
              onChange={(event) => patch('titulo', event.target.value)}
            />
          </Field>
          <Field
            label="Mascota relacionada"
            htmlFor="capi-mascota"
            optional
            hint={elegida ? (mascotas.status === 'loading' ? 'Cargando las mascotas de la fundación…' : undefined) : 'Primero elige la fundación.'}
          >
            <SelectInput
              id="capi-mascota"
              value={form.mascotaId}
              disabled={!elegida}
              onChange={(event) => {
                patch('mascotaId', event.target.value)
                // La foto de la mascota sirve de portada: el aviso de "falta la foto" ya no aplica.
                if (mascotas.pets.find((pet) => pet.id === event.target.value)?.photo) setErrores((prev) => ({ ...prev, fotos: undefined }))
              }}
            >
              <option value="">Varias mascotas</option>
              {opcionesMascota.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Cuenta la historia" htmlFor="capi-historia" error={errores.descripcion}>
            <textarea
              id="capi-historia"
              className="textarea"
              maxLength={1000}
              value={form.descripcion}
              placeholder="¿Qué pasó y en qué se utilizarán los aportes?"
              aria-invalid={Boolean(errores.descripcion) || undefined}
              onChange={(event) => patch('descripcion', event.target.value)}
            />
            <small className={styles.counter}>{form.descripcion.trim().length}/1000 caracteres</small>
          </Field>
          <Toggle label="Es urgente" description="Sale primero en Donar con la etiqueta «Urgente»." checked={form.urgente} onChange={(value) => patch('urgente', value)} />
        </fieldset>

        <fieldset className={panelStyles.formSection}>
          <legend>
            <b>2</b> Foto de portada
          </legend>
          <p>{mascota?.photo ? `Si no eliges otra, se usa la foto de ${mascota.name}.` : 'Es la imagen que se ve en la tarjeta de la campaña.'}</p>
          <FotosEditor fotos={form.fotos} onChange={(fotos) => patch('fotos', fotos)} galeria={galeria} max={1} nombre="la campaña" error={errores.fotos} />
        </fieldset>

        <fieldset className={panelStyles.formSection}>
          <legend>
            <b>3</b> Meta y uso del dinero
          </legend>
          <div className="form-row">
            <Field label="Fecha de cierre" htmlFor="capi-cierre" error={errores.fechaFin}>
              <input
                id="capi-cierre"
                className="input"
                type="date"
                min={manana}
                value={form.fechaFin}
                aria-invalid={Boolean(errores.fechaFin) || undefined}
                onChange={(event) => patch('fechaFin', event.target.value)}
              />
            </Field>
            <Field label="Meta total">
              <input className="input" readOnly value={formatCOP(meta)} aria-label="Meta total calculada" />
            </Field>
          </div>
          <p className={panelStyles.hint}>La meta es la suma de los gastos.</p>
          {form.gastos.map((gasto, indice) => (
            <div className={panelStyles.expenseRow} key={indice}>
              <Field label={`Concepto ${indice + 1}`} htmlFor={`capi-concepto-${indice}`}>
                <input
                  id={`capi-concepto-${indice}`}
                  className="input"
                  maxLength={250}
                  value={gasto.concepto}
                  placeholder="Ej.: Medicamentos"
                  onChange={(event) => cambiarGasto(indice, 'concepto', event.target.value)}
                />
              </Field>
              <Field label="Monto" htmlFor={`capi-monto-${indice}`}>
                <input
                  id={`capi-monto-${indice}`}
                  className="input"
                  inputMode="numeric"
                  value={gasto.monto}
                  placeholder="$0"
                  onChange={(event) => cambiarGasto(indice, 'monto', event.target.value.replace(/\D/g, ''))}
                />
              </Field>
              <button
                className="icon-btn"
                type="button"
                aria-label={`Quitar el gasto ${indice + 1}`}
                disabled={form.gastos.length === 1}
                onClick={() => patch('gastos', form.gastos.filter((_, posicion) => posicion !== indice))}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
          {errores.gastos && (
            <span className={`field-error ${styles.formError}`} role="alert">
              {errores.gastos}
            </span>
          )}
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => patch('gastos', [...form.gastos, { concepto: '', monto: '' }])}>
            <Icon name="plus" />
            Agregar gasto
          </button>
          <div className={panelStyles.totalRow}>
            <strong>Total de la meta</strong>
            <strong>{formatCOP(meta)}</strong>
          </div>
        </fieldset>

        <div className={panelStyles.formActions}>
          <Link className="btn btn-secondary" to={backTo}>
            Cancelar
          </Link>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? 'Publicando…' : 'Publicar campaña'}
          </button>
        </div>
      </form>

      <aside className={panelStyles.previewAside}>
        <span className="eyebrow">VISTA PREVIA</span>
        <CampaignCard preview campaign={preview} />
        <section className={`${styles.card} ${panelStyles.reviewNote}`}>
          <strong>Se publica de inmediato</strong>
          <p>
            La campaña queda activa en Donar hasta la fecha de cierre. Usa la historia para contar con claridad en qué se usará
            cada peso.
          </p>
        </section>
      </aside>
    </div>
  )
}
