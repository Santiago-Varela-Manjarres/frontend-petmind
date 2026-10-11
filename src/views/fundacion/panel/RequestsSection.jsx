import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../../components/ui/Icon'
import { Tabs } from '../../../components/ui/Navigation'
import { useAdoptions } from '../../../context/AdoptionsContext'
import { boardStages, stageLabels } from '../../../data/adoptions'
import { RequestCard, RequestsTable } from './RequestBoard'
import RequestDetails from './RequestDetails'
import styles from '../Fundacion.module.css'

// Tablero de solicitudes (columnas por etapa o tabla) y detalle de la solicitud abierta en la URL.
export default function RequestsSection({ ownPets, ownRequests, requestId, foundation, author, movedBy, showToast }) {
  const navigate = useNavigate()
  const { moveRequest } = useAdoptions()
  const [requestPet, setRequestPet] = useState('Todas')
  const [sortCompatibility, setSortCompatibility] = useState(false)
  const [tableView, setTableView] = useState(false)
  const boardRequests = ownRequests.filter(
    (request) => !['borrador', 'no-seleccionada', 'cancelada'].includes(request.stage),
  )
  // Se lee siempre del contexto: así los mensajes, notas y cambios de etapa se ven al instante.
  const selectedRequest = requestId ? ownRequests.find((request) => request.id === requestId) : null

  function advanceRequest(request, stage, extra = {}) {
    // Soltar una tarjeta en su misma columna no es un cambio de etapa.
    if (request.stage === stage) return
    moveRequest(request.id, stage, { by: movedBy, ...extra })
    showToast(`La solicitud pasó a ${stageLabels[stage] || stage}.`, { tone: 'success' })
  }

  function openRequest(item) {
    navigate(`/fundacion/solicitudes/${item.id}`)
  }

  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <p className={styles.hint}>
          Arrastra cada solicitud a la etapa correspondiente o usa el menú «Mover a» con el teclado.
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTableView((value) => !value)}>
          <Icon name="grid" />
          {tableView ? 'Vista de tablero' : 'Vista de tabla'}
        </button>
      </div>
      <Tabs
        label="Filtrar por mascota"
        variant="pills"
        value={requestPet}
        onChange={setRequestPet}
        tabs={[
          { value: 'Todas', label: 'Todas las mascotas', count: boardRequests.length },
          ...ownPets
            .filter((pet) => boardRequests.some((request) => request.petId === pet.id))
            .map((pet) => ({
              value: pet.id,
              label: pet.name,
              count: boardRequests.filter((request) => request.petId === pet.id).length,
            })),
        ]}
      />
      <button
        className="btn btn-ghost btn-sm"
        type="button"
        aria-pressed={sortCompatibility}
        onClick={() => setSortCompatibility((value) => !value)}
      >
        <Icon name="sparkles" />
        {sortCompatibility ? 'Afinidad: mayor primero' : 'Ordenar por compatibilidad'}
      </button>
      {tableView ? (
        <RequestsTable
          requests={boardRequests.filter((item) => requestPet === 'Todas' || item.petId === requestPet)}
          pets={ownPets}
          onMove={advanceRequest}
          onSelect={openRequest}
        />
      ) : (
        <div className={styles.board}>
          {boardStages.map((stage) => {
            let stageItems = boardRequests.filter(
              (item) => item.stage === stage.value && (requestPet === 'Todas' || item.petId === requestPet),
            )
            if (sortCompatibility)
              stageItems = [...stageItems].sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0))
            return (
              <div
                className={styles.column}
                key={stage.value}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const id = event.dataTransfer.getData('text/plain')
                  const request = boardRequests.find((item) => item.id === id)
                  if (request) advanceRequest(request, stage.value)
                }}
              >
                <h2>
                  <i className={`${styles.stageDot} ${styles[`dot-${stage.dot}`]}`} />
                  {stage.label}
                  <span>{stageItems.length}</span>
                </h2>
                {stageItems.map((item) => (
                  <RequestCard
                    key={item.id}
                    item={item}
                    pet={ownPets.find((pet) => pet.id === item.petId)}
                    selected={selectedRequest?.id === item.id}
                    onSelect={() => openRequest(item)}
                    onMove={(next) => advanceRequest(item, next)}
                  />
                ))}
                {stageItems.length === 0 && <small className={styles.hint}>Sin solicitudes</small>}
              </div>
            )
          })}
        </div>
      )}
      {selectedRequest && (
        <RequestDetails
          key={selectedRequest.id}
          item={selectedRequest}
          pet={ownPets.find((entry) => entry.id === selectedRequest.petId)}
          ownRequests={ownRequests}
          onMove={advanceRequest}
          foundation={foundation}
          author={author}
          showToast={showToast}
          onClose={() => navigate('/fundacion/solicitudes')}
        />
      )}
    </section>
  )
}
