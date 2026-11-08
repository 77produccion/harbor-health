# Harbor Health — instrucciones del repositorio

Este repositorio contiene únicamente la web comercial Astro + MDX + GSAP. No requiere carpetas hermanas ni skills externas para compilar. Leer `README.md`, `docs/project-guide.md` y `docs/assets.md` antes de trabajar.

## Contenido y marca

1. Copy canónico en `content/pages/{locale}/*.mdx`. No duplicarlo en componentes. Mantener IDs de página, sección e item.
2. La home usa Scene MDX v2; las otras cinco vistas usan v1. El parser trata las Scene como datos: no habilitar imports, expresiones ni JSX arbitrario.
3. CTA y avisos compartidos en `content/site.json`; controles en `content/home-ui.{locale}.json`. Preservar los siete idiomas y distinguirlos de los mercados.
4. `content/editorial/evidence.json` es necesario para validar fuentes y bloqueos. Sus referencias a documentación externa son trazabilidad histórica, no dependencias de ejecución ni contenido público.
5. No inventar funciones, testimonios, precios, resultados clínicos, cobertura, acreditaciones o garantías. L1/L2/L3 son niveles de explicación, no tres planes acreditados.
6. Marca: Lora en títulos, Poppins en lectura/interfaz; navy `#061a33`, teal `#01919f` y azul Health `#4971d1`. Health es submarca de Living. No añadir Verified como garantía sin evidencia.
7. Sin badges decorativos, numeración de relleno, estados ficticios ni grids de tarjetas por defecto. Iconos necesarios desde `@lucide/astro`, sin emojis ni flechas dibujadas a mano.

## Implementación

- GSAP es mejora progresiva: navegación y lectura deben seguir disponibles sin JavaScript. Limpiar contextos y refrescar tras cambios de geometría.
- El responsable solicitó movimiento completo incluso con `prefers-reduced-motion`. Esta excepción tiene un riesgo de accesibilidad documentado; no afirmar cumplimiento por pasar pruebas automáticas.
- Mantener vídeo 16:9 sin recorte, pausa manual persistente, poster y controles si autoplay falla. Respetar ahorro de datos/2G.
- No sobrescribir originales de imagen/vídeo. No añadir archivos al allowlist de `.gitignore` sin un consumidor real o una necesidad de build/prueba.
- No modificar el CSS de terceros para cambiar la política de movimiento; la excepción propia está en `src/styles/motion-policy.css`.
- Medición sin datos clínicos ni texto libre. No configurar proveedores ficticios ni activar analítica sin consentimiento.
- No guardar secretos. No publicar, desplegar, hacer commits ni enviar cambios a terceros sin petición explícita.

## Comprobaciones

```sh
npm run content:check
npm test
npm run check
npm run build
npm run test:browser
```

Al cambiar contenido/validadores, regenerar la matriz con `npm run content:matrix:write` (reporte local no versionado). Antes de publicar, ejecutar también `npm run content:publish-check`: debe bloquear el estado actual de borrador. Un build de preview correcto no es aprobación visual, médica, lingüística o legal.
