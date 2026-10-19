# MotorWr

Repositorio de la PWA Camille FAST para Wild Rift. La aplicación y la automatización de despliegue usan este repositorio existente, sin crear otro.

## Despliegue

GitHub Actions ejecuta pruebas estáticas y publica en **el proyecto Cloudflare Pages existente** mediante Wrangler. Para activar la publicación configure:

- GitHub → Settings → Secrets and variables → Actions → **Secrets**:
  - `CLOUDFLARE_API_TOKEN`: token de Cloudflare restringido al permiso *Account → Cloudflare Pages → Edit*.
  
No añada credenciales a este repositorio ni las comparta en el chat.

El despliegue apunta al proyecto existente `buldwr` de Cloudflare Pages (cuenta ya configurada) y a la rama `main`; no crea un proyecto nuevo. Solo hay que guardar `CLOUDFLARE_API_TOKEN` como secreto del repositorio. Las pull requests solo comprueban cambios. El workflow fallará sin credenciales, **sin tocar el sitio en producción**.

## Operación

- `index.html`: aplicación web.
- `manifest.webmanifest` y `sw.js`: soporte PWA.
- `.github/workflows/cloudflare-pages.yml`: pruebas y despliegue.
- `scripts/check.mjs`: comprobación estática automatizada.

La interfaz seguirá llamándose *Camille FAST*; **MotorWr** es el nombre fijo del repositorio.

## Alcance

Guía táctica basada en reglas, no en datos en vivo del servidor chino. Los resultados son orientativos y deben contrastarse con el juego vigente.


## MotorWr 2.1 beta (rama feature/multi-champion-v2)

La versión estable de Camille FAST sigue siendo el punto de entrada. El enlace
MotorWr 2.0 BETA abre la página multi.html, una experiencia alternativa con
selección del campeón propio, rol, cuatro aliados y cinco rivales.

- src/data/champions.js: 142 fichas cuyos nombres y URLs proceden del catálogo oficial de
  Riot Wild Rift 7.3b, consultado el 2026-10-19. Las etiquetas editoriales
  previas solo se usan para los campeones coincidentes.
- src/core/multiChampion.js: validación de posiciones, duplicados y análisis
  de composiciones con etiquetas heurísticas.
- src/data/tacticalProfiles.js: perfiles editoriales específicos iniciales.
  Los demás campeones reciben indicaciones por rol y características cuando
  existen etiquetas editoriales. Los nuevos sin clasificar no reciben cifras inventadas.
- multi.html: interfaz móvil, buscador, persistencia local y retorno a Camille FAST.
- tests/multiChampion.test.mjs: pruebas de roles, seguridad y cobertura.

Limitaciones: todavía no hay perfiles contrastados de objetos, runas y habilidades
para todos los campeones. No se consulta en vivo al servidor chino ni la API
de Wild Rift. Antes del lanzamiento general, contrastar catálogo oficial por
parche, perfiles, derechos de recursos Riot y QA móvil completo.

Ejecutar npm test y npm run build. El build incluye HTML y módulos JavaScript
en dist. El service worker precarga la beta para uso offline.

La rama beta debe pasar revisión y QA antes de fusionarla a main. El workflow de
producción publica exclusivamente desde main; un workflow separado podrá subir
versiones de vista previa sin sustituir la producción.

### Fuente oficial del roster y cambios de parche

- Roster oficial (142): https://wildrift.leagueoflegends.com/en-us/champions/
- Notas oficiales 7.3b (2026-10-14): https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3b/
- Referencias de objetos, runas y habilidades: src/data/buildReferences.js

La beta tiene diez combinaciones de campeón/rol con referencias editoriales
de WildRiftFire (siete campeones: Camille, Lee Sin, Yasuo, Jinx, Ahri,
Thresh y Brand). Cada ficha aporta patch, fecha de contraste y URL de
tercero. No son estadísticas de partidas ni builds oficiales o chinas.
No se inventan recomendaciones para combinaciones sin referencia.

src/data/patchNotes.js contiene datos de ocho campeones, seis objetos y
cuatro runas con cambios recogidos en las notas oficiales de 7.3b.

La interfaz se destina a preparación/revisión y **no** interactúa con Wild Rift,
lee partida en vivo, realiza overlays, ni automatiza decisiones en el cliente.
**Alcance actual: uso exclusivamente personal.** Sin registro de usuarios, distribución comunitaria, monetización ni promoción. La revisión asociada a un lanzamiento masivo queda fuera de alcance. Se deben seguir respetando las políticas y licencias aplicables de Riot; su política general menciona registro y auditoría de productos de terceros, por lo que no se declara una exención jurídica automática.

