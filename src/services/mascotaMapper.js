// El contrato MascotaResponse no incluye fotos ni el nombre de la fundación.
export function mapearMascota(mascota) {
  if (!mascota || mascota.id == null || !mascota.nombre) {
    throw new Error('La API devolvió una mascota sin identificador o nombre')
  }
  const species = { PERRO: 'Perro', GATO: 'Gato' }
  const sizes = { PEQUENO: 'Pequeño', MEDIANO: 'Mediano', GRANDE: 'Grande' }
  const sexes = { MACHO: 'Macho', HEMBRA: 'Hembra' }
  const statuses = { DISPONIBLE: 'Disponible', EN_PROCESO: 'En proceso', ADOPTADO: 'Adoptado', EN_TRATAMIENTO: 'En tratamiento' }
  return {
    id: String(mascota.id),
    foundationId: mascota.fundacionId == null ? null : String(mascota.fundacionId),
    name: mascota.nombre,
    species: species[mascota.especie] ?? 'Otro',
    breed: mascota.raza,
    ageMonths: mascota.edadMeses,
    size: sizes[mascota.tamano] ?? '',
    sex: sexes[mascota.sexo] ?? '',
    city: mascota.ciudad,
    description: mascota.descripcion,
    story: mascota.historia,
    traits: typeof mascota.etiquetas === 'string' ? mascota.etiquetas.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    status: statuses[mascota.estadoAdopcion] ?? '',
    publicationStatus: mascota.estadoPublicacion,
    health: { vaccinated: mascota.vacunasAlDia, sterilized: mascota.esterilizado, dewormed: mascota.desparasitado, microchip: mascota.tieneMicrochip },
    physical: mascota.cualidadesFisicas,
    affinity: mascota.afinidad,
    createdAt: mascota.fechaPublicacion ?? mascota.fechaCreacion,
    source: 'backend',
  }
}
