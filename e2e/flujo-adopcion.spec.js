import { expect, test } from '@playwright/test'
import { randomInt } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Flujo completo de adopción en PetMind, de punta a punta y con datos reales del backend:
//   1. Una persona crea su cuenta, la verifica e inicia sesión.
//   2. Elige una mascota de una fundación y le envía la solicitud de adopción.
//   3. La fundación recibe la solicitud en su panel y la aprueba o la rechaza.
//   4. La persona ve la respuesta en el seguimiento de su solicitud.
//   5. El administrador ve la cuenta nueva en Usuarios y las estadísticas.
// Cada actor usa su propio navegador (un contexto aislado): no comparten localStorage, así que todo lo
// que uno ve de otro pasó por el backend, como si fueran tres personas en tres equipos distintos.
//
// Opciones (variables de entorno, todas opcionales):
//   E2E_BASE_URL   sitio que se prueba (por defecto producción; http://localhost:5173 levanta Vite)
//   E2E_API_URL    API del backend (por defecto la de Render)
//   E2E_ANALITICA_URL   API de analítica en Python (solo se usa para despertarla antes del paso 5)
//   E2E_DECISION   aprobar (por defecto) | rechazar
//   E2E_FUNDACION  id de la fundación que decide (por defecto, la primera con mascotas disponibles)
//   E2E_MASCOTA    nombre de la mascota (por defecto, la primera disponible de esa fundación)
//   E2E_NOMBRE, E2E_APELLIDO, E2E_CONTRASENA   datos de la persona que se registra
//   E2E_PAUSA, E2E_TECLEO   ritmo: ms entre pasos y entre teclas (2200 y 70 con navegador visible, 0 sin ventana)
//   E2E_CERRAR_AL_FINAL     1 = cerrar las ventanas al terminar. Por defecto, con el navegador visible quedan
//                           abiertas para seguir mostrando el sitio; la prueba termina cuando se cierran todas.
// Las cuentas de las fundaciones y del administrador salen de e2e/cuentas.local.json (no está en Git).
// ─────────────────────────────────────────────────────────────────────────────────────────────

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ARCHIVO_CUENTAS = path.join(RAIZ, 'e2e', 'cuentas.local.json')
const ARCHIVO_MD = path.join(RAIZ, 'CUENTAS-DEMO.md')
const API = (process.env.E2E_API_URL ?? 'https://backend-pet-mind.onrender.com/api').replace(/\/$/, '')
const ANALITICA = (process.env.E2E_ANALITICA_URL ?? 'https://petmind-analitica.onrender.com').replace(/\/$/, '')
const DECISION = (process.env.E2E_DECISION ?? 'aprobar').trim().toLowerCase()
const MOTIVO_RECHAZO = 'Por ahora buscamos un hogar con patio para este peludo. ¡Gracias por querer adoptar!'

// Cómo queda la solicitud según la decisión: estado en el backend, etiqueta que ve la persona y
// nombre de la columna en la gráfica de estadísticas.
const RESULTADOS = {
  aprobar: { estado: 'APROBADA', etiqueta: 'Aprobada', grafica: 'Aprobada' },
  rechazar: { estado: 'RECHAZADA', etiqueta: 'No aprobada', grafica: 'Rechazada' },
}

// Ritmo de la demostración: con el navegador visible (npm run e2e:demo) hay pausas y se ve escribir.
let pausaMs = 0
let tecleoMs = 0

function leerCuentas() {
  if (!existsSync(ARCHIVO_CUENTAS)) {
    throw new Error(
      'Falta e2e/cuentas.local.json. Cópialo de e2e/cuentas.example.json y pon las contraseñas (están en CUENTAS-DEMO.md).',
    )
  }
  const cuentas = JSON.parse(readFileSync(ARCHIVO_CUENTAS, 'utf8'))
  if (!cuentas.admin?.correo || !cuentas.fundaciones?.length) {
    throw new Error('e2e/cuentas.local.json debe traer "admin" y al menos una cuenta en "fundaciones".')
  }
  return cuentas
}

