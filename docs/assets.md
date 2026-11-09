# Imágenes y vídeos utilizados

Solo se versionan recursos con consumidor en la web, en sus pruebas o en la generación del build. No se incluyen carpetas maestras de marca, stock de prototipos, capturas de auditoría ni vídeos en reserva.

## Originales de build

En `public/images/`; se conservan intactos. Los nombres aportados se mantienen para no perder su trazabilidad.

| Original | Uso / derivados generados |
| --- | --- |
| `harbor-health.png` | Logo aportado; `harbor-health-symbol.webp` para navegación y `favicon.png`. |
| `9c56b27b-189b-4bf5-b585-020fa04d786f.png` | Manos escribiendo: `home-preparation-1536.webp`, `home-preparation-960.webp`, `editorial-writing-1400.webp`. |
| `b87f262f-a492-4ef8-ac85-de128a1a4eef.png` | Documentos/cuaderno: `home-documents-1400.webp`, `editorial-notes-1400.webp`. |
| `98bbb4c4-4ab4-4b05-a495-fcfc87a9b568.png` | Preparación de preguntas: `editorial-questions-1400.webp`, hero del ejemplo. |
| `ad93f76a-3fe9-4a15-bbfe-bba72801806d.png` | Retrato ilustrativo: `home-professional-900.webp`, `editorial-clinician-1000.webp`. |
| `2154c642-f58e-4b4c-8ad8-96a1a357701d.png` | Agua de cierres: `home-water-800.webp`, `home-water-1600.webp`, `editorial-ocean-1600.webp`. |

`scripts/build-assets.mjs` y sus módulos de imágenes regeneran los derivados y las siete imágenes Open Graph `og-health*.png` desde los MDX. No necesitan archivos de carpetas hermanas ni servicios externos. También se incluyen los derivados actuales para disponer de ellos desde el primer checkout.

## Vídeos y posters

| Clip en `public/videos/` | Consumidor | Poster en `public/images/` |
| --- | --- | --- |
| `health-workspace-720.mp4` | Hero de home. | `home-workspace-poster-{800,1600}.webp`. |
| `health-professional-720.mp4` | Sección profesional de home y hero de profesionales. | `home-clinician-poster-{800,1600}.webp`. |

Los cuatro posters se conservan como recursos ya extraídos de los clips, a 0,5 segundos para evitar el inicio negro. Se sirven con `srcset`; no hace falta FFmpeg para construir. Si cambia un clip, sustituir también sus dos posters y ejecutar las pruebas de medios.

Los MP4 originales `harbor-line-visual.mp4` y `harbor-line-visual (1).mp4` se conservan intactos (14,4 y 9 MB). Los consumidores usan derivados H.264 1280×720, sin audio, CRF 29, preset slow, `yuv420p` y `faststart`: 1,38 y 0,92 MB, aproximadamente un 90% menos en conjunto. No se recorta ni cambia la duración. Se generaron con FFmpeg; se entregan ya generados y compilar no requiere instalarlo. No se incluyen los clips `(2)` de ejercicio ni `(3)` de tensión arterial: no están integrados y no acreditan prestaciones de Health.

Las fotografías de `ScenePhoto.astro` usan ocho variantes `cinematic-{preparation,documents,questions,clinician}-{480,800}.webp`, regeneradas desde los originales por `scripts/build-editorial-images.mjs`. El `sizes` de cada consumidor evita descargar el original de 1400 px en marcos pequeños. Las capturas profesionales y móvil también declaran el tamaño real de su composición.

## Capturas de producto

`content/product-captures.json` contiene dimensiones, pies y textos alternativos de las ocho capturas integradas, además de los controles del visor en siete idiomas. Las capturas siguen en inglés, con `lang="en"`, sin simular traducciones de la interfaz. `ProductCapture.astro` proporciona carga diferida, fuentes responsive y enlaces a la imagen completa. Con JavaScript, `src/scripts/capture-viewer.ts` abre un diálogo en la misma página, con entrada/salida suave, zoom, desplazamiento de la imagen ampliada, Escape, cierre exterior y retorno del foco. La imagen completa se carga al abrir el visor. Sin JavaScript, el enlace conserva su destino en la misma pestaña; no abre ventanas nuevas.

Las imágenes de `public/images/product/source/` son fuentes recortadas y saneadas para el build, no copias de los originales privados. `scripts/build-product-images.mjs` genera los WebP de 480/960/1600 px cuando corresponde y una variante de tamaño completo, sin ampliaciones. No requiere las carpetas hermanas. Los originales aportados permanecen intactos fuera del repositorio comercial.

| Fuente aportada | Fuente saneada | Consumidor |
| --- | --- | --- |
| `01 Harbor Web/...174046.png` | `upload.png` | Cómo funciona, documentos; solo foto/archivo/texto, sin destacar el conector pendiente. |
| `01 Harbor Web/...174058.png` | `results.png` | Home, documentos; sin barra de cuenta. |
| `01 Harbor Web/...174111.png` | `laboratory.png` | Home, dato y explicación; valores, rangos y estados ocultos de forma irreversible. |
| `01 Harbor Web/...174159.png` | `questions.png` | Home, preparación de consulta; página de ejemplo. |
| `02 Harbor App/...170710.jpg` | `mobile-questions.png` | Cierre de home, experiencia móvil; sin barra de estado del teléfono. |
| `04 Portal Médico/...174540.png` | `medical-library.png` | Conocimiento y límites; profesionales, gobernanza. |
| `04 Portal Médico/...174725.png` | `medical-proposal.png` | Home, procedencia; profesionales, participación. |
| `04 Portal Médico/...174835.png` | `medical-status.png` | Home, participación editorial. |

No se incluyen nombres, correos de cuenta ni conversaciones personales. No se utilizan los logins de Developer o Superadmin como prueba de funciones internas, ni el portal editorial como atención de pacientes. Las capturas no acreditan por sí solas disponibilidad, validación clínica ni autorización de publicación; los bloqueos editoriales siguen vigentes.

## Fuentes y CSS

Lora/Poppins se instalan con npm y se incorporan al build local: no se suben carpetas maestras de fuentes ni `node_modules/`. GSAP y Lucide también se resuelven desde `package-lock.json`.

`public/assets/motion/motion.css` es el único recurso de la skill que carga la web; su copia se conserva en el repo, sin requerir `.agents/`. La política propia de Harbor está separada en `src/styles/motion-policy.css`. Ver [avisos de terceros](../THIRD_PARTY_NOTICES.md).

## Derechos y publicación

Las fotografías/vídeos son ilustrativos, no testimonios ni capturas de pacientes o del equipo de Harbor. Sus derechos, consentimiento de personas y aprobación final siguen pendientes. Mantener el bloqueo editorial de recursos antes de una publicación comercial.