#### Criterios de funcionamiento privado y mantenimiento

- [x] Roster oficial 7.3b y 142 URL por campeón.
- [x] Bloquear duplicados por equipo y entre equipos en la interfaz.
- [x] Advertir daño/control desconocido, en lugar de puntuarlo como cero confirmado.
- [x] Referencias con origen, fecha, campeón, rol y parche.
- [x] Tests de cinco posiciones, referencias, patch, datos faltantes y PWA.
- [ ] Validar manualmente interfaz en Xiaomi y otros dispositivos.
- [ ] Incrementar perfiles por rol y referencias de fuente por parche.
- [ ] Revisar uso personal frente a políticas de Riot antes de cualquier distribución (no constituye autorización formal).
- [ ] Protección de acceso a GitHub y Cloudflare; verificar que el proyecto no sea accesible sin autenticación.
- [ ] Fusionar rama beta a la instancia personal solo cuando los controles técnicos sean aprobados.


## MotorWr MetaSync 2.2 — actualización automática continua

**Origen y frecuencia:** `.github/workflows/motorwr-meta-watch.yml` reside en la rama
predeterminada `main` porque GitHub ejecuta `schedule` solamente desde esa rama.
Los controles se programan a las **08:17 y 20:17 UTC** todos los días. El workflow
revisa `feature/multi-champion-v2`, nunca edita el sitio estable.

**Fuentes públicas identificadas:** índice oficial de notas de Riot,
`https://wildrift.leagueoflegends.com/en-us/news/tags/patch-notes/`;
una lista explícita de siete páginas WildRiftFire (diez combinaciones rol-campeón)
que ya figuraban en referencias editoriales. Se consulta un número acotado de páginas
y se respetan las restricciones de los sitios. No se extrae información de partidas,
cuentas, clientes de juego ni estadísticas TOP de China.

**Reglas del motor:**

1. Un parche solo se cambia cuando figura en las notas oficiales y se confirma
   la página concreta publicada por Riot. Una subida anómala de numeración bloquea
   la actualización hasta revisión.
2. La lista de campeones, objetos y runas mencionados en el parche se indexa
   automáticamente cuando se reconoce la estructura oficial. No se infieren
   valores numéricos ni dirección buff/nerf sin revisión.
3. En cada guía existente se comprueban el nombre del campeón, los roles indicados
   por la fuente, la versión de parche y los **seis objetos, cinco runas y dos
   hechizos**. Se compara su huella con la última versión aceptada.
4. Si la fuente del nuevo parche está atrasada, **se retiran las builds antiguas
   de las recomendaciones vigentes**. Un contenido ausente o una estructura
   inesperada no se reemplaza con suposiciones.
5. La prioridad de habilidades de la plantilla anterior no se considera
   actualizada automáticamente cuando el parche cambia; queda pendiente.
6. Las novedades se registran en `src/data/autoMeta.json` con referencia y fecha,
   pasan `npm test` y `npm run build`, y se despliegan únicamente en
   **Cloudflare Pages Preview**, sin tocar `main` ni producción.
7. Con conexión, la beta comprueba el JSON al abrir y al recuperar foco después
   de 30 minutos. La PWA prioriza el recurso actualizado en red, conserva su
   última copia válida y advierte explícitamente cuando está sin conexión.

**Comandos:** `npm run meta:check` comprueba fuentes sin escribir archivos;
`npm run meta:sync` actualiza exclusivamente `src/data/autoMeta.json`.
Se pueden simular un parche posterior y entradas corruptas con
`node tests/metaSync.test.mjs`.

**Limitaciones y cumplimiento:** las nuevas guías/roles que no figuren en la
lista de origen verificado necesitan admisión y revisión. Las transcripciones
de datos numéricos oficiales y las prioridades de habilidades nuevas no
se generan automáticamente, para evitar afirmaciones falsas. No se planifica distribuir como producto público. La política general de Riot incluye registro y auditoría de productos; la modalidad personal no constituye por sí misma una exención confirmada. No se ha realizado ese trámite desde esta automatización. Las pruebas remotas
no sustituyen QA físico en Android ni la autorización de Riot.

## Verificación final de la primera ejecución real (2026-10-19)

- Ejecución GitHub Actions del sincronizador: #39198127760, **SUCCESS**.
- El parser de Riot indexó 8 campeones, 6 objetos y 4 runas del parche 7.3b.
- Los siete sitios editoriales de la lista admitida fueron comprobados sin fallos.
- Se detectó un cambio específico en Yasuo/Barón: la referencia de runas quedó
  `Grasp of the Undying / Brutal / Last Stand / Legend: Alacrity / Second Wind`.
  Yasuo/Central conserva su referencia independiente.
