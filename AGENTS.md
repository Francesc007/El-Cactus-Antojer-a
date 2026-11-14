# Reglas para Cursor – Proyectos de Francesco (Sigma AI Agency)

Este archivo es la base de todos los proyectos nuevos de landing. Cópialo a la raíz de cada proyecto nuevo.

## Git
- Nunca hagas push al remoto. Todo el trabajo se queda en una rama local.
- Antes de empezar, crea una rama local de trabajo desde el commit actual.
- Si un resultado no me gusta, se descarta y volvemos al commit actual sin perder nada.
- No hagas commit, amend ni reset sin que yo lo pida.

## Textos
- Aplica los textos dictados exactamente como Francesco los dicta. No los reescribas, no los acortes y no los "mejores".
- Si un texto dictado parece tener un error, pregunta antes de cambiarlo.

## Codificación
- Respeta los acentos y la ñ (á, é, í, ó, ú, ñ, ¿, ¡). Guarda siempre en UTF-8 sin BOM.
- Revisa que no aparezcan caracteres rotos (Ã¡, Ã©, Ã±) después de editar.

## Diseño
- No uses diseños genéricos ni con aspecto de plantilla.
- Las landings deben verse profesionales y premium, con un diferenciador claro que haga que el visitante diga "qué bonita página".
- Cada landing debe verse como el negocio real (restaurante, gym, clínica, concretera), no como un SaaS genérico.
- Antes de programar una landing nueva, propone un plan de diseño corto: paleta (4 a 6 colores), tipografías, layout y el elemento diferenciador.
- Usa el skill de diseño instalado con `npx skills add anthropics/skills --skill frontend-design -a cursor` (`/frontend-design`).
- Usa el MCP de shadcn y respeta sus componentes. No mezcles varias librerías de componentes para lo mismo.
- Usa GSAP para las animaciones (con Lenis para scroll suave si aplica). Respeta `prefers-reduced-motion`.
- Usa Higgsfield solo como referencia visual para el video de portada con efecto "wow" (intro cinematográfica y premium, estilo creadores de Instagram). Es inspiración, no una dependencia: no lo instales ni dependas de él. Si no está disponible, usa animaciones con GSAP y video comprimido guardado en buckets.
- Usa imágenes generadas con IA donde convenga, priorizando fotos reales del cliente cuando existan.

## Rendimiento
- Comprime siempre los videos (WebM + MP4, loop corto, sin audio) y agrega una imagen poster.
- En celular, considera usar imagen en lugar de video en la portada.
- Usa `next/image` y carga diferida (lazy) para imágenes y videos debajo del primer pantallazo.
- Guarda las imágenes en un bucket o CDN externo, no directamente en Supabase Storage, para no afectar el rendimiento de Supabase.

## SEO
- Un solo H1, títulos ordenados, title y description únicos, alt real en cada imagen, sitemap y robots al día.
- Integra palabras clave sin cambiar los textos dictados.

## Alcance
- Cambia solo lo que se pidió.
- Después de cambios estructurales, corre el chequeo de tipos (`tsc --noEmit`).
