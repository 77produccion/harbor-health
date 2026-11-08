# Alcance del repositorio

Destino: https://github.com/77produccion/harbor-health.git

La raíz es directamente el proyecto `harbor-health`, no una carpeta que englobe otros proyectos. No se incorpora `Harbor-web`, `Harbor-docs`, Living, manuales completos de marca ni otras carpetas del workspace.

## Incluido

- Rutas y dependencias locales de los componentes activos, estilos y controladores.
- Los 42 MDX y los siete diccionarios de controles; configuración de CTA, medición y evidencia necesaria para validar/bloquear publicación.
- Siete scripts operativos de `package.json` y sus dependencias.
- Pruebas unitarias/de navegador y configuración del proyecto.
- 30 imágenes: originales necesarios, derivados de página, posters y Open Graph. Dos vídeos efectivamente integrados.
- Lockfile, ejemplo de entorno vacío y documentación autocontenida de mantenimiento.

## Fuera de Git, conservado localmente

- `node_modules/`, `.astro/`, `dist/`, `.env` y archivos privados.
- `.agents/`, `.taste-skill/`, `skills-lock.json` y perfiles de navegador.
- Auditorías históricas, capturas, matrices generadas, grabaciones y `test-results/`.
- Los componentes antiguos `Hero.astro`, `HomeStory.astro` y `ProductDemo.astro`, que no tienen consumidores desde las rutas activas.
- Scripts antiguos de extracción de un concepto externo, preparación de stock, copia de skills y reportes de auditoría.
- Imágenes de prototipos sin consumidor, derivados móviles antiguos y vídeos `(2)`/`(3)` en reserva.

Estas exclusiones no borran ni sobrescriben los originales. `.gitignore` mantiene un allowlist de recursos/documentación: un recurso nuevo debe tener un uso y añadirse explícitamente antes de versionarlo.

## Reproducibilidad

`npm ci` + `npm run build` deben funcionar desde un checkout limpio sin acceder a carpetas hermanas. Los archivos externos citados en la evidencia son referencias históricas, no imports ni inputs de compilación. Los posters están versionados y las fuentes se instalan con npm.

La subida de código no retira noindex, no aprueba contenido, no activa analítica ni configura un despliegue. El lanzamiento sigue sujeto a los bloqueos documentados en [project-guide.md](project-guide.md).

## Verificación de la selección inicial

Se exportaron únicamente los 167 archivos seleccionados a un directorio limpio, sin skills, cachés, dependencias preexistentes ni carpetas hermanas. Desde esa copia se ejecutaron:

- `npm ci`: instalación reproducible desde el lockfile.
- `npm run content:check`: 42 MDX / 266 secciones válidos.
- `npm test`: 25/25.
- `npm run check`: 0 errores, warnings o hints.
- `npm run build`: 43 páginas estáticas.
- `PLAYWRIGHT_PORT=4322 CI=1 npm run test:browser`: 56/56 contra un servidor de esa copia, sin reutilizar el servidor del workspace original. En PowerShell, definir esas variables mediante `$env:PLAYWRIGHT_PORT` y `$env:CI` antes de ejecutar npm.

Estas comprobaciones acreditan que la selección puede ejecutarse de forma independiente, no una aprobación editorial o de producción.