- La copia actualizada quedó en `src/data/autoMeta.json` y se publicó
  automáticamente solo en la preview de Cloudflare.
- QA en navegador remoto: selección Yasuo/Barón, Yasuo/Central y Norra,
  cambios por parche, límites sin datos, enlace de origen y modo móvil ~390×844
  sin desbordamiento horizontal: pruebas satisfactorias.
- PWA beta instalable con manifiesto separado `manifest-multi.webmanifest`.
- Las pruebas no equivalen a homologación de Riot ni a pruebas físicas
  de instalación/offline en Xiaomi 15T; ambas pendientes de validación final.

## Decisión de producto: exclusivamente personal (2026-10-19)

MotorWr **no se desarrolla para la comunidad ni para obtener reconocimiento**.
El proyecto está destinado a una sola persona, sin usuarios externos, marketing,
cuentas públicas, patrocinio o monetización. Mantener guías, parches y runas
actualizados automáticamente sigue siendo parte del objetivo personal.

**Privacidad pendiente de infraestructura:** el repositorio GitHub
`Lockowom/MotorWr` fue verificado como `public` el 2026-10-19.
Tanto `buldwr.pages.dev` como `multi-champion-v2.buldwr.pages.dev`
son accesibles públicamente hasta que se apliquen políticas de autenticación.
No se declara el servicio privado antes de verificar GitHub Private y
Cloudflare Access en producción y todas las URL de preview. El nombre,
logo o texto de "uso personal" no restringen visitas.

**Revisión:** se retira del plan el proceso de aprobación para un
lanzamiento comunitario inexistente. No se eliminan controles técnicos,
seguridad, trazabilidad, licencias o las obligaciones aplicables de Riot.
Referencia: https://developer.riotgames.com/policies/general

## MotorWr 2.2.3 — iconografía verificada

La app usa iconos de objetos, runas y hechizos identificados en las guías
editoriales de WildRiftFire y retratos de habilidades de MOBAFire, que
muestran recursos gráficos propiedad de Riot y sus respectivos publicadores.
Son referencias a sus URL de origen; no se incorporan copias binarias al
repositorio y no se atribuye propiedad o patrocinio a MotorWr.

- `src/data/iconCatalog.js`: listado de URL verificadas para **45 objetos,
  29 runas, 5 hechizos, 24 habilidades específicas por nombre** y
  **40 iconos de slots P/Q/W/E/R** para los ocho campeones con guías.
- `src/core/iconResolver.js`: acceso exclusivo a las URL verificadas y
  fallback textual cuando no se dispone de icono (evita mostrar la imagen
  de otro objeto o una ruta no corroborada).
- `index.html` y `multi.html`: tarjetas con imagen, nombre y orden de
  compra/runa; hechizos ilustrados; Q/W/E/R y secuencia del nivel 1 al 15.
- `sw.js`: guarda las imágenes cargadas desde los dos proveedores admitidos,
  de modo que puedan reutilizarse sin conexión después de haberse visto.
  **No garantiza** disponer offline de imágenes nunca cargadas.
- `tests/iconCatalog.test.mjs`: garantiza que la fuente actual de las guías
  con builds mostradas dispone de iconos para todos sus objetos, runas,
  hechizos y habilidades; `tests/serviceWorker.test.mjs` comprueba
  caché/reutilización offline y bloqueo de hosts no permitidos.

**Actualizaciones futuras:** el catálogo de nombres de iconos es independiente
de los datos MetaSync. Cuando un parche añada un objeto o runa desconocida
para el atlas actual, seguirá mostrándose su nombre legible con inicial
en lugar de enlazar una URL de icono inventada; revisar el atlas periódicamente
junto al mantenimiento de guías. La app permanece orientada al uso personal.

### MotorWr 2.2.4 — fiabilidad de iconos de habilidades

Los retratos Q/W/E/R y pasivas de los ocho campeones referenciados usan ahora
los ficheros especificados por Riot Data Dragon (versión 16.18.1).
Los datos estratégicos siguen siendo del parche **Wild Rift 7.3b**, mientras
que los iconos son únicamente referencias visuales del cliente de League of
Legends: no confundir estas versiones. El catálogo de Riot queda fijado por
versión para evitar que futuras actualizaciones cambien imágenes sin revisión.
Se mantienen nombres visibles y alternativa con letra si un recurso está roto.
El Service Worker almacena esos iconos oficiales después de verse y las
pruebas garantizan que las prioridades específicas conservan Q/E/W correctas.
