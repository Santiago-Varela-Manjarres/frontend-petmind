# PetMind · Cuentas de la demo

> **Archivo privado.** Está en `.gitignore`: no se sube a GitHub. No lo pegues en chats ni en el repositorio.
> Creado el 7 de noviembre de 2026.

- Sitio: https://frontend-petmind.vercel.app
- API (backend en Render): https://backend-pet-mind.onrender.com/api
- La prueba de Playwright lee las mismas cuentas de `e2e/cuentas.local.json` (también ignorado por Git).

## Fundaciones (cuentas del backend)

Cada cuenta es la del representante legal de la fundación (rol `REPRESENTANTE_FUNDACION`). Entran por **Iniciar sesión** y llegan a `/fundacion/solicitudes`, donde aprueban, piden documentos o rechazan las solicitudes de sus mascotas.

| Fundación | Id | Representante | Correo | Contraseña | Usuario backend |
|---|---|---|---|---|---|
| Huellas del Valle | 17 | Mariana Restrepo Gil | `contacto@huellasdelvalle.example` | `T7S-w8xrCs4?` | 17 |
| Refugio Gatuno La Montaña | 18 | Juliana Arango Mejía | `hola@gatunolamontana.example` | `=y+AWgtf7Sy@` | 18 |
| Patas Unidas Bello | 19 | Carlos Andrés Zapata Ruiz | `patasbello@gmail.com` | _la tiene Brayan (escríbela aquí)_ | 14 |
| Fundación Corazón Peludo | 20 | Gloria Inés Vélez Toro | `adopciones@corazonpeludo.example` | `Wa-yUPa73HyG` | 19 |
| Refugio Alto Oriente | 21 | Felipe Echeverri Ríos | `refugio@altooriente.example` | `MBY9-#6Ld3Jn` | 20 |
| Bigotes y Colitas Sabaneta | 22 | Daniela Ochoa Cardona | `contacto@bigotesycolitas.example` | `_kQW7qa_wTKc` | 21 |

- Los correos son los de contacto que cada fundación ya tenía en el backend. El dominio `.example` está reservado: no recibe correos (y el backend tampoco envía).
- Las cuentas de las fundaciones 17, 18, 20, 21 y 22 se crearon el 7 de noviembre de 2026 y se comprobó que inician sesión.
- **Vida Happy** (id 23) sigue **pendiente** de verificación: el backend no deja crear su representante hasta que esté `VERIFICADA`.
- Las fundaciones 1 a 4 son datos de pruebas automáticas del backend; no se les creó cuenta.
- Pancho (Patas Unidas Bello) ya tiene dos solicitudes de prueba: no aprobar solicitudes sobre él.

## Administración

| Cuenta | Correo | Contraseña | Dónde existe |
|---|---|---|---|
| Equipo PetMind | `admin@petmind.co` | `petmind123` | Cuenta de demostración del frontend (el backend no deja crear cuentas `ADMIN`) |

En `/admin/usuarios` aparecen también las cuentas registradas en el backend (con la etiqueta *Backend*) y en `/admin/estadisticas` las gráficas con los datos reales.

## Cuentas de demostración local (solo en el navegador)

No existen en el backend: sirven para recorrer el sitio, pero **no pueden enviar solicitudes a las mascotas reales**. Contraseña de todas: `petmind123`.

| Tipo | Correo |
|---|---|
| Persona | `brayan.ciro@correo.com` |
| Fundación verificada | `huellitas@correo.com` |
| Fundación en revisión | `huellasdelcaribe@correo.com` |
| Fundación en revisión | `patasdeesperanza@correo.com` |
| Fundación rechazada | `gatosdeleje@correo.com` |

## Otras personas que ya estaban en el backend

Las crearon el equipo o pruebas anteriores; sus contraseñas no se conocen: `pedro@gmail.com` (Pedro Sanchez), `gomezmadrid118@gmail.com` (Emmanuel Gómez) y `santiago@gmail.com` (Santiago Jimenez). Los usuarios 2 a 12 (`…@petmind.com`) son de pruebas automáticas.

## Cómo correr la prueba del flujo (Playwright)

En PowerShell, desde la carpeta del frontend:

```powershell
npm run e2e:demo        # con el navegador visible y a ritmo de presentación
npm run e2e             # sin ventana (más rápido)
npm run e2e:reporte     # abre el reporte: pasos, capturas, videos y trazas
```

Con `npm run e2e:demo`, al terminar el recorrido **las tres ventanas quedan abiertas** (persona, fundación y administrador) para seguir mostrando el sitio a mano. La prueba termina cuando las cierras todas (o con `Ctrl+C` en la terminal); la persona creada ya quedó anotada abajo.

Opciones (antes del comando):

```powershell
$env:E2E_DECISION = 'rechazar'                  # la fundación no aprueba (por defecto: aprobar)
$env:E2E_FUNDACION = '18'                       # fundación que decide (por defecto, la primera con mascotas)
$env:E2E_MASCOTA = 'Nube'                       # mascota exacta (por defecto, la primera disponible)
$env:E2E_BASE_URL = 'http://localhost:5173'     # probar el frontend local (levanta Vite solo)
$env:E2E_PAUSA = '3000'                         # pausa entre pasos en ms (por defecto 2200 con ventana)
$env:E2E_TECLEO = '100'                         # ms entre teclas al escribir (por defecto 70 con ventana)
$env:E2E_CERRAR_AL_FINAL = '1'                  # cerrar las ventanas al terminar
Remove-Item Env:E2E_DECISION                    # quitar una opción
```

Cada corrida crea una persona nueva en el backend. Con **aprobar**, la mascota queda `ADOPTADO` y sale del listado; por eso la prueba escoge sola la siguiente mascota disponible.

> Mientras el cambio del panel de Usuarios del admin (lista las cuentas del backend) no esté publicado en Vercel, la prueba contra el sitio publicado falla en el paso 5. Hasta entonces córrela con el frontend local: `$env:E2E_BASE_URL = 'http://localhost:5173'; npm run e2e:demo`.
>
> Render apaga el backend y la API de Python cuando no se usan. Abre el sitio unos minutos antes de presentar para que la prueba no arranque esperando.

## Personas creadas por la prueba

La prueba agrega una fila por cada persona que registra, para poder entrar después con esa cuenta. Deja esta sección al final del archivo.

| Fecha | Persona | Correo | Contraseña | Mascota | Fundación | Resultado |
|---|---|---|---|---|---|---|
| 7/11/26, 9:50 p. m. | Valentina Ríos | `valentina.rios.1107215039@petmind.example` | `Adopta#2026` | Rocco (#62) | Huellas del Valle | No aprobada (solicitud #3) |
| 7/11/26, 10:02 p. m. | Valentina Ríos | `valentina.rios.1107220226@petmind.example` | `Adopta#2026` | Rocco (#62) | Huellas del Valle | Aprobada (solicitud #4) |
| 7/11/26, 10:06 p. m. | Valentina Ríos | `valentina.rios.1107220603@petmind.example` | `Adopta#2026` | Tobías (#64) | Huellas del Valle | No aprobada (solicitud #5) |
| 11/11/26, 9:06 p. m. | Valentina Ríos | `valentina.rios.1111210644@petmind.example` | `Adopta#820371` | Tobías (#64) | Huellas del Valle | Aprobada (solicitud #6) |
| 11/11/26, 9:09 p. m. | Valentina Ríos | `valentina.rios.1111210908@petmind.example` | `Adopta#310028` | Mora (#65) | Huellas del Valle | Recibida (solicitud #7) |