const simple = (texto) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

// Persona nueva en cada corrida: el correo lleva la fecha y la hora para no repetirse. La contraseña cambia en
// cada corrida (cumple la regla: 8+ caracteres, una mayúscula y un especial) y queda anotada en CUENTAS-DEMO.md.
function datosPersona() {
  const nombre = process.env.E2E_NOMBRE?.trim() || 'Valentina'
  const apellido = process.env.E2E_APELLIDO?.trim() || 'Ríos'
  const ahora = new Date()
  const dos = (numero) => String(numero).padStart(2, '0')
  const marca = `${dos(ahora.getMonth() + 1)}${dos(ahora.getDate())}${dos(ahora.getHours())}${dos(ahora.getMinutes())}${dos(ahora.getSeconds())}`
  return {
    nombre,
    apellido,
    completo: `${nombre} ${apellido}`,
    correo: `${simple(nombre)}.${simple(apellido)}.${marca}@petmind.example`,
    celular: '3004567890',
    ciudad: 'Medellín',
    contrasena: process.env.E2E_CONTRASENA || `Adopta#${randomInt(100_000, 1_000_000)}`,
    creadaEl: ahora,
  }
}

// GET a la API con reintentos: el plan gratuito de Render apaga el backend y tarda en despertar.
async function api(request, ruta, { intentos = 1, timeout = 60_000 } = {}) {
  let ultimoError
  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      const respuesta = await request.get(`${API}${ruta}`, { timeout })
      if (respuesta.ok()) return await respuesta.json()
      ultimoError = new Error(`GET ${ruta} respondió ${respuesta.status()}`)
    } catch (error) {
      ultimoError = error
    }
    if (intento < intentos) await new Promise((resolve) => setTimeout(resolve, 10_000))
  }
  throw ultimoError
}

// Mientras la API de Python despierta, Spring Boot responde 502 al instante, así que llamarla a través del
// backend no basta para despertarla. /health de Python sí espera a que el servicio arranque.
async function despertarAnalitica(request) {
  await request.get(`${ANALITICA}/health`, { timeout: 180_000 }).catch(() => null)
  return api(request, '/analitica', { intentos: 6, timeout: 90_000 })
}

// Espera las gráficas. Si la pantalla se rinde ("No pudimos cargar las estadísticas"), usa su botón Reintentar.
async function esperarEstadisticas(page) {
  const indicador = page.locator('article').filter({ hasText: 'Solicitudes analizadas' })
  const fallo = page.getByRole('alert').filter({ hasText: 'No pudimos cargar las estadísticas' })
  for (let intento = 1; intento <= 3; intento += 1) {
    await expect(indicador.or(fallo).first()).toBeVisible({ timeout: 150_000 })
    if (await indicador.isVisible()) return indicador
    await fallo.getByRole('button', { name: 'Reintentar' }).click()
  }
  await expect(indicador, 'La API de analítica no respondió después de varios intentos').toBeVisible()
  return indicador
}

// La primera fundación (con cuenta en cuentas.local.json) que tenga una mascota disponible. Se prefieren
// mascotas sin solicitudes abiertas de otras personas: aprobar una adopción cierra las demás solicitudes.
function elegirMascota(disponibles, solicitudes, fundaciones) {
  const idPreferido = process.env.E2E_FUNDACION ? Number(process.env.E2E_FUNDACION) : null
  const nombre = process.env.E2E_MASCOTA?.trim().toLocaleLowerCase('es-CO')
  const cerradas = ['APROBADA', 'RECHAZADA', 'CANCELADA']
  const conSolicitudAbierta = new Set(solicitudes.filter((s) => !cerradas.includes(s.estado)).map((s) => s.mascotaId))
  const candidatas = fundaciones.filter((cuenta) => idPreferido == null || cuenta.fundacionId === idPreferido)

  for (const libre of [true, false]) {
    for (const fundacion of candidatas) {
      const mascota = disponibles
        .filter((item) => item.fundacionId === fundacion.fundacionId)
        .filter((item) => !nombre || item.nombre.toLocaleLowerCase('es-CO') === nombre)
        .filter((item) => !libre || !conSolicitudAbierta.has(item.id))
        .sort((a, b) => a.id - b.id)[0]
      if (mascota) return { fundacion, mascota }
    }
  }
  throw new Error(
    `No hay mascotas disponibles para ${idPreferido == null ? 'las fundaciones de cuentas.local.json' : `la fundación ${idPreferido}`}` +
      (nombre ? ` con el nombre "${process.env.E2E_MASCOTA}"` : '') +
      '. Cambia E2E_FUNDACION o E2E_MASCOTA, o agrega otra fundación a e2e/cuentas.local.json.',
  )
}

