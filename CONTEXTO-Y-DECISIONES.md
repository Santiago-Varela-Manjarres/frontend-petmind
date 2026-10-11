# PetMind · Contexto y decisiones de las visuales

Bitácora del trabajo para pasar a React **todas** las pantallas de `02-Visuales PetMind/03 - Mockups de pantallas` (42 pantallas + la página de inicio de `01 - Referencia de diseño`).
Se actualiza a medida que avanza el trabajo: qué se hizo, cómo está organizado y por qué se tomó cada decisión.

> Estado: **pausado y traspasado a Codex** (20:21). Claude hizo la base y las secciones Inicio, 01, 02 y 03; Codex sigue con 04 a 08 siguiendo `PROMPT-CODEX.md`, y después Claude audita. Ver secciones 2 y 5.

---

## 1. Qué se pidió

> "Hazme todas estas visuales" (carpeta `03 - Mockups de pantallas`) y "crea un archivo de texto en la carpeta con el contexto de todo lo que vas haciendo y decisiones".

- Fuente de verdad: los PNG de cada sección (`00 - Mapa de navegación` + pantallas numeradas) y `00 - Mapa general de PetMind.png`.
- Se construye sobre lo que ya estaba en `main` (Navbar, Hero, PetCard, FeatureCards, Footer, ThemeProvider, layouts, títulos por página, favicon).
- Sin commits ni push: todo queda en el árbol de trabajo para que Brayan lo revise.

## 2. Estado por sección

| Sección | Pantallas | Estado |
|---|---|---|
| Base (estilos, íconos, datos, contextos, layouts) | — | ✅ |
| Inicio | 1 | ✅ |
| 01 · Acceso | 9 | ✅ |
| 02 · Adopción | 8 | ✅ |
| 03 · Donaciones | 6 | ✅ |
| 04 · Fundaciones | 2 | ✅ Implementado; revisión visual en navegador pendiente por indisponibilidad de CUA |
| 05 · Historias | 2 | ✅ Implementado; revisión visual en navegador pendiente por indisponibilidad de CUA |
| 06 · Institucional y reportes | 4 | ✅ Implementado; revisión visual en navegador pendiente por indisponibilidad de CUA |
| 07 · Panel del usuario | 5 | ✅ Implementado; revisión visual en navegador pendiente por indisponibilidad de CUA |
| 08 · Panel de la fundación | 6 | ✅ Detalles completados; lint y build validados; revisión visual manual pendiente |

## 3. Decisiones (y por qué)

1. **Sin librerías nuevas.** Solo React + `react-router-dom`, como dice la regla 4 del plan. Los íconos son SVG propios en `components/ui/Icon.jsx` (trazo estilo Lucide) y la gráfica del panel de la fundación se dibuja con HTML/CSS.
2. **Estilos:** CSS Modules por componente/página + las variables de `styles/global.css`. Los colores salen medidos de los mockups (verde `#0b6b67`, coral `#f17155`, azul `#4f8fc4`, ámbar, morado, fondo `#faf9f6`, pie `#083f3d`). Todo usa variables para que el modo oscuro siga funcionando.
3. **Tipografías:** Plus Jakarta Sans (ya estaba) y **Caveat Brush** para los textos a mano ("Más que mascotas…", "¡Hola de nuevo!", "Campaña destacada"…). Se identificó comparando los mockups.
4. **Estado global con Context API**, un contexto por dominio y en dos archivos (`XContext.js` + `XProvider.jsx`) para cumplir la regla `react-refresh/only-export-components`, igual que `ThemeContext`.
5. **Fechas relativas a hoy** en los datos de prueba (días restantes de campañas, "hace 2 horas", la entrevista "el lunes"), para que la demo nunca muestre campañas vencidas ni fechas pasadas como "próximas".
6. **Rutas privadas:** `/cuenta/*` pide sesión de persona y `/fundacion/*` sesión de fundación, como en el mapa general ("Con sesión iniciada"). Al entrar sin sesión se va a `/login` y, al iniciar, se vuelve a la página que se quería ver.
7. **Persistencia de la demo:** los contextos guardan su estado en `localStorage` (`hooks/usePersistentState.js`), así lo creado sobrevive a un F5. Si pasan más de 3 días sin usarla, vuelve a los datos de prueba. Los datos de tarjeta nunca se guardan.
8. **Mismos nombres en todo el sitio:** los mockups usan nombres de ejemplo que a veces chocan entre pantallas (p. ej. el gato de "Milo y Ana" es Simón en otra). Se dejó una sola versión por mascota y fundación, y Toby es una campaña (no una mascota en adopción) porque su foto es la de Rocky "antes".
9. **Donar sin cuenta:** se puede donar sin iniciar sesión (los datos se piden en el paso 2). Si hay sesión, se llenan solos y la donación aparece en Mi cuenta.
10. **Frecuencia por defecto "Una sola vez":** el mockup muestra "Mensual" marcado porque es el ejemplo de Brayan; dejarlo marcado por defecto sería un cobro recurrente que la persona no eligió. Los botones del Fondo PetMind sí abren con "Mensual" cuando se elige esa opción.
11. **Pagos simulados:** tarjeta con validación real (Luhn, vencimiento, CVV). `4000 0000 0000 0002` simula un pago rechazado (queda en el historial como "Rechazada", como en el mockup de Mis donaciones). Las mensuales solo permiten tarjeta, como dicen los textos del mockup.
12. **Comprobantes y certificados:** se descargan como archivo de texto generado en el navegador; sin backend no hay PDF real.
13. **Conteos en vivo:** número de mascotas y campañas de cada fundación (directorio, perfil, menú del panel) se calculan con los datos reales del contexto, para que al publicar una mascota el número suba. Las cifras históricas (adopciones, donaciones, reseñas) salen de los datos de prueba.

