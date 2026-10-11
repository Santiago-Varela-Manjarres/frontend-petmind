import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { SegmentedControl } from '../../components/ui/Controls'
import { Field, IconInput, SelectInput } from '../../components/forms/Field'
import { useAuth } from '../../context/AuthContext'
import { useDonations } from '../../context/DonationsContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { banks, paymentMethods } from '../../data/donations'
import { campaignGoal } from '../../data/campaigns'
import { formatCOP, onlyDigits } from '../../utils/format'
import { cardBrand, DECLINED_TEST_CARD, formatCardNumber, formatExpiry, isValidCardNumber, isValidExpiry } from '../../utils/payment'
import styles from './DonarFlujo.module.css'

const emptyPayment = { cardNumber: '', expiry: '', cvv: '', holder: '', bank: '', personType: 'natural', wallet: 'Nequi', walletPhone: '' }

function validate(method, payment) {
  const errors = {}
  if (method === 'tarjeta') {
    if (!isValidCardNumber(payment.cardNumber)) errors.cardNumber = 'Revisa el número de la tarjeta.'
    if (!isValidExpiry(payment.expiry)) errors.expiry = 'Fecha inválida o vencida (MM/AA).'
    const cvvLength = cardBrand(payment.cardNumber) === 'AMEX' ? 4 : 3
    if (onlyDigits(payment.cvv).length !== cvvLength) errors.cvv = `El CVV tiene ${cvvLength} dígitos.`
    if (payment.holder.trim().length < 4) errors.holder = 'Escribe el nombre como aparece en la tarjeta.'
  }
  if (method === 'pse' && !payment.bank) errors.bank = 'Elige tu banco.'
  if (method === 'billetera' && onlyDigits(payment.walletPhone).length !== 10) errors.walletPhone = 'Escribe el celular de tu billetera (10 dígitos).'
  return errors
}

