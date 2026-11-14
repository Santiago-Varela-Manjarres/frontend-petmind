// Mascotas del backend ↔ forma que usa el sitio (tarjetas, perfil, filtros) y el formulario de la fundación.

export const especiesApi = [
  { value: 'PERRO', label: 'Perro' },
  { value: 'GATO', label: 'Gato' },
  { value: 'CONEJO', label: 'Conejo' },
  { value: 'AVE', label: 'Ave' },
  { value: 'ROEDOR', label: 'Roedor' },
  { value: 'REPTIL', label: 'Reptil' },
  { value: 'OTRA_ESPECIE', label: 'Otra especie' },
]
export const tamanosApi = [
  { value: 'PEQUENO', label: 'Pequeño' },
  { value: 'MEDIANO', label: 'Mediano' },
  { value: 'GRANDE', label: 'Grande' },
]
export const sexosApi = [
  { value: 'HEMBRA', label: 'Hembra' },
  { value: 'MACHO', label: 'Macho' },
]
export const estadosAdopcionApi = [
  { value: 'DISPONIBLE', label: 'Disponible', tone: 'success' },
  { value: 'EN_PROCESO', label: 'En proceso', tone: 'warning' },
  { value: 'EN_TRATAMIENTO', label: 'En tratamiento', tone: 'info' },
  { value: 'ADOPTADO', label: 'Adoptado', tone: 'neutral' },
]
export const estadosPublicacionApi = {
  PUBLICADA: { label: 'Publicada', tone: 'success' },
  BORRADOR: { label: 'Borrador', tone: 'neutral' },
  PAUSADA: { label: 'Pausada', tone: 'warning' },
  ARCHIVADA: { label: 'Archivada', tone: 'neutral' },
}

export const labelOf = (list, value) => list.find((item) => item.value === value)?.label

export function estadoAdopcionDe(valor) {
  return estadosAdopcionApi.find((item) => item.value === valor) ?? { label: valor || 'Sin estado', tone: 'neutral' }
}

export function estadoPublicacionDe(valor) {
  return estadosPublicacionApi[valor] ?? { label: valor || 'Sin estado', tone: 'neutral' }
}

// La afinidad va de 1 a 5 en el backend: desde 4 se toma como "sí" y hasta 2 como "no".
const convive = (nivel) => (nivel == null ? null : nivel >= 4 ? true : nivel <= 2 ? false : null)

// El contrato MascotaResponse no incluye fotos ni el nombre de la fundación:
// la foto la agrega useMascotasPublicas desde /archivos y la fundación se consulta aparte.
export function mapearMascota(mascota) {
  if (!mascota || mascota.id == null || !mascota.nombre) {
    throw new Error('La API devolvió una mascota sin identificador o nombre')
  }
  const species = { PERRO: 'Perro', GATO: 'Gato' }
  const physical = mascota.cualidadesFisicas
  return {
    id: String(mascota.id),
    backendId: mascota.id,
    foundationId: mascota.fundacionId == null ? null : String(mascota.fundacionId),
    name: mascota.nombre,
    species: species[mascota.especie] ?? 'Otro',
    speciesLabel: labelOf(especiesApi, mascota.especie) ?? 'Otra especie',
    breed: mascota.raza,
    ageMonths: mascota.edadMeses,
    size: labelOf(tamanosApi, mascota.tamano) ?? '',
    sex: labelOf(sexosApi, mascota.sexo) ?? '',
    city: mascota.ciudad,
    description: mascota.descripcion,
    story: mascota.historia,
    traits: typeof mascota.etiquetas === 'string' ? mascota.etiquetas.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    status: labelOf(estadosAdopcionApi, mascota.estadoAdopcion) ?? '',
    publicationStatus: mascota.estadoPublicacion,
    health: { vaccinated: mascota.vacunasAlDia, sterilized: mascota.esterilizado, dewormed: mascota.desparasitado, microchip: mascota.tieneMicrochip },
    physical,
    affinity: mascota.afinidad,
    // Filtros de Adoptar ("Apto con niños"…).
    goodWithKids: convive(mascota.afinidad?.afinidadNinos) === true,
    goodWithCats: convive(mascota.afinidad?.afinidadGatos) === true,
    goodWithDogs: convive(mascota.afinidad?.afinidadPerros) === true,
    specialNeeds: Boolean(physical?.cuidadosEspeciales || physical?.condicionesMedicas),
    createdAt: mascota.fechaPublicacion ?? mascota.fechaCreacion,
    source: 'backend',
  }
}

// ── Formulario de la fundación (publicar o editar una mascota del backend) ─────────────────────

