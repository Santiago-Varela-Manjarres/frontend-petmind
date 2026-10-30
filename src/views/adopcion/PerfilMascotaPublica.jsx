import { Link, useParams } from 'react-router-dom'
import { useMascotasPublicas } from '../../hooks/useMascotasPublicas'
import { formatAge } from '../../utils/dates'
import { sizeLabel } from '../../data/pets'
import NoEncontrada from '../NoEncontrada'

// Se consulta el listado público para no exponer mascotas que no están disponibles.
export default function PerfilMascotaPublica() {
  const { id } = useParams()
  const { pets, status, retry } = useMascotasPublicas()
  if (status === 'loading') return <div className="page container" role="status">Cargando mascota…</div>
  if (status === 'error') return <div className="page container" role="alert"><p>No fue posible cargar la mascota.</p><button type="button" className="btn btn-outline" onClick={retry}>Reintentar</button></div>
  const pet = pets.find((item) => item.id === id)
  if (!pet) return <NoEncontrada title="No encontramos esta mascota disponible" backTo="/adoptar" backLabel="Ver mascotas" />
  const details = [
    ['Especie', pet.species], ['Raza', pet.breed],
    ['Edad', pet.ageMonths == null ? null : formatAge(pet.ageMonths)],
    ['Sexo', pet.sex], ['Tamaño', sizeLabel(pet.size, pet.sex)], ['Ciudad', pet.city],
    ['Peso', pet.physical?.pesoKg == null ? null : `${pet.physical.pesoKg} kg`],
    ['Color del pelaje', pet.physical?.colorPelaje],
  ].filter(([, value]) => value != null && value !== '')
  const health = [ ['Vacunas al día', pet.health.vaccinated], ['Esterilizado', pet.health.sterilized], ['Desparasitado', pet.health.dewormed], ['Microchip', pet.health.microchip] ]
  return (
    <div className="page page-tint-mint"><div className="container">
      <title>{`${pet.name} | PetMind`}</title>
      <p><Link to="/adoptar">← Volver a mascotas</Link></p>
      <article className="panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        <h1>{pet.name}</h1>
        <p>Disponible para adopción</p>
        <p>Fotografía no disponible en la consulta actual.</p>
        <h2>Información</h2>
        <dl>{details.map(([label, value]) => <div key={label}><dt><strong>{label}</strong></dt><dd>{value}</dd></div>)}</dl>
        {pet.description && <><h2>Descripción</h2><p>{pet.description}</p></>}
        {pet.story && <><h2>Su historia</h2><p>{pet.story}</p></>}
        {pet.traits.length > 0 && <><h2>Características</h2><p>{pet.traits.join(' · ')}</p></>}
        <h2>Salud</h2>
        <ul>{health.map(([label, value]) => <li key={label}>{label}: {value == null ? 'Sin información' : value ? 'Sí' : 'No'}</li>)}</ul>
        {pet.physical?.condicionesMedicas && <p>Condiciones médicas: {pet.physical.condicionesMedicas}</p>}
        {pet.physical?.cuidadosEspeciales && <p>Cuidados especiales: {pet.physical.cuidadosEspeciales}</p>}
        <h2>Fundación</h2>
        <p>{pet.foundationId ? `Identificador de la fundación: ${pet.foundationId}. ` : ''}La información de la fundación aún no está conectada.</p>
        <p>La solicitud de adopción para mascotas del backend aún no está conectada.</p>
      </article>
    </div></div>
  )
}
