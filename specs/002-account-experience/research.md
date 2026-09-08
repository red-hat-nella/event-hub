# Investigación

## R1 — Contrato público

**Decision**: presenter Gateway para listado, creación, detalle y cancelación; listado `{items}`, metadata desde snapshots.
**Rationale**: RegistrationsService.findMine devuelve array; frontend espera items y ejecuta slice/length. Snapshot fields tampoco coinciden con eventName/eventStartsAt/eventLocation. Tests actuales Gateway usan mocks públicos y aceptan array: deben usar fixtures internos reales.
**Alternatives considered**: optional chaining aislado oculta causa; aceptar ambos formatos perpetúa deriva; consultar catálogo añade N+1 y pierde snapshots históricos. Evidencia estática, no reproducción nueva de clúster.

## R2 — Resumen y validación

**Decision**: colección propia completa; conteos por estado, futuras activas top3 ordenadas fecha/id. Zod existente rechaza estructura esencial inválida; solo metadata inválida se convierte a null.
**Rationale**: servicio actual no pagina; snapshots ya persistidos. No esquema ni endpoint nuevo.
**Alternatives considered**: tablas de analítica y endpoint adicional innecesarios; items ausente→[] produciría resultado falso.

## R3 — Recuperación y sesión

**Decision**: boundaries de rutas y raíz, claves por usuario/generación, cancelación y limpieza, AbortSignal hasta fetch; timeout8s, sin retries privados automáticos.
**Rationale**: router no tiene errorElement; AuthProvider no elimina caché y hooks privados no incluyen identidad. [React Router 6](https://reactrouter.com/6.30.1/route/error-element) documenta recuperación de errores de render; [QueryClient](https://tanstack.dev/query/latest/docs/reference/QueryClient) ofrece cancelQueries/removeQueries. Confirmar firmas con tipos locales v5.
**Alternatives considered**: ocultar traza no recupera navegación; solo limpiar caché permite respuestas tardías; retries por defecto alargan espera.

## R4 — Diseño

**Decision**: dashboard editorial, métricas y próxima participación destacada; Fraunces/Inter y tonos tierra existentes. Foco visible, 44px targets, estados reservados y reduced-motion.
**Rationale**: ui-ux-pro-max recomienda accesibilidad y jerarquía. Su landing comunitaria, rosa y stack móvil genéricos no corresponden al dashboard web: conservar marca/stack solicitados.
**Alternatives considered**: nuevas fuentes, gráficas sin datos y marca nueva no aportan al alcance.

## R5 — Administrador

**Decision**: initContainer después de migrate con ejecutable compilado desde src y referencia privada existente; colisiones se resuelven releyendo identidad, sin sobrescribir.
**Rationale**: prisma/seed.ts existe pero Deployment solo ejecuta migrate; tsconfig excluye prisma del build. Schema de workloads admite solo Deployment/StatefulSet. Upsert actual no verifica rol existente; concurrencia debe contemplar error de unicidad ([Prisma, discusión oficial](https://github.com/prisma/prisma/issues/22778)).
**Alternatives considered**: Job amplía contrato innecesariamente; endpoint público/contraseña fija/promoción silenciosa de USER son incompatibles con requisitos.

## R6 — Handoff

**Decision**: broker/orquestador verifica acceso y entrega por canal privado; no nuevo endpoint de recuperación ni valores en artefactos. Password desalineada exige recuperación autorizada, no reset silencioso.
**Rationale**: constitución exige separación de secretos. Disponibilidad efectiva del canal privado y acceso real son PENDING_VALIDATION; no asumir que watch entrega contraseñas.
**Alternatives considered**: leer Secret con oc o publicar password en reporte contradice el contrato.

Decisiones de arquitectura resueltas; comprobaciones dinámicas permanecen pendientes. Investigación independiente confirmó los desajustes y el uso de snapshots. No acceso al clúster ni a credenciales en esta fase.

## Ajuste verificado durante implement

UsersService.create/authenticate conserva email por coincidencia exacta (no hay lowercase ni trim). Bootstrap aplica la misma validación IsEmail y coincidencia exacta; no introduce una normalización distinta ni modifica identidades históricas. La referencia a normalizar como login significa conservar esta semántica real.