export function mascotaVacia(ciudad = '') {
  return {
    nombre: '',
    especie: 'PERRO',
    raza: '',
    edadMeses: '12',
    tamano: 'MEDIANO',
    sexo: 'HEMBRA',
    ciudad,
    pesoKg: '',
    colorPelaje: '',
    vacunasAlDia: false,
    desparasitado: false,
    esterilizado: false,
    tieneMicrochip: false,
    aptoApadrinamiento: false,
    condicionesMedicas: '',
    cuidadosEspeciales: '',
    etiquetas: [],
    descripcion: '',
    historia: '',
    convivePerros: null,
    conviveGatos: null,
    conviveNinos: null,
    estadoAdopcion: 'DISPONIBLE',
    fotos: [],
  }
}

// MascotaResponse + sus archivos → valores del formulario.
export function mascotaAFormulario(mascota, archivos = []) {
  const fisicas = mascota.cualidadesFisicas ?? {}
  const texto = (valor) => (valor == null ? '' : String(valor))
  return {
    ...mascotaVacia(),
    nombre: texto(mascota.nombre),
    especie: mascota.especie ?? 'PERRO',
    raza: texto(mascota.raza),
    edadMeses: texto(mascota.edadMeses),
    tamano: mascota.tamano ?? '',
    sexo: mascota.sexo ?? '',
    ciudad: texto(mascota.ciudad),
    pesoKg: texto(fisicas.pesoKg),
    colorPelaje: texto(fisicas.colorPelaje),
    condicionesMedicas: texto(fisicas.condicionesMedicas),
    cuidadosEspeciales: texto(fisicas.cuidadosEspeciales),
    vacunasAlDia: Boolean(mascota.vacunasAlDia),
    desparasitado: Boolean(mascota.desparasitado),
    esterilizado: Boolean(mascota.esterilizado),
    tieneMicrochip: Boolean(mascota.tieneMicrochip),
    aptoApadrinamiento: Boolean(mascota.aptoApadrinamiento),
    etiquetas: typeof mascota.etiquetas === 'string' ? mascota.etiquetas.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    descripcion: texto(mascota.descripcion),
    historia: texto(mascota.historia),
    convivePerros: convive(mascota.afinidad?.afinidadPerros),
    conviveGatos: convive(mascota.afinidad?.afinidadGatos),
    conviveNinos: convive(mascota.afinidad?.afinidadNinos),
    estadoAdopcion: mascota.estadoAdopcion ?? 'DISPONIBLE',
    fotos: archivos.filter((archivo) => archivo.tipoMedio === 'IMAGEN' && archivo.url).map((archivo) => archivo.url),
  }
}

const textoONulo = (valor) => (String(valor ?? '').trim() ? String(valor).trim() : null)

function numeroONulo(valor) {
  if (valor === '' || valor == null) return null
  const numero = Number(String(valor).replace(',', '.'))
  return Number.isFinite(numero) ? numero : null
}

// Sí → 5 y No → 1; si la ficha ya traía un nivel compatible con la respuesta, se conserva.
function nivelAfinidad(respuesta, anterior) {
  if (respuesta === true) return anterior >= 4 ? anterior : 5
  if (respuesta === false) return anterior != null && anterior <= 2 ? anterior : 1
  return anterior === 3 ? 3 : null
}

// Valores del formulario → MascotaRequest. `anterior` es la ficha que se edita: sus datos que el formulario
// no muestra (altura, nivel de energía…) se conservan, porque PUT reemplaza la mascota completa.
export function formularioAMascota(form, { fundacionId, estadoPublicacion, anterior = null }) {
  const fisicas = anterior?.cualidadesFisicas ?? {}
  const afinidad = anterior?.afinidad ?? {}
  return {
    fundacionId,
    nombre: form.nombre.trim(),
    especie: form.especie,
    raza: textoONulo(form.raza),
    edadMeses: numeroONulo(form.edadMeses),
    tamano: form.tamano || null,
    sexo: form.sexo || null,
    cualidadesFisicas: {
      ...fisicas,
      pesoKg: numeroONulo(form.pesoKg),
      colorPelaje: textoONulo(form.colorPelaje),
      condicionesMedicas: textoONulo(form.condicionesMedicas),
      cuidadosEspeciales: textoONulo(form.cuidadosEspeciales),
    },
    ciudad: textoONulo(form.ciudad),
    descripcion: textoONulo(form.descripcion),
    historia: textoONulo(form.historia),
    etiquetas: form.etiquetas.length ? form.etiquetas.join(', ') : null,
    afinidad: {
      ...afinidad,
      afinidadPerros: nivelAfinidad(form.convivePerros, afinidad.afinidadPerros),
      afinidadGatos: nivelAfinidad(form.conviveGatos, afinidad.afinidadGatos),
      afinidadNinos: nivelAfinidad(form.conviveNinos, afinidad.afinidadNinos),
    },
    estadoAdopcion: form.estadoAdopcion,
    estadoPublicacion,
    esterilizado: Boolean(form.esterilizado),
    vacunasAlDia: Boolean(form.vacunasAlDia),
    desparasitado: Boolean(form.desparasitado),
    tieneMicrochip: Boolean(form.tieneMicrochip),
    aptoApadrinamiento: Boolean(form.aptoApadrinamiento),
  }
}
