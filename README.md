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


## MotorWr 2.0 beta (rama feature/multi-champion-v2)

La versión estable de Camille FAST sigue siendo el punto de entrada. El enlace
MotorWr 2.0 BETA abre la página multi.html, una experiencia alternativa con
selección del campeón propio, rol, cuatro aliados y cinco rivales.

- src/data/champions.js: 138 fichas editoriales heredadas. No es un censo
  confirmado de los campeones disponibles en Wild Rift en el parche vigente.
- src/core/multiChampion.js: validación de posiciones, duplicados y análisis
  de composiciones con etiquetas heurísticas.
- src/data/tacticalProfiles.js: perfiles editoriales específicos iniciales.
  Los demás campeones reciben indicaciones por rol y características, sin
  fingir perfiles individuales verificados.
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
