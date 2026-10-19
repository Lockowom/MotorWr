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
Provisionalmente es un proyecto comunitario de acceso gratuito. Antes de
su lanzamiento masivo deben revisarse los requisitos de registro/auditoría
en el Developer Portal y la política vigente de Riot Games.

#### Criterios mínimos de publicación

- [x] Roster oficial 7.3b y 142 URL por campeón.
- [x] Bloquear duplicados por equipo y entre equipos en la interfaz.
- [x] Advertir daño/control desconocido, en lugar de puntuarlo como cero confirmado.
- [x] Referencias con origen, fecha, campeón, rol y parche.
- [x] Tests de cinco posiciones, referencias, patch, datos faltantes y PWA.
- [ ] Validar manualmente interfaz en Xiaomi y otros dispositivos.
- [ ] Incrementar perfiles por rol y referencias de fuente por parche.
- [ ] Revisar cumplimiento Riot/registro del producto.
- [ ] Fusionar beta a producción tras aprobación explícita.