// Cartel que dice quién actúa y en qué paso va (sale en el video y en las capturas). No recibe clics.
function instalarCartel({ titulo, color }) {
  const pintar = () => {
    if (!document.body) return
    let cartel = document.getElementById('e2e-cartel')
    if (!cartel) {
      cartel = document.createElement('div')
      cartel.id = 'e2e-cartel'
      cartel.setAttribute('aria-hidden', 'true')
      cartel.style.cssText = [
        'position:fixed',
        'left:16px',
        'bottom:16px',
        'z-index:2147483647',
        'display:grid',
        'gap:2px',
        'max-width:380px',
        'padding:10px 14px',
        'border-radius:12px',
        `background:${color}`,
        'color:#fff',
        'font:500 14px/1.35 system-ui,sans-serif',
        'box-shadow:0 10px 28px rgba(0,0,0,.28)',
        'pointer-events:none',
      ].join(';')
      document.body.appendChild(cartel)
    }
    let pasoActual = ''
    try {
      pasoActual = sessionStorage.getItem('e2e.paso') ?? ''
    } catch {
      // about:blank no tiene sessionStorage
    }
    const quien = document.createElement('strong')
    quien.textContent = titulo
    const que = document.createElement('span')
    que.textContent = pasoActual
    cartel.replaceChildren(quien, que)
  }
  window.__e2eCartel = pintar
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pintar)
  else pintar()
}

async function nuevoActor(browser, testInfo, { clave, titulo, color }) {
  const { baseURL, viewport, locale, timezoneId } = testInfo.project.use
  const context = await browser.newContext({
    baseURL,
    viewport,
    locale,
    timezoneId,
    recordVideo: { dir: testInfo.outputPath(`video-${clave}`), size: viewport },
  })
  await context.tracing.start({ screenshots: true, snapshots: true, title: titulo })
  await context.addInitScript(instalarCartel, { titulo, color })
  const page = await context.newPage()
  return { clave, titulo, context, page }
}

// La traza se guarda al terminar el recorrido automático: si las ventanas quedan abiertas, lo que se haga
// después a mano no la agranda (el video sí sigue grabando hasta que se cierran).
async function detenerTraza(actor, testInfo) {
  if (actor.traza) return
  actor.traza = testInfo.outputPath(`trace-${actor.clave}.zip`)
  await actor.context.tracing.stop({ path: actor.traza }).catch(() => {})
}

async function cerrarActor(actor, testInfo) {
  await detenerTraza(actor, testInfo)
  const video = actor.page.video()
  await actor.context.close().catch(() => {})
  if (existsSync(actor.traza)) await testInfo.attach('trace', { path: actor.traza, contentType: 'application/zip' })
  const rutaVideo = video ? await video.path().catch(() => null) : null
  if (rutaVideo && existsSync(rutaVideo)) await testInfo.attach('video', { path: rutaVideo, contentType: 'video/webm' })
}

async function mostrarEnCartel(page, texto) {
  await page.evaluate((valor) => {
    try {
      sessionStorage.setItem('e2e.paso', valor)
    } catch {
      // sin sessionStorage
    }
    window.__e2eCartel?.()
  }, texto)
}

const pausa = (page, veces = 1) => (pausaMs ? page.waitForTimeout(pausaMs * veces) : Promise.resolve())

