import { useState } from 'react'
import CampaignCard from '../../../components/cards/CampaignCard'
import { Field, SelectInput } from '../../../components/forms/Field'
import { FileChip, FileDropzone } from '../../../components/forms/FileDropzone'
import { OptionCard } from '../../../components/forms/OptionCard'
import Icon from '../../../components/ui/Icon'
import { campaignCategories } from '../../../data/campaigns'
import { fromDateInput, toDateInput } from '../../../utils/dates'
import { formatCOP } from '../../../utils/format'
import styles from '../Fundacion.module.css'

// Formulario para crear o editar una campaña. La meta es la suma de los gastos.
export default function CampaignEditor({ value, setValue, ownPets, onSave, onCancel }) {
  const [today] = useState(() => new Date())
  const [previewEnd] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString())
  const patch = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  const total = value.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const pet = ownPets.find((item) => item.id === value.petId)
  function expenseChange(index, key, next) {
    patch(
      'expenses',
      value.expenses.map((expense, current) => (current === index ? { ...expense, [key]: next } : expense)),
    )
  }
  return (
    <div className={styles.editorLayout}>
      <form
        className={styles.editor}
        onSubmit={(event) => {
          event.preventDefault()
          onSave('Activa')
        }}
      >
        <div className={styles.sectionHead}>
          <div>
            <h2>{value.id ? 'Editar campaña' : 'Crear una campaña'}</h2>
            <p>Cuéntales a las familias cómo pueden ayudar.</p>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>
            Volver
          </button>
        </div>
        <fieldset className={styles.formSection}>
          <legend>
            <b>1</b> ¿Para qué es la campaña?
          </legend>
          <div className={styles.categoryGrid}>
            {campaignCategories.map((item) => (
              <OptionCard
                key={item.value}
                name="campaign-category"
                value={item.value}
                checked={value.category === item.value}
                onChange={(category) => patch('category', category)}
                icon={item.icon}
                title={item.value}
                layout="center"
                tone="accent"
              />
            ))}
          </div>
          <Field label="Título de la campaña" htmlFor="campaign-title">
            <input
              id="campaign-title"
              className="input"
              required
              value={value.title}
              onChange={(event) => patch('title', event.target.value)}
            />
          </Field>
          <Field label="Mascota relacionada (opcional)" htmlFor="campaign-pet">
            <SelectInput
              id="campaign-pet"
              value={value.petId || ''}
              onChange={(event) => patch('petId', event.target.value)}
            >
              <option value="">Varias mascotas</option>
              {ownPets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Imagen de campaña">
            <FileDropzone
              multiple={false}
              title="Subir portada"
              onFiles={(files) => patch('photo', files[0]?.url || '')}
            />
            <input
              className="input"
              aria-label="URL de imagen de campaña"
              value={value.photo || ''}
              onChange={(event) => patch('photo', event.target.value)}
              placeholder="o pega una URL de imagen"
            />
          </Field>
          <Field label="Cuenta la historia" htmlFor="campaign-story">
            <textarea
              id="campaign-story"
              className="textarea"
              required
              value={value.summary}
              onChange={(event) => patch('summary', event.target.value)}
              placeholder="¿Qué pasó y en qué se utilizarán los aportes?"
            />
          </Field>
        </fieldset>
        <fieldset className={styles.formSection}>
          <legend>
            <b>2</b> Meta y uso del dinero
          </legend>
          <div className="form-row">
            <Field label="Fecha de cierre" htmlFor="campaign-end">
              <input
                id="campaign-end"
                className="input"
                type="date"
                min={toDateInput(new Date(today.getTime() + 86400000))}
                required
                value={value.endDate}
                onChange={(event) => patch('endDate', event.target.value)}
              />
            </Field>
            <Field label="Meta total">
              <input className="input" readOnly value={formatCOP(total)} aria-label="Meta total calculada" />
            </Field>
          </div>
          <p className={styles.hint}>La fecha de cierre debe ser futura · La meta se calcula sumando los gastos.</p>
          {value.expenses.map((expense, index) => (
            <div className={styles.expenseRow} key={index}>
              <Field label={`Concepto ${index + 1}`} htmlFor={`expense-concept-${index}`}>
                <input
                  id={`expense-concept-${index}`}
                  className="input"
                  value={expense.concept}
                  onChange={(event) => expenseChange(index, 'concept', event.target.value)}
                  placeholder="Ej. Medicamentos"
                />
              </Field>
              <Field label="Monto" htmlFor={`expense-amount-${index}`}>
                <input
                  id={`expense-amount-${index}`}
                  className="input"
                  type="number"
                  min="0"
                  value={expense.amount}
                  onChange={(event) => expenseChange(index, 'amount', event.target.value)}
                  placeholder="$0"
                />
              </Field>
              <button
                className="icon-btn"
                type="button"
                aria-label="Quitar gasto"
                onClick={() =>
                  patch(
                    'expenses',
                    value.expenses.filter((_, current) => current !== index),
                  )
                }
                disabled={value.expenses.length === 1}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => patch('expenses', [...value.expenses, { concept: '', amount: '' }])}
          >
            <Icon name="plus" />
            Agregar gasto
          </button>
          <div className={styles.totalRow}>
            <strong>Total de la meta</strong>
            <strong>{formatCOP(total)}</strong>
          </div>
          <Field label="Cotización o soporte">
            <FileDropzone
              accept=".pdf,image/*"
              title="Agregar soporte"
              onFiles={(files) =>
                patch('receipts', [...value.receipts, ...files.map((file) => ({ name: file.name, size: file.size }))])
              }
            />
            {value.receipts.map((file, index) => (
              <FileChip
                key={`${file.name}-${index}`}
                name={file.name}
                onRemove={() =>
                  patch(
                    'receipts',
                    value.receipts.filter((_, current) => current !== index),
                  )
                }
              />
            ))}
          </Field>
        </fieldset>
        <div className={styles.formActions}>
          <button type="button" className="btn btn-secondary" onClick={() => onSave('Borrador')}>
            Guardar borrador
          </button>
          <button type="submit" className="btn btn-accent">
            Enviar a revisión
          </button>
        </div>
      </form>
      <aside className={styles.previewAside}>
        <span className="eyebrow">VISTA PREVIA</span>
        <CampaignCard
          preview
          campaign={{
            ...value,
            photo: value.photo || pet?.photo || '',
            foundationId: pet?.foundationId,
            endDate: value.endDate ? fromDateInput(value.endDate) : previewEnd,
            raised: value.raised || 0,
            donors: value.donors || 0,
            expenses: value.expenses.map((expense) => ({ ...expense, amount: Number(expense.amount) || 0 })),
          }}
        />
        <section className={`${styles.card} ${styles.reviewNote}`}>
          <strong>Revisión de PetMind</strong>
          <p>Verificamos cada campaña en menos de 24 horas. El dinero se entrega contra factura del proveedor.</p>
        </section>
      </aside>
    </div>
  )
}
