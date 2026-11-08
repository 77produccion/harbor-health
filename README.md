# Harbor Health

Web comercial independiente de Harbor Health, submarca de Harbor Living. Astro + MDX + GSAP, seis vistas y siete idiomas: español, inglés, neerlandés, francés, portugués, alemán y papiamentu.

**Estado:** prototipo en borrador/noindex, pendiente de aprobación visual, clínica, legal y lingüística. Subir el código a GitHub no publica la web ni autoriza su lanzamiento.

## Empezar

Requiere **Node.js 22.23.4 o superior** y npm, según la versión instalada de Astro. No necesita los otros proyectos de Harbor ni las skills del workspace original.

```sh
git clone https://github.com/77produccion/harbor-health.git
cd harbor-health
npm ci
npm run dev
```

Abrir http://127.0.0.1:4321/es/. La configuración de entorno es opcional para desarrollo; usar `.env.example` como referencia, sin guardar secretos en Git.

## Organización

| Carpeta | Uso |
| --- | --- |
| `src/` | Rutas Astro, componentes, estilos, GSAP, vídeo, SEO y medición consentida. |
| `content/pages/{locale}/` | Copy y SEO canónicos de las 42 páginas MDX. |
| `content/home-ui.*.json` | Controles y microcopy de los siete idiomas. |
| `content/site.json` | Idiomas, mercados, avisos y destinos CTA. |
| `content/editorial/evidence.json` | Fuentes y bloqueos editoriales usados por los validadores; no se expone al visitante. |
| `public/images/` | Imágenes utilizadas y originales necesarios para regenerarlas. |
| `public/videos/` | Únicamente los dos clips integrados. |
| `public/assets/motion/` | CSS de microinteracciones utilizado por la home. |
| `scripts/` | Generación de imágenes, validación de contenido y build protegido. |
| `tests/` | Pruebas unitarias y de navegador. |
| `docs/` | Guía del proyecto, inventario de recursos y alcance del repositorio. |

Los componentes experimentales, imágenes antiguas, vídeos en reserva, skills, auditorías, capturas, grabaciones, dependencias y builds locales no forman parte del repositorio.

## Validar

```sh
npm run content:check
npm test
npm run check
npm run build
npm run test:browser
```

Las pruebas de navegador usan Edge en Windows. En otros sistemas, instalar Chromium con `npx playwright install chromium`. Para evitar un servidor ya abierto, ejecutar con otro puerto mediante `PLAYWRIGHT_PORT` (por ejemplo, `4322`).

`npm run build` regenera las imágenes y produce una preview estática en `dist/`. `npm run preview` permite revisarla. No subir `dist/` ni `node_modules/` a Git.

## Publicación

`npm run build:publish` exige dominio real (`SITE_URL`) y revisiones aprobadas. **Debe bloquear el contenido actual.** No retirar el bloqueo ni cambiar los borradores a aprobados para obtener un build de producción.

GA4/GTM son opcionales: configurar solo uno y mantener el consentimiento previo. No hay carga de documentos, atención clínica, cobros ni autenticación dentro de esta web; los accesos llevan a los destinos configurados en `content/site.json`.

## Documentación útil

- [Guía del proyecto](docs/project-guide.md): marca, contenido, movimiento, SEO y pendientes.
- [Imágenes y vídeos](docs/assets.md): originales, derivados, consumidores y límites de uso.
- [Alcance del repositorio](docs/repository.md): qué se conserva y qué queda fuera.
- [Recursos de terceros](THIRD_PARTY_NOTICES.md).
