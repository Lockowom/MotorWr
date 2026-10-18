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
