# Guía del proyecto

## Producto y alcance

Web comercial de Harbor Health, submarca de Harbor Living. No es la aplicación autenticada ni un servicio clínico. Combina un recorrido ilustrativo interactivo con capturas aportadas del producto, recortadas y saneadas sin datos identificables ni valores clínicos personales. No se suben documentos ni se atienden consultas médicas aquí.

Hay seis vistas en siete idiomas (`es/en/nl/fr/pt/de/pap`): home, funcionamiento, ejemplo, conocimiento y límites, profesionales y acceso. La home editorial se escribe en español; las traducciones siguen en borrador. Idioma y mercado son dimensiones distintas: traducir una página no acredita cobertura clínica.

## Fuente de verdad

- `content/pages/{locale}/people.mdx`: ocho Scene MDX v2 de home. El cuerpo guarda copy, orden y acciones; el frontmatter conserva SEO y revisión.
- Los otros cinco MDX por idioma usan el esquema v1 y se presentan con `EditorialPage.astro`.
- `scripts/scene-content.mjs`: parser restringido, sin ejecución de JSX/imports.
- `content/site.json`: destinos/etiquetas CTA, avisos y configuración compartida.
- `content/home-ui.{locale}.json`: microcopy de controles y PDF.
- `content/editorial/evidence.json`: referencias y pendientes usados por el validador. Los documentos externos citados son antecedentes, no archivos que haya que clonar para ejecutar la web.

No cambiar IDs al traducir. No duplicar copy público en componentes ni introducir aprobaciones ficticias. Las categorías de explicación L1/L2/L3 no demuestran planes, cobro ni acreditación médica.

## Marca y visuales

- Lora para títulos; Poppins para párrafos e interfaz, servidas localmente desde las dependencias de fuentes.
- Navy `#061a33`, teal `#01919f`, azul Health `#4971d1`; `#3558b0` es una adaptación funcional para acciones, no un color oficial nuevo.
- Health pertenece a Living; no se mezcla con Family ni se usa Verified como certificación sin evidencia.
- Cabecera compacta existente: símbolo aportado + `BrandWordmark.astro`. Un lockup horizontal oficial sigue pendiente de aprobación.
- Sin badges de relleno, actividad clínica ficticia ni tarjetas repetidas por sistema. Iconografía necesaria desde Lucide.

Los recursos ilustrativos y sus originales están inventariados en [assets.md](assets.md). No se acredita propiedad, consentimiento de personas ni licencia de producción solo por disponer del archivo.

Las capturas se integran junto a la función que ilustran y permiten abrir el WebP completo sin JavaScript. El portal médico se presenta como espacio editorial, distinto del acceso profesional de lectura. No se muestran etiquetas de versión/prototipo en la interfaz; esto no modifica los estados de revisión, `noindex` ni los bloqueos de publicación.

## Movimiento y vídeos

### Rediseño fotográfico de noviembre

La versión editorial anterior está guardada en el commit `478e2ec`. La nueva dirección usa `src/styles/cinematic.css`, aislado bajo `body.cinematic-site` para que el CSS compartido de Astro no pierda prioridad ante estilos de ruta. Mantiene Lora/Poppins y el copy canónico sin reescribirlo.

La home combina película 16:9 completa y fotografía en portada; contexto fotográfico en documentos y consulta; retrato ilustrativo y captura editorial sobre navy; película profesional amplia; FAQ nativa con la primera respuesta crítica abierta; cierre con agua y captura móvil. `ScenePhoto.astro` contiene solo fotografías decorativas, sin una segunda fuente de copy. El proceso interior conserva su recorrido sticky reversible cuando cabe.

Los pies de captura y enlaces de ampliación se mantienen por trazabilidad y lectura sin JavaScript, aunque la skill genérica los penaliza. Tampoco se fuerzan alturas exactas de pantalla, se cambia el logo ni se reescribe el contenido clínico para satisfacer su checker. El gate visual local no constituye aprobación; sus informes quedan en `.taste-skill/`. No se añaden recursos externos ni se cambia la política de movimiento reducido.

- `src/scripts/home.ts`: estado y recorrido compartido de documentos, lectura y consulta; categorías, niveles, preguntas y PDF.
- El recorrido de home fija únicamente `.hw-journey-stage` en escritorio desde 1000×600 px. Los tres capítulos de texto mantienen su altura natural y activan el panel al avanzar o retroceder; un clic de pestaña lleva al capítulo correspondiente. Las fotos y traducciones largas ya no desactivan el sticky por exceder la altura disponible. En móvil y ventanas de menos de 600 px de alto conserva la selección manual. El cuerpo del producto puede desplazarse dentro del panel en ventanas bajas, sin ocultar pestañas ni el pie.
- `src/scripts/editorial-motion.ts`: SplitText, apertura fotográfica y refresh de geometría.
- `src/scripts/scene-motion.ts`: proceso sticky reversible y lectura progresiva en páginas interiores. En móvil/ventanas bajas conserva altura natural.
- `src/scripts/editorial-video.ts`: autoplay silenciado al entrar en escena, pausa fuera de pantalla y con pestaña oculta, pausa manual persistente y fallback de poster. Ahorro de datos/2G requiere play manual; el navegador también puede bloquear autoplay.
- `src/styles/motion-policy.css`: excepción de Harbor al movimiento reducido. El responsable solicitó experiencia completa incluso con `prefers-reduced-motion: reduce`; **puede afectar a personas con sensibilidad vestibular y no equivale a aprobación de accesibilidad**.

Scroll nativo, sin scroll-jacking ni navegación dependiente de animaciones. No rotar/deformar el logo. Mantener lectura, enlaces y posters sin JavaScript.

## SEO, privacidad y medición

Sin `SITE_URL` real o aprobaciones, la preview queda noindex, sin canonical inventado y con sitemap público vacío. Los endpoints `llms.txt`/`llms-full.txt` no exportan borradores ni metadatos internos. No declarar precios, reseñas, certificaciones o funciones no verificadas en schema.

GA4 **o** GTM, nunca ambos; sin IDs reales no hay envío externo. Se requiere consentimiento y se respetan GPC/DNT. Los eventos solo admiten propiedades enumeradas: no documentos, valores clínicos, nombres, preguntas libres ni URLs/query completas. Un clic de acceso no demuestra venta ni registro.

## Estado antes de lanzamiento

La revisión del rediseño incluye 29 pruebas unitarias y 64 de navegador. Check/build correctos no significan aprobación visual o accesible: el gate visual conserva **52 hallazgos abiertos** (ronda 2), con el detalle local en `.taste-skill/cinematic-gate.log`. No se han creado waivers para ocultarlos. Incluye reglas genéricas sobre alturas exactas, captions, geometría del logo, composición y detección del recorrido sticky, además de observaciones de jerarquía y alineación pendientes de revisión. El medidor de rendimiento mejoró a **0 FAIL / 5 WARN** después de optimizar los vídeos y añadir imágenes responsive; quedan avisos de transferencia total, clasificación del logo eager y agua sobredimensionada en móvil. Las mediciones son locales, no datos de usuarios ni una aprobación de producción.

Pendientes principales: aprobación visual y de recursos, optimización de MP4 y fuentes responsive, contraste/foco/controles en revisión manual, revisión nativa de traducciones, cobertura real por función/mercado, destino de contacto y validación clínica/legal. Conservar los bloqueos de `content/editorial/evidence.json` hasta resolverlos con evidencia.

`npm run build:publish` es una validación de publicación, **no un comando de despliegue**. Debe bloquear los borradores actuales. Este repositorio no configura hosting ni publica automáticamente.