_(Se irán agregando más decisiones abajo a medida que aparezcan.)_

14. **Secciones 04 a 08:** se añadieron las rutas públicas de fundaciones, historias, contacto, institucional y reportes; las cuentas privadas usan `DashboardLayout` y filtran datos por `user.id` o `user.foundationId`. Los formularios y acciones persisten en los contextos `petmind.v1.*` existentes.
15. **Sin servicio de backend:** los reportes notifican a las primeras fundaciones verificadas usando distancias de demostración; no hay coordenadas en los datos actuales para calcular cercanía real. El mapa, documentos, certificados, mensajes, invitaciones y pagos se mantienen como demostración local.
16. **Alcance de los paneles:** se priorizaron acciones funcionales con los esquemas y componentes disponibles; detalles de interacción como gráfica, adjuntos avanzados y drag-and-drop requieren revisión visual y funcional contra los mockups.
17. **Sección 08, cierre de detalles:** el tablero usa arrastrar/soltar nativo y un selector accesible; la reprogramación modifica la solicitud compartida con el seguimiento de la persona. Las fotos subidas se guardan en el navegador y las campañas siguen siendo una simulación local.
18. **Datos del gráfico:** `monthlyDonationsByFoundation` y `monthlyDonationCounts` son las series de demostración existentes; el índice final representa el mes actual. Los nombres de meses se calculan hacia atrás desde el mes local para mantener la serie alineada.
## 4. Bitácora

_Las entradas van en orden; solo la última tiene hora real._


- **2026-10-10 · inicio** — Revisión de las 42 pantallas, los 8 mapas de navegación y los recursos gráficos. Se midieron colores y se identificó la fuente manuscrita. Se definió la estructura de carpetas, rutas y contextos.
- Base lista: variables y clases en `global.css` (+ tema oscuro en `ThemeProvider.css`), íconos, utilidades (`utils/format.js`, `utils/dates.js`), datos de prueba (`data/`), 9 contextos, layouts (principal, acceso, donación y panel) y componentes de `ui/`, `forms/` y `cards/`. Fotos y logo copiados a `public/img/`.
- Inicio completo (hero, tarjetas de Emanuel, mascotas, historias, videos, banner y pie). Se revisó con capturas de Chrome contra la referencia.
- 01 · Acceso: las 9 pantallas, con validaciones y flujo real (registro → verificación → panel; recuperar → enlace → nueva → lista).
- 02 · Adopción: listado con filtros (todos funcionan y se combinan), perfil con galería y pestañas, formulario en 4 pasos (el paso va en `?paso=`, borrador automático, validación por paso), solicitud enviada y seguimiento con línea de tiempo y chat.
- 03 · Donaciones: listado con filtros y orden, detalle con pestañas, flujo de donar en 3 pasos (estado compartido en `DonarFlujo.jsx` con `useOutletContext`) y comprobante. Al pagar, la campaña suma el monto y el donante al instante (75% → 76% en Toby).
- **20:21** — Brayan pidió pausar y pasarle el trabajo a Codex. Estado al pausar: `npm run lint` y `npm run build` pasan (solo el aviso de tamaño del bundle). Se escribió `PROMPT-CODEX.md` con el contexto, las reglas, las APIs y la especificación de cada pantalla pendiente. Cuando Codex termine, Claude audita contra los mockups.

