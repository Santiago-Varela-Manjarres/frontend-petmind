import PetCard from '../../../components/cards/PetCard'
import { Field, SelectInput } from '../../../components/forms/Field'
import { FileDropzone } from '../../../components/forms/FileDropzone'
import { ChipSelect, SegmentedControl } from '../../../components/ui/Controls'
import Icon from '../../../components/ui/Icon'
import { ageOptions, personalityOptions, sizes, species } from '../../../data/pets'
import { formatAge } from '../../../utils/dates'
import { galleryChoices } from './panelData'
import styles from '../Fundacion.module.css'

// Formulario para publicar o editar una mascota, con vista previa y lista de requisitos.
export default function PetEditor({ value, setValue, foundation, onSave, onCancel }) {
  const patch = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  const gallery = value.gallery || []
  const story = value.story?.[0] || ''
  const checks = [
    gallery.length >= 3,
    Boolean(value.name.trim() && value.city.trim() && value.ageMonths),
    Object.values(value.health || {}).some(Boolean),
    story.trim().length >= 100,
  ]
  function addPhotos(files) {
    patch('gallery', [...gallery, ...files.map((file) => ({ src: file.url, name: file.name }))])
  }
  function setCover(index) {
    const next = [...gallery]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    patch('gallery', next)
    patch('photo', item.src)
  }
  return (
    <div className={styles.editorLayout}>
      <form
        className={styles.editor}
        onSubmit={(event) => {
          event.preventDefault()
          onSave('Disponible')
        }}
      >
        <div className={styles.sectionHead}>
          <div>
            <h2>{value.id ? `Editar a ${value.name}` : 'Publicar una mascota'}</h2>
            <p>Completa cada sección para ayudar a una familia a conocerla.</p>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>
            Volver
          </button>
        </div>
        <fieldset className={styles.formSection}>
          <legend>
            <b>1</b> Fotos y video
          </legend>
          <p>Sube mínimo 3 fotos con buena luz. La primera será la portada.</p>
          {gallery.length > 0 && (
            <div className={styles.galleryGrid}>
              {gallery.map((photo, index) => (
                <figure key={`${photo.src}-${index}`}>
                  <img src={photo.src} alt={`Foto ${index + 1} de ${value.name || 'la mascota'}`} />
                  {index === 0 && <span>Portada</span>}
                  <figcaption>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCover(index)}
                      disabled={index === 0}
                    >
                      Hacer portada
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Quitar foto ${index + 1}`}
                      onClick={() =>
                        patch(
                          'gallery',
                          gallery.filter((_, photoIndex) => photoIndex !== index),
                        )
                      }
                    >
                      <Icon name="trash" />
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          <FileDropzone title="Agregar fotos" hint="Puedes seleccionar varias imágenes" onFiles={addPhotos} />
          <div className={styles.galleryChoices}>
            <strong>O elige una foto de la galería</strong>
            {galleryChoices.map((src) => (
              <button
                type="button"
                key={src}
                onClick={() => {
                  if (!gallery.some((photo) => photo.src === src))
                    addPhotos([{ url: src, name: src.split('/').at(-1) }])
                }}
                aria-label={`Agregar ${src.split('/').at(-1)}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <Field label="Video opcional (enlace)" htmlFor="pet-video">
            <input
              id="pet-video"
              className="input"
              type="url"
              value={value.video || ''}
              onChange={(event) => patch('video', event.target.value)}
              placeholder="https://"
            />
          </Field>
        </fieldset>
        <fieldset className={styles.formSection}>
          <legend>
            <b>2</b> Datos básicos
          </legend>
          <div className="form-row">
            <Field label="Nombre" htmlFor="pet-name">
              <input
                id="pet-name"
                className="input"
                required
                value={value.name}
                onChange={(event) => patch('name', event.target.value)}
              />
            </Field>
            <Field label="Ubicación" htmlFor="pet-city">
              <input
                id="pet-city"
                className="input"
                required
                value={value.city}
                onChange={(event) => patch('city', event.target.value)}
                placeholder={foundation?.city || 'Medellín'}
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Especie" htmlFor="pet-species">
              <SelectInput
                id="pet-species"
                value={value.species}
                onChange={(event) => patch('species', event.target.value)}
              >
                {species.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Edad aproximada" htmlFor="pet-age">
              <SelectInput
                id="pet-age"
                value={value.ageMonths}
                onChange={(event) => patch('ageMonths', event.target.value)}
              >
                {ageOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Tamaño" htmlFor="pet-size">
              <SelectInput id="pet-size" value={value.size} onChange={(event) => patch('size', event.target.value)}>
                {sizes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Sexo">
            <SegmentedControl
              label="Sexo"
              options={['Hembra', 'Macho']}
              value={value.sex}
              onChange={(sex) => patch('sex', sex)}
              variant="buttons"
            />
          </Field>
        </fieldset>
        <fieldset className={styles.formSection}>
          <legend>
            <b>3</b> Salud
          </legend>
          <div className={styles.checks}>
            {[
              ['vaccinated', 'Vacunas al día'],
              ['dewormed', 'Desparasitada'],
              ['sterilized', 'Esterilizada'],
              ['microchip', 'Tiene microchip'],
            ].map(([key, label]) => (
              <label className="checkbox" key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(value.health?.[key])}
                  onChange={(event) => patch('health', { ...value.health, [key]: event.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
          <Field label="Condiciones o cuidados especiales" htmlFor="pet-health-notes">
            <textarea
              id="pet-health-notes"
              className="textarea"
              value={value.healthNotes || ''}
              onChange={(event) => patch('healthNotes', event.target.value)}
              placeholder="Cuéntanos si requiere algún cuidado adicional"
            />
          </Field>
        </fieldset>
        <fieldset className={styles.formSection}>
          <legend>
            <b>4</b> Personalidad e historia
          </legend>
          <div className={styles.toolbar}>
            <strong>¿Cómo es su carácter?</strong>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() =>
                patch('story', [
                  `${value.name || 'Esta mascota'} es ${value.traits?.slice(0, 2).join(' y ') || 'cariñosa y sociable'}. Tiene ${formatAge(Number(value.ageMonths) || 12)} y busca una familia responsable que le ofrezca un hogar seguro, tiempo para adaptarse y mucho cariño. Cuéntanos cómo llegó a la fundación y qué actividades disfruta.`,
                ])
              }
            >
              ✦ Sugerir texto
            </button>
          </div>
          <ChipSelect
            label="Rasgos de personalidad"
            options={personalityOptions}
            values={value.traits || []}
            onChange={(traits) => patch('traits', traits)}
          />
          <div className="form-row">
            {[
              ['goodWithDogs', '¿Convive con perros?'],
              ['goodWithKids', '¿Convive con niños?'],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <SegmentedControl
                  label={label}
                  options={[
                    { value: true, label: 'Sí' },
                    { value: false, label: 'No' },
                    { value: null, label: 'No sé' },
                  ]}
                  value={value[key] ?? null}
                  onChange={(answer) => patch(key, answer)}
                  variant="buttons"
                />
              </Field>
            ))}
          </div>
          <Field label="Su historia" htmlFor="pet-story">
            <textarea
              id="pet-story"
              className="textarea"
              required
              value={story}
              onChange={(event) => patch('story', [event.target.value])}
              placeholder="Cuéntanos cómo llegó y qué hogar está buscando"
            />
            <small>{story.length}/100 caracteres mínimo</small>
          </Field>
        </fieldset>
        <div className={styles.formActions}>
          <button type="button" className="btn btn-secondary" onClick={() => onSave('Borrador')}>
            Guardar borrador
          </button>
          <button type="submit" className="btn btn-primary">
            Publicar
          </button>
        </div>
      </form>
      <aside className={styles.previewAside}>
        <span className="eyebrow">VISTA PREVIA</span>
        <PetCard
          preview
          pet={{
            ...value,
            photo: gallery[0]?.src || value.photo,
            ageMonths: Number(value.ageMonths),
            foundationId: foundation?.id,
            status: 'Disponible',
          }}
        />
        <section className={styles.card}>
          <h3>Antes de publicar</h3>
          {['Al menos 3 fotos', 'Datos básicos completos', 'Información de salud', 'Historia de 100+ caracteres'].map(
            (label, index) => (
              <p className={checks[index] ? styles.checkDone : ''} key={label}>
                <Icon name={checks[index] ? 'check-circle' : 'circle'} />
                {label}
              </p>
            ),
          )}
        </section>
      </aside>
    </div>
  )
}
