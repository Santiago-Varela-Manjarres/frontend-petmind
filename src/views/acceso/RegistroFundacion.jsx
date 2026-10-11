import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/ui/Logo'
import Icon from '../../components/ui/Icon'
import { ChipSelect } from '../../components/ui/Controls'
import { Stepper } from '../../components/forms/Steppers'
import { Field, IconInput, SelectInput } from '../../components/forms/Field'
import { PasswordInput, PasswordStrength } from '../../components/forms/PasswordInput'
import { FileChip, FileDropzone } from '../../components/forms/FileDropzone'
import { useAuth } from '../../context/AuthContext'
import { useFoundations } from '../../context/FoundationsContext'
import { cityNames, departmentOf } from '../../data/cities'
import { foundationAnimals } from '../../data/foundations'
import { isValidEmail, onlyDigits } from '../../utils/format'
import { formatFileSize } from '../../utils/files'
import styles from './Acceso.module.css'
import { isValidPassword, PASSWORD_ERROR } from '../../utils/password'

const initialForm = {
  foundationName: '',
  nit: '',
  representative: '',
  city: '',
  email: '',
  phone: '',
  password: '',
  animals: ['Perros', 'Gatos'],
  rut: null,
  chamber: null,
  terms: false,
}

function validate(form, users) {
  const errors = {}
  if (!form.foundationName.trim()) errors.foundationName = 'Escribe el nombre de la fundación.'
  if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d$/.test(form.nit.trim())) errors.nit = 'Formato: 901.234.567-8'
  if (!form.representative.trim()) errors.representative = 'Escribe quién representa la fundación.'
  if (!form.city) errors.city = 'Elige la ciudad.'
  if (!form.email.trim()) errors.email = 'Escribe el correo institucional.'
  else if (!isValidEmail(form.email)) errors.email = 'Revisa el formato del correo.'
  else if (users.some((user) => user.email.toLowerCase() === form.email.trim().toLowerCase())) errors.email = 'Ya existe una cuenta con este correo.'
  const phone = onlyDigits(form.phone)
  if (phone.length < 7 || phone.length > 10) errors.phone = 'Escribe un teléfono de 7 a 10 dígitos.'
  if (!isValidPassword(form.password)) errors.password = PASSWORD_ERROR
  if (form.animals.length === 0) errors.animals = 'Elige al menos un tipo de animal.'
  if (!form.rut) errors.rut = 'Sube el RUT.'
  if (!form.chamber) errors.chamber = 'Sube el certificado de Cámara de comercio.'
  if (!form.terms) errors.terms = 'Debes declarar que la información es verídica.'
  return errors
}