// Trae al frente la ventana del actor, actualiza el cartel y da un momento para leerlo.
async function paso(actor, texto) {
  await actor.page.bringToFront()
  await mostrarEnCartel(actor.page, texto)
  await pausa(actor.page, 0.5)
}

// Con el navegador visible, al terminar el recorrido las ventanas quedan abiertas para seguir mostrando el
// sitio a mano. La prueba termina cuando se cierran todas (o con Ctrl+C en la terminal).
async function esperarCierre(actores, testInfo) {
  test.setTimeout(0)
  for (const actor of actores) {
    await detenerTraza(actor, testInfo)
    await mostrarEnCartel(actor.page, 'Recorrido terminado ✓ · puedes seguir navegando').catch(() => {})
  }
  console.log('\n  Recorrido terminado. Las ventanas quedan abiertas: ciérralas (o presiona Ctrl+C) para terminar la prueba.\n')
  await Promise.all(
    actores.map(({ page }) => (page.isClosed() ? null : page.waitForEvent('close', { timeout: 0 }).catch(() => null))),
  )
}

async function escribir(campo, texto) {
  if (!tecleoMs) {
    await campo.fill(texto)
    return
  }
  await campo.click()
  await campo.pressSequentially(texto, { delay: tecleoMs })
}

const visible = (locator) => locator.filter({ visible: true }).first()

async function captura(actor, testInfo, nombre) {
  await testInfo.attach(`${actor.titulo} · ${nombre}`, { body: await actor.page.screenshot(), contentType: 'image/png' })
}

async function iniciarSesion(page, correo, contrasena) {
  await expect(page).toHaveURL(/\/login$/)
  await escribir(page.locator('#login-email'), correo)
  await escribir(page.locator('#login-password'), contrasena)
  await pausa(page, 0.5)
  await page.getByRole('button', { name: /^Iniciar sesión/ }).click()
}

// Título "Adopción de …" del seguimiento, junto con la etiqueta del estado.
const encabezadoSolicitud = (page, mascota) =>
  page.getByRole('heading', { level: 1, name: `Adopción de ${mascota}` }).locator('xpath=..')

// Deja la persona creada en CUENTAS-DEMO.md para poder entrar luego con esa cuenta.
function anotarPersona(persona, registro) {
  const titulo = '## Personas creadas por la prueba'
  const tabla = '| Fecha | Persona | Correo | Contraseña | Mascota | Fundación | Resultado |\n|---|---|---|---|---|---|---|'
  let texto = existsSync(ARCHIVO_MD) ? readFileSync(ARCHIVO_MD, 'utf8') : '# PetMind · Cuentas de la demo\n'
  if (!texto.includes(titulo)) texto = `${texto.trimEnd()}\n\n${titulo}\n\n${tabla}\n`
  if (!texto.endsWith('\n')) texto += '\n'
  const fecha = persona.creadaEl.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  const mascota = registro.mascota ? `${registro.mascota.nombre} (#${registro.mascota.id})` : '—'
  const fila = `| ${fecha} | ${persona.completo} | \`${persona.correo}\` | \`${persona.contrasena}\` | ${mascota} | ${registro.fundacion?.fundacion ?? '—'} | ${registro.resultado} |`
  writeFileSync(ARCHIVO_MD, `${texto}${fila}\n`, 'utf8')
}

