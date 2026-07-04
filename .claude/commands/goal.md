---
description: Trabajar de forma autónoma hacia un objetivo concreto del proyecto, hasta completarlo o toparse con algo que requiera tu decisión.
---

Objetivo: $ARGUMENTS

Trabajá de forma autónoma hacia este objetivo, siguiendo las convenciones ya establecidas en este repo (ver `CLAUDE.md`):

1. **Planificá primero.** Si el objetivo es grande o ambiguo, descomponelo en pasos concretos con `TaskCreate` antes de tocar código. Si ya hay tasks relacionadas en la lista (`TaskList`), reusalas en vez de duplicar.
2. **Desarrollá en `claude/friendly-maxwell-8r0ikv`.** Nunca pushees directo a `main` salvo que el objetivo sea explícitamente "subir a producción" — en ese caso, primero verificá que `claude/friendly-maxwell-8r0ikv` esté en un estado sano.
3. **Usá los skills instalados cuando correspondan** (ver la sección "Installed skills" de `CLAUDE.md`) — por ejemplo `database-schema-designer`/`migration-architect` para cambios de schema, `pr-review-expert` antes de un cambio grande, `env-secrets-manager` si tocás `.env.example`.
4. **Verificá antes de dar algo por terminado**: corré `npx tsc --noEmit` y, si el cambio toca código de producción (no solo docs/tests), `npm run build`. No reportes éxito sin haber verificado.
5. **Commiteá con mensajes descriptivos**, en español, siguiendo el estilo ya usado en el historial (`git log`). Un commit por cambio lógico, no un mega-commit al final.
6. **Pausá y preguntá solo cuando sea genuinamente necesario**: una decisión de producto/negocio (ej. qué categorías usar, si activar un juego), un trade-off real (ej. depender de un servicio de terceros no oficial), o una acción irreversible/de alto impacto (force-push, borrar datos, mergear a `main`). Para todo lo demás — elecciones técnicas razonables, nombres de variables, estructura de archivos — segui vos sin pedir permiso.
7. **Si te topás con algo bloqueante que no podés resolver solo** (ej. necesitás una credencial que no tenés, o algo requiere acceso que no tenés desde este sandbox), documentalo claramente en `PROJECT_TRACKER.md` bajo "PENDIENTE DE REVISIÓN DEL CEO" y contádselo al usuario en vez de inventar una solución a medias.
8. **Al terminar (o al llegar al límite de lo que podés hacer solo)**: actualizá el estado de las tasks (`TaskUpdate`), dejá un resumen corto y directo de qué se hizo, qué quedó pendiente y por qué, y confirmá si hay que subir los cambios (`git push`) o si preferís revisarlos primero.

No narres cada paso intermedio en detalle — reportá hallazgos importantes y decisiones, no un log de todo lo que probaste.