// 01 · Acceso / 04 · Registro paso 2 — Datos de fundación
export default function RegistroFundacion() {
  const { register, users } = useAuth()
  const { addFoundation } = useFoundations()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const setFile = (name, file) => setForm((prev) => ({ ...prev, [name]: file ? { name: file.name, size: file.size } : null }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const newErrors = validate(form, users)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const foundation = addFoundation({
      name: form.foundationName.trim(),
      city: form.city,
      department: departmentOf(form.city),
      animals: form.animals.map((animal) => (animal === 'Animales de granja' ? 'Granja' : animal)),
      about: '',
      contact: { address: '', addressNote: '', phone: form.phone, hours: '', email: form.email.trim(), response: '' },
      documents: [form.rut, form.chamber],
      nit: form.nit,
    })

    const result = register({
      accountType: 'fundacion',
      foundationId: foundation.id,
      name: form.foundationName.trim(),
      lastName: '',
      representative: form.representative.trim(),
      email: form.email,
      phone: onlyDigits(form.phone),
      city: form.city,
      nit: form.nit,
      animals: form.animals,
      password: form.password,
      verified: false,
    })
    if (!result.ok) {
      setErrors({ email: result.error })
      return
    }
    navigate('/registro/verificar')
  }

  return (
    <div className={styles.split}>
      <title>Registra tu fundación | PetMind</title>

      <div className={styles.splitForm}>
        <header className={styles.splitHeader}>
          <Logo />
          <Link className={styles.backLink} to="/registro">
            <Icon name="arrow-left" /> Cambiar tipo de cuenta
          </Link>
        </header>

        <div className={styles.splitBody}>
          <Stepper steps={['Tipo de cuenta', 'Datos de la fundación', 'Verificación']} current={2} />
          <h1 className={`${styles.registerTitle} ${styles.registerTitleBlue}`}>
            Registra tu <span>fundación</span>
          </h1>
          <p className={styles.lead}>Verificamos cada organización para que las personas donen y adopten con confianza.</p>

          <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
            <div className={`form-row ${styles.rowWide}`}>
              <Field label="Nombre de la fundación" htmlFor="fun-name" error={errors.foundationName}>
                <IconInput id="fun-name" icon="building" name="foundationName" placeholder="Fundación Huellitas de Amor" value={form.foundationName} onChange={handleChange} invalid={Boolean(errors.foundationName)} />
              </Field>
              <Field label="NIT" htmlFor="fun-nit" error={errors.nit}>
                <input id="fun-nit" className="input" name="nit" placeholder="901.234.567-8" value={form.nit} onChange={handleChange} aria-invalid={Boolean(errors.nit) || undefined} />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Representante legal" htmlFor="fun-rep" error={errors.representative}>
                <input id="fun-rep" className="input" name="representative" placeholder="Nombre completo" value={form.representative} onChange={handleChange} aria-invalid={Boolean(errors.representative) || undefined} />
              </Field>
              <Field label="Ciudad" htmlFor="fun-city" error={errors.city}>
                <SelectInput id="fun-city" icon="map-pin" name="city" value={form.city} onChange={handleChange} invalid={Boolean(errors.city)}>
                  <option value="">Elige la ciudad</option>
                  {cityNames.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>

            <div className="form-row">
              <Field label="Correo institucional" htmlFor="fun-email" error={errors.email}>
                <IconInput id="fun-email" icon="mail" name="email" type="email" placeholder="contacto@fundacion.org" value={form.email} onChange={handleChange} invalid={Boolean(errors.email)} />
              </Field>
              <Field label="Teléfono" htmlFor="fun-phone" error={errors.phone}>
                <input id="fun-phone" className="input" name="phone" type="tel" inputMode="numeric" placeholder="604 000 0000" value={form.phone} onChange={handleChange} aria-invalid={Boolean(errors.phone) || undefined} />
              </Field>
            </div>

            <Field label="Contraseña de acceso" htmlFor="fun-password" error={errors.password} hint="Con ella entrarás al panel cuando aprobemos la fundación.">
              <PasswordInput id="fun-password" name="password" autoComplete="new-password" placeholder="Mínimo 8, una mayúscula y un símbolo" value={form.password} onChange={handleChange} invalid={Boolean(errors.password)} />
              <PasswordStrength value={form.password} showRules />
            </Field>

            <Field label="¿Qué animales atienden?" error={errors.animals}>
              <ChipSelect options={foundationAnimals} values={form.animals} onChange={(animals) => setForm((prev) => ({ ...prev, animals }))} label="Animales que atienden" />
            </Field>

            <Field label="Documentos legales" error={errors.rut || errors.chamber}>
              <div className={styles.docs}>
                {form.rut ? (
                  <FileChip name={form.rut.name} detail={`${formatFileSize(form.rut.size)} · cargado`} onRemove={() => setFile('rut', null)} />
                ) : (
                  <FileDropzone layout="row" accept=".pdf,image/*" multiple={false} title="RUT" hint="Arrastra o selecciona" onFiles={([file]) => setFile('rut', file)} />
                )}
                {form.chamber ? (
                  <FileChip name={form.chamber.name} detail={`${formatFileSize(form.chamber.size)} · cargado`} onRemove={() => setFile('chamber', null)} />
                ) : (
                  <FileDropzone
                    layout="row"
                    tone="info"
                    accept=".pdf,image/*"
                    multiple={false}
                    title="Cámara de comercio"
                    hint="Arrastra o selecciona"
                    onFiles={([file]) => setFile('chamber', file)}
                  />
                )}
              </div>
            </Field>

            <div className="field">
              <label className="checkbox">
                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} />
                <span>
                  Declaro que la información es verídica y acepto los <Link to="/legal#terminos">Términos para fundaciones</Link>
                </span>
              </label>
              {errors.terms && <span className="field-error">{errors.terms}</span>}
            </div>

            <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`}>
              Enviar para verificación <Icon name="arrow-right" />
            </button>
          </form>
        </div>
      </div>

      <aside className={`${styles.sidePanel} ${styles.sidePanelLight}`}>
        <span className={styles.verifiedCount}>
          <span>
            <Icon name="check" strokeWidth={3} />
          </span>
          86 fundaciones verificadas
        </span>
        <div className={styles.illustrationWrap}>
          <img src="/img/ilustraciones/ilustracion-banner-perro-y-gato.svg" alt="" />
        </div>
        <div className={styles.howCard}>
          <span className="script">Juntos llegamos más lejos</span>
          <h3>Así funciona la verificación</h3>
          <ol className={styles.howSteps}>
            <li>
              <span className={`${styles.howNumber} ${styles.howNumber1}`}>1</span>
              <div>
                <strong>Envías tus datos y documentos</strong>
                <span>RUT y certificado de Cámara de comercio.</span>
              </div>
            </li>
            <li>
              <span className={`${styles.howNumber} ${styles.howNumber2}`}>2</span>
              <div>
                <strong>Revisamos en máximo 48 horas</strong>
                <span>Te avisamos por correo el resultado.</span>
              </div>
            </li>
            <li>
              <span className={`${styles.howNumber} ${styles.howNumber3}`}>3</span>
              <div>
                <strong>Publicas tu primera mascota</strong>
                <span>Y empiezas a recibir solicitudes y donaciones.</span>
              </div>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  )
}