test('Flujo de adopción de punta a punta: persona → fundación → administrador', async ({ browser, request, headless }, testInfo) => {
  expect(Object.keys(RESULTADOS), 'E2E_DECISION debe ser "aprobar" o "rechazar"').toContain(DECISION)
  const esperado = RESULTADOS[DECISION]
  pausaMs = Number(process.env.E2E_PAUSA ?? (headless ? 0 : 2200))
  tecleoMs = Number(process.env.E2E_TECLEO ?? (headless ? 0 : 70))
  const dejarAbierto = !headless && process.env.E2E_CERRAR_AL_FINAL !== '1'
  const cuentas = leerCuentas()
  const persona = datosPersona()
  const actores = []
  const registro = { cuentaCreada: false, anotada: false, mascota: null, fundacion: null, solicitudId: null, resultado: 'Sin solicitud' }

  // Anota la persona en CUENTAS-DEMO.md y en el reporte una sola vez (antes de dejar las ventanas abiertas,
  // así no se pierde si la prueba se corta con Ctrl+C).
  async function guardarCuenta() {
    if (!registro.cuentaCreada || registro.anotada) return
    registro.anotada = true
    anotarPersona(persona, registro)
    await testInfo.attach('Cuenta creada por la prueba', {
      body: `Correo: ${persona.correo}\nContraseña: ${persona.contrasena}\nResultado: ${registro.resultado}\n`,
      contentType: 'text/plain',
    })
  }

  try {
    const { fundacion, mascota, decididasAntes } = await test.step('0 · Despertar el backend y elegir la mascota', async () => {
      const disponibles = await api(request, '/mascotas/por-estado?estadoPublicacion=PUBLICADA&estadoAdopcion=DISPONIBLE', {
        intentos: 4,
        timeout: 120_000,
      })
      // La API de analítica (Python) también se duerme: se despierta desde ya para que esté lista en el paso 5.
      despertarAnalitica(request).catch(() => null)
      const solicitudes = await api(request, '/solicitudes-adopcion', { intentos: 2 })
      return {
        ...elegirMascota(disponibles, solicitudes, cuentas.fundaciones),
        decididasAntes: solicitudes.filter((solicitud) => solicitud.estado === esperado.estado).length,
      }
    })
    registro.mascota = mascota
    registro.fundacion = fundacion
    testInfo.annotations.push(
      { type: 'Persona', description: `${persona.completo} · ${persona.correo} · ${persona.contrasena}` },
      { type: 'Mascota', description: `${mascota.nombre} (#${mascota.id}) de ${fundacion.fundacion}` },
      { type: 'Fundación', description: fundacion.correo },
      { type: 'Decisión', description: esperado.etiqueta },
    )

    // ── Persona ──────────────────────────────────────────────────────────────────────────────
    const personaActor = await nuevoActor(browser, testInfo, { clave: 'persona', titulo: `Persona · ${persona.completo}`, color: '#0b6b67' })
    actores.push(personaActor)

    await test.step('1 · La persona crea su cuenta e inicia sesión', async () => {
      const { page } = personaActor
      await page.goto('/')
      await paso(personaActor, 'Paso 1 de 5 · Crear una cuenta en PetMind')
      await pausa(page)
      await visible(page.getByRole('link', { name: 'Iniciar sesión' })).click()
      await visible(page.getByRole('link', { name: 'Crear cuenta' })).click()
      await expect(page).toHaveURL(/\/registro$/)
      await pausa(page)
      await page.getByRole('button', { name: /Continuar como persona/ }).click()

      await expect(page).toHaveURL(/\/registro\/persona$/)
      await escribir(page.locator('#reg-name'), persona.nombre)
      await escribir(page.locator('#reg-lastname'), persona.apellido)
      await escribir(page.locator('#reg-email'), persona.correo)
      await escribir(page.locator('#reg-phone'), persona.celular)
      await page.locator('#reg-city').selectOption(persona.ciudad)
      await escribir(page.locator('#reg-password'), persona.contrasena)
      await page.getByRole('checkbox', { name: /Acepto los/ }).check()
      await pausa(page)
      await page.getByRole('button', { name: /Crear mi cuenta/ }).click()

      // POST /api/usuarios: desde aquí la cuenta existe en el backend.
      await expect(page).toHaveURL(/\/registro\/verificar$/, { timeout: 90_000 })
      registro.cuentaCreada = true
      await paso(personaActor, 'Paso 1 de 5 · Verificar el correo (en la demo sirve cualquier código)')
      await escribir(page.getByLabel('Dígito 1'), '123456')
      await pausa(page, 0.5)
      await page.getByRole('button', { name: /Verificar y entrar/ }).click()
      await expect(page).toHaveURL(/\/cuenta$/)
      await captura(personaActor, testInfo, 'cuenta creada')

      await paso(personaActor, 'Paso 1 de 5 · Cerrar sesión y entrar con la cuenta nueva')
      await pausa(page)
      await page.getByRole('complementary', { name: 'Menú de mi cuenta' }).getByRole('button', { name: 'Cerrar sesión' }).click()
      await expect(page.getByRole('complementary', { name: 'Menú de mi cuenta' })).toHaveCount(0)
      await visible(page.getByRole('link', { name: 'Iniciar sesión' })).click()
      // POST /api/auth/login con la contraseña que se acaba de registrar.
      await iniciarSesion(page, persona.correo, persona.contrasena)
      await expect(page).toHaveURL(/\/cuenta$/, { timeout: 90_000 })
      await expect(page.getByRole('complementary', { name: 'Menú de mi cuenta' })).toContainText(persona.completo)
    })

    await test.step(`2 · La persona elige a ${mascota.nombre} y envía la solicitud`, async () => {
      const { page } = personaActor
      await page.goto('/adoptar')
      await paso(personaActor, 'Paso 2 de 5 · Buscar una mascota para adoptar')
      await expect(page.locator('a[href^="/adoptar/backend/"]').first()).toBeVisible({ timeout: 90_000 })
      await pausa(page)
      await page.getByRole('button', { name: 'Buscar mascotas' }).click()
      const buscador = page.getByRole('textbox', { name: 'Buscar mascotas por nombre' })
      await escribir(buscador, mascota.nombre)
      await buscador.press('Enter')
      const tarjeta = page.locator(`a[href="/adoptar/backend/${mascota.id}"]`).first()
      await expect(tarjeta).toBeVisible()
      await pausa(page)
      await tarjeta.click()

      await expect(page.getByRole('heading', { level: 1, name: mascota.nombre, exact: true })).toBeVisible()
      await paso(personaActor, `Paso 2 de 5 · Conocer a ${mascota.nombre}`)
      await pausa(page, 1.5)
      await page.getByRole('link', { name: `Quiero adoptar a ${mascota.nombre}` }).click()

      await expect(page.getByRole('heading', { name: 'Tus datos de contacto' })).toBeVisible({ timeout: 60_000 })
      await paso(personaActor, 'Paso 2 de 5 · Llenar la solicitud de adopción')
      const grupo = (nombre) => page.getByRole('radiogroup', { name: nombre })
      await grupo('Tipo de vivienda').getByText('Apartamento', { exact: true }).click()
      await grupo('Tenencia de la vivienda').getByText('Arrendada', { exact: true }).click()
      await grupo('¿Tiene patio o zona verde?').getByText('No', { exact: true }).click()
      await page.getByRole('group', { name: 'Personas en casa' }).getByRole('button', { name: 'Sumar' }).click()
      await grupo('¿Tienes otras mascotas?').getByText('No', { exact: true }).click()
      await escribir(page.locator('#ap-exp'), 'Crecí con perros y gatos; cuidé a una perrita adoptada durante 12 años.')
      const horas = page.getByRole('group', { name: 'Horas al día' }).getByRole('button', { name: 'Sumar' })
      await horas.click()
      await horas.click()
      await escribir(
        page.locator('#ap-why'),
        `Trabajo desde casa, vivo cerca de un parque y tengo tiempo para pasear y acompañar a ${mascota.nombre} todos los días.`,
      )
      await page.getByRole('checkbox', { name: /Me comprometo/ }).check()
      await page.getByRole('checkbox', { name: /Autorizo a/ }).check()
      await pausa(page)
      await page.getByRole('button', { name: /Enviar solicitud/ }).click()

      // POST /api/solicitudes-adopcion: la solicitud le llega a la fundación de la mascota.
      await expect(page).toHaveURL(/\/cuenta\/solicitudes\/backend\/\d+$/, { timeout: 60_000 })
      registro.solicitudId = Number(new URL(page.url()).pathname.split('/').pop())
      registro.resultado = `Recibida (solicitud #${registro.solicitudId})`
      await expect(encabezadoSolicitud(page, mascota.nombre)).toContainText('Recibida')
      await paso(personaActor, `Paso 2 de 5 · Solicitud #${registro.solicitudId} enviada a ${fundacion.fundacion}`)
      await captura(personaActor, testInfo, 'solicitud enviada')
      await pausa(page)
    })

    // ── Fundación ────────────────────────────────────────────────────────────────────────────
    const fundacionActor = await nuevoActor(browser, testInfo, { clave: 'fundacion', titulo: `Fundación · ${fundacion.fundacion}`, color: '#2f6fa3' })
    actores.push(fundacionActor)

    await test.step(`3 · ${fundacion.fundacion} recibe la solicitud y decide: ${DECISION}`, async () => {
      const { page } = fundacionActor
      await page.goto('/login')
      await paso(fundacionActor, 'Paso 3 de 5 · Entrar al panel de la fundación')
      await iniciarSesion(page, fundacion.correo, fundacion.contrasena)
      await expect(page).toHaveURL(/\/fundacion\/solicitudes$/, { timeout: 90_000 })

      const fila = page.locator(`a[href="/fundacion/solicitudes/${registro.solicitudId}"]`)
      await expect(fila).toContainText(persona.completo, { timeout: 60_000 })
      await expect(fila).toContainText(`Quiere adoptar a ${mascota.nombre}`)
      await expect(fila).toContainText('Recibida')
      await paso(fundacionActor, `Paso 3 de 5 · Llegó la solicitud de ${persona.completo}`)
      await pausa(page, 1.5)
      await fila.click()

      const detalle = page.locator('section[aria-live="polite"]')
      await expect(detalle.getByRole('heading', { level: 2 })).toContainText(`quiere adoptar a ${mascota.nombre}`)
      await pausa(page, 1.5)
      await detalle.getByRole('button', { name: 'Pasar a revisión' }).click()
      await expect(detalle.getByText('En revisión', { exact: true })).toBeVisible()
      await pausa(page)

      const dialogo = page.getByRole('dialog')
      if (DECISION === 'aprobar') {
        await paso(fundacionActor, `Paso 3 de 5 · Aprobar la adopción de ${mascota.nombre}`)
        await detalle.getByRole('button', { name: 'Aprobar adopción' }).click()
        await expect(dialogo).toContainText(`¿Aprobar la adopción de ${mascota.nombre}?`)
        await pausa(page)
        await dialogo.getByRole('button', { name: 'Aprobar adopción' }).click()
      } else {
        await paso(fundacionActor, 'Paso 3 de 5 · No aprobar la solicitud (con el motivo)')
        await detalle.getByRole('button', { name: 'No aprobar' }).click()
        await escribir(dialogo.getByLabel('Motivo'), MOTIVO_RECHAZO)
        await pausa(page)
        await dialogo.getByRole('button', { name: 'No aprobar' }).click()
      }
      // PATCH /api/solicitudes-adopcion/{id}/estado
      await expect(detalle.getByText(esperado.etiqueta, { exact: true })).toBeVisible({ timeout: 60_000 })
      await expect(detalle).toContainText('Decisión tomada el')
      registro.resultado = `${esperado.etiqueta} (solicitud #${registro.solicitudId})`
      await captura(fundacionActor, testInfo, `solicitud ${esperado.etiqueta.toLowerCase()}`)
      await pausa(page)
    })

    await test.step('4 · La persona ve la respuesta de la fundación', async () => {
      const { page } = personaActor
      await page.bringToFront()
      await page.reload()
      await paso(personaActor, 'Paso 4 de 5 · Ver la respuesta de la fundación')
      await expect(encabezadoSolicitud(page, mascota.nombre)).toContainText(esperado.etiqueta, { timeout: 60_000 })
      if (DECISION === 'aprobar') {
        await expect(page.getByRole('status').filter({ hasText: `aprobó la adopción de ${mascota.nombre}` })).toBeVisible()
        await captura(personaActor, testInfo, 'adopción aprobada')
        await pausa(page, 1.5)
        // Al aprobar, la mascota queda ADOPTADO y sale del listado de adopción.
        await page.goto(`/adoptar?q=${encodeURIComponent(mascota.nombre)}`)
        await paso(personaActor, `Paso 4 de 5 · ${mascota.nombre} ya no aparece en Adoptar`)
        await expect(page.getByText('No encontramos mascotas con esos filtros')).toBeVisible({ timeout: 90_000 })
        await expect(page.locator(`a[href="/adoptar/backend/${mascota.id}"]`)).toHaveCount(0)
      } else {
        await expect(page.getByRole('status').filter({ hasText: MOTIVO_RECHAZO })).toBeVisible()
        await captura(personaActor, testInfo, 'solicitud no aprobada')
      }
      await pausa(page, 1.5)
    })

    // ── Administración ───────────────────────────────────────────────────────────────────────
    const adminActor = await nuevoActor(browser, testInfo, { clave: 'admin', titulo: 'Administración · Equipo PetMind', color: '#6b4fbb' })
    actores.push(adminActor)

    await test.step('5 · El administrador ve la cuenta nueva y las estadísticas', async () => {
      const { page } = adminActor
      await page.goto('/login')
      await paso(adminActor, 'Paso 5 de 5 · Entrar al panel de administración')
      await iniciarSesion(page, cuentas.admin.correo, cuentas.admin.contrasena)
      await expect(page).toHaveURL(/\/admin$/, { timeout: 60_000 })
      const menu = page.getByRole('complementary', { name: 'Menú del panel de administración' })
      await pausa(page)

      await menu.getByRole('link', { name: 'Usuarios', exact: true }).click()
      await paso(adminActor, 'Paso 5 de 5 · La cuenta nueva aparece en Usuarios (GET /api/usuarios)')
      await expect(page.getByText(/en el backend\.$/)).toBeVisible({ timeout: 90_000 })
      // Este buscador guarda el texto en la URL (?q=) y cada tecla es una navegación: escrito letra por letra
      // y rápido se pierden caracteres, así que se llena de una vez.
      await page.getByRole('searchbox', { name: 'Buscar por nombre, correo o ciudad' }).fill(persona.correo)
      const filaUsuario = page.getByRole('row').filter({ hasText: persona.correo })
      await expect(filaUsuario).toContainText(persona.completo)
      await expect(filaUsuario).toContainText('Persona')
      await expect(filaUsuario).toContainText('Backend')
      await expect(filaUsuario).toContainText('1 solicitud')
      await captura(adminActor, testInfo, 'usuario nuevo')
      await pausa(page, 2)

      await menu.getByRole('link', { name: 'Estadísticas', exact: true }).click()
      await paso(adminActor, 'Paso 5 de 5 · Estadísticas con los datos reales (API de Python)')
      await esperarEstadisticas(page)
      await pausa(page)
      const tarjeta = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { level: 2, name: 'Solicitudes de adopción por estado', exact: true }) })
      await tarjeta.scrollIntoViewIfNeeded()
      await pausa(page)
      await tarjeta.getByRole('button', { name: 'Ver tabla' }).click()
      const filaEstado = tarjeta.getByRole('row').filter({ has: page.getByRole('rowheader', { name: esperado.grafica, exact: true }) })
      await expect(filaEstado).toBeVisible()
      const cantidad = Number((await filaEstado.getByRole('cell').first().innerText()).replace(/\D/g, ''))
      expect(cantidad, `La gráfica debe contar la solicitud ${esperado.grafica.toLowerCase()}`).toBeGreaterThanOrEqual(decididasAntes + 1)
      await captura(adminActor, testInfo, 'estadísticas')
      await pausa(page, 3)
    })

    if (dejarAbierto) {
      await guardarCuenta()
      await esperarCierre(actores, testInfo)
    }
  } finally {
    await guardarCuenta()
    for (const actor of actores) await cerrarActor(actor, testInfo)
  }
})