// 03 · Donaciones / 05 · Donar paso 3 — Método de pago
export default function DonarPago() {
  const { campaign, foundation, draft, update, amount, fee, total, monthly, sponsoredPet } = useOutletContext()
  const { user } = useAuth()
  const { addDonation } = useDonations()
  const { registerDonation } = useCampaigns()
  const navigate = useNavigate()
  const [payment, setPayment] = useState(emptyPayment)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [declined, setDeclined] = useState(false)
  const paymentTimer = useRef(null)

  // Si la persona sale ("Salir sin donar", atrás) mientras se procesa el pago, se cancela:
  // antes la donación se registraba igual y la app saltaba a la página de agradecimiento.
  useEffect(() => () => window.clearTimeout(paymentTimer.current), [])

  if (!draft.stepOneDone) return <Navigate to=".." relative="path" replace />
  if (!draft.stepTwoDone) return <Navigate to="../datos" relative="path" replace />

  // Las donaciones mensuales solo se pueden con tarjeta.
  const method = monthly ? 'tarjeta' : draft.method

  function setField(field, value) {
    setPayment((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setDeclined(false)
  }

  function methodLabel() {
    if (method === 'tarjeta') return `Tarjeta •••• ${onlyDigits(payment.cardNumber).slice(-4)}`
    if (method === 'pse') return `PSE · ${payment.bank}`
    return payment.wallet
  }

  function handleSubmit(event) {
    event.preventDefault()
    const newErrors = validate(method, payment)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setStatus('processing')
    paymentTimer.current = window.setTimeout(() => {
      const rejected = method === 'tarjeta' && onlyDigits(payment.cardNumber) === DECLINED_TEST_CARD
      const donation = addDonation({
        campaignId: campaign.id,
        forPetId: sponsoredPet?.id ?? null,
        userId: user?.accountType === 'persona' ? user.id : null,
        donorName: `${draft.name} ${draft.lastName}`.trim(),
        email: draft.email.trim(),
        phone: onlyDigits(draft.phone),
        document: `${draft.docType} ${draft.docNumber}`,
        company: draft.company ? { name: draft.companyName, nit: draft.companyNit } : null,
        amount,
        fee,
        total,
        frequency: draft.frequency,
        method,
        methodLabel: methodLabel(),
        status: rejected ? 'rechazada' : 'aprobada',
        anonymous: draft.anonymous,
        showName: draft.showName && !draft.anonymous,
        message: draft.message.trim(),
        wantsUpdates: draft.updates,
        raisedBefore: campaign.raised,
        donorsBefore: campaign.donors,
        goal: campaignGoal(campaign),
        foundationName: foundation?.name ?? 'PetMind',
      })

      if (rejected) {
        setStatus('idle')
        setDeclined(true)
        return
      }
      registerDonation(campaign.id, amount)
      navigate(`/donar/gracias/${donation.id}`, { replace: true })
    }, 1200)
  }

  const brand = cardBrand(payment.cardNumber)

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div>
        <h1 className={styles.title}>Método de pago</h1>
        <p className={styles.lead}>Tu información de pago se procesa de forma cifrada. PetMind no guarda los datos de tu tarjeta.</p>
      </div>

      {declined && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert-circle" />
          <span>Tu banco rechazó el pago. No se hizo ningún cobro. Prueba con otra tarjeta u otro método.</span>
        </div>
      )}

      <div className={styles.methods} role="radiogroup" aria-label="Método de pago">
        {paymentMethods.map((option) => {
          const disabled = monthly && option.oneTimeOnly
          const selected = method === option.value
          return (
            <div key={option.value} className={`${styles.method} ${selected ? styles.methodActive : ''} ${disabled ? styles.methodDisabled : ''}`}>
              <label className={styles.methodHeader}>
                <input
                  type="radio"
                  className="sr-only"
                  name="method"
                  value={option.value}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => {
                    update({ method: option.value })
                    setErrors({})
                    setDeclined(false)
                  }}
                />
                <span className={styles.radio} aria-hidden="true" />
                <span className={styles.methodText}>
                  <strong>{option.label}</strong>
                  <small>{option.note}</small>
                </span>
                <span className={styles.brands}>
                  {option.brands.map((item) => (
                    <span key={item} className={`${styles.brand} ${brand === item ? styles.brandActive : ''}`}>
                      {item}
                    </span>
                  ))}
                </span>
              </label>

              {selected && option.value === 'tarjeta' && (
                <div className={styles.methodBody}>
                  <Field label="Número de la tarjeta" htmlFor="card-number" error={errors.cardNumber}>
                    <IconInput
                      id="card-number"
                      icon="credit-card"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      value={payment.cardNumber}
                      onChange={(event) => setField('cardNumber', formatCardNumber(event.target.value))}
                      invalid={Boolean(errors.cardNumber)}
                    />
                  </Field>
                  <div className="form-row">
                    <Field label="Vencimiento" htmlFor="card-expiry" error={errors.expiry}>
                      <input
                        id="card-expiry"
                        className="input"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM / AA"
                        value={payment.expiry}
                        onChange={(event) => setField('expiry', formatExpiry(event.target.value))}
                        aria-invalid={Boolean(errors.expiry) || undefined}
                      />
                    </Field>
                    <Field label="CVV" htmlFor="card-cvv" error={errors.cvv}>
                      <IconInput
                        id="card-cvv"
                        icon="lock"
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="•••"
                        maxLength={4}
                        value={payment.cvv}
                        onChange={(event) => setField('cvv', onlyDigits(event.target.value))}
                        invalid={Boolean(errors.cvv)}
                      />
                    </Field>
                  </div>
                  <Field label="Nombre en la tarjeta" htmlFor="card-holder" error={errors.holder}>
                    <input
                      id="card-holder"
                      className="input"
                      autoComplete="cc-name"
                      placeholder="Como aparece en la tarjeta"
                      value={payment.holder}
                      onChange={(event) => setField('holder', event.target.value.toUpperCase())}
                      aria-invalid={Boolean(errors.holder) || undefined}
                    />
                  </Field>
                  <p className={styles.testHint}>Demo: usa 4242 4242 4242 4242 (aprobada) o 4000 0000 0000 0002 (rechazada), con cualquier fecha futura.</p>
                </div>
              )}

              {selected && option.value === 'pse' && (
                <div className={styles.methodBody}>
                  <div className="form-row">
                    <Field label="Banco" htmlFor="pse-bank" error={errors.bank}>
                      <SelectInput id="pse-bank" value={payment.bank} onChange={(event) => setField('bank', event.target.value)} invalid={Boolean(errors.bank)}>
                        <option value="">Elige tu banco</option>
                        {banks.map((bank) => (
                          <option key={bank}>{bank}</option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Tipo de persona">
                      <SegmentedControl
                        label="Tipo de persona"
                        options={[
                          { value: 'natural', label: 'Natural' },
                          { value: 'juridica', label: 'Jurídica' },
                        ]}
                        value={payment.personType}
                        onChange={(value) => setField('personType', value)}
                      />
                    </Field>
                  </div>
                  <p className={styles.testHint}>Te llevaremos a la página de tu banco para autorizar el pago (en la demo se aprueba al instante).</p>
                </div>
              )}

              {selected && option.value === 'billetera' && (
                <div className={styles.methodBody}>
                  <div className="form-row">
                    <Field label="Billetera">
                      <SegmentedControl label="Billetera" options={['Nequi', 'Daviplata']} value={payment.wallet} onChange={(value) => setField('wallet', value)} />
                    </Field>
                    <Field label="Celular de la billetera" htmlFor="wallet-phone" error={errors.walletPhone}>
                      <IconInput
                        id="wallet-phone"
                        icon="phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="300 123 4567"
                        value={payment.walletPhone}
                        onChange={(event) => setField('walletPhone', event.target.value)}
                        invalid={Boolean(errors.walletPhone)}
                      />
                    </Field>
                  </div>
                  <p className={styles.testHint}>Te llegará una notificación a la app para aprobar el pago.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.actionsColumn}>
        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('../datos', { relative: 'path' })} disabled={status === 'processing'}>
            <Icon name="chevron-left" /> Anterior
          </button>
          <button type="submit" className="btn btn-accent btn-lg" disabled={status === 'processing'}>
            <Icon name="lock" />
            {status === 'processing' ? 'Procesando pago…' : `Donar ${formatCOP(total)}${monthly ? ' mensuales' : ''}`}
          </button>
        </div>
        {monthly && <p className={styles.cancelNote}>Puedes cancelar tu donación mensual cuando quieras desde tu cuenta.</p>}
      </div>
    </form>
  )
}