- **21:06** — Codex implementó secciones 04 a 08: directorio y perfil de fundaciones; historias y detalle; nosotros, contacto y reporte con seguimiento; panel de usuario y panel de fundación; rutas privadas/públicas, metadatos `es-CO` y README. `npm run lint` y `npm run build` pasaron; build mantiene el aviso por bundle >500 kB. Se corrigieron imports de `FileDropzone`/`FileChip`, enlaces de notificaciones y variables CSS de los paneles. No se completó la prueba visual: CUA informó que no había navegador configurado y la aprobación de la ventana Chrome agotó el tiempo; Vite arrancó en 5200 porque 5199 ya estaba ocupado. No se hizo ningún cambio de Git. Falta verificar tamaños 1440/390, tema claro/oscuro y flujos interactivos contra los mockups.
- **21:31** — Se completaron detalles de sección 08 en el panel de la fundación: gráfico anual con selector de periodo y tooltips; resumen con agenda y atención; tabla de mascotas con filtros, selección múltiple y paginación; editor con galería, portada, borradores y vista previa; tablero con filtro por mascota, orden por compatibilidad, tabla y drag-and-drop; detalle con información del hogar, mensajería, notas, historial, reprogramación compartida y decisión de rechazo; campañas con gastos dinámicos, fecha de cierre, soportes y borrador; donaciones aprobadas con total mensual; mensajes, equipo y documentos. Se agregó `Borrador` a los estados de mascota y `updateRequest` al contexto de adopciones. `npm run lint` y `npm run build` pasan; el bundle conserva la advertencia >500 kB. La comprobación visual queda pendiente: el servidor local en 5199 ya respondía, pero el arranque local devuelve `spawn EPERM` y no hay navegador expuesto al control visual en esta sesión. Brayan autorizó commit y push al final de esta tarea.
- **2026-10-11 · revisión de código** — Claude revisó todo `src/`. Bugs corregidos: el panel de la fundación conservaba el formulario anterior al cambiar de ruta (editar a Max mostraba los datos de Luna y "Guardar" sobrescribía a Luna; "Publicar mascota" y "Crear campaña" abrían el formulario anterior); los mensajes y notas de una solicitud no aparecían hasta reabrirla; el tooltip del gráfico y el detalle de la solicitud mostraban "$" sueltos; la paginación podía quedar fuera de rango; cerrar sesión desde una ruta privada terminaba en `/login`; el perfil dejaba usar el correo de otra cuenta; salir durante el pago simulado registraba la donación igual; datos dañados en `localStorage` o almacenamiento bloqueado dejaban la app en blanco; `SegmentedControl` pasaba `null` como `value`. Cambios de estructura: `PanelFundacion.jsx` se dividió en `views/fundacion/panel/`; `PanelCuenta.jsx` y otras vistas escritas en una sola línea se formatearon; los 10 contextos usan `createRequiredContext`; se agregaron `ErrorBoundary`, `useLogout` y carga diferida de pantallas (bundle principal de 669 kB a 349 kB). Se borraron 4 vistas de prueba sin uso. `npm run lint` y `npm run build` pasan y se recorrieron todas las rutas con Playwright sin errores en consola.

## 5. Traspaso

- Instrucciones para Codex: `PROMPT-CODEX.md` (raíz del repo). Codex debe seguir escribiendo en esta bitácora y marcar el estado de cada sección.
- Git: Claude no hizo commits ni push. Entre las 20:17 y las 20:19 otro proceso (no Claude) hizo 18 commits en la rama `feature/pantallas-petmind`, la subió a `origin` y el PR #10 quedó unido a `main` en GitHub. `PROMPT-CODEX.md` quedó sin commit. De aquí en adelante: nada de commits ni push sin autorización de Brayan.
- Cuentas de prueba: `brayan.ciro@correo.com` (persona) y `huellitas@correo.com` (fundación), contraseña `petmind123`.
- Para reiniciar los datos de la demo: borrar en el navegador las llaves `petmind.v1.*` de `localStorage`.
