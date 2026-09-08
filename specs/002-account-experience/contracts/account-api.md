# Contrato público de cuenta

Autenticación por cookies existentes. Sin parámetro userId controlable por cliente para consultas propias.

| Ruta | Éxito | Permiso |
|---|---|---|
| GET /api/registrations/me?status=ACTIVE o CANCELLED | 200 `{items: Registration[]}`; sin filtro ambos estados | Sesión, solo titular |
| POST /api/events/:id/registrations | 201 Registration | Sesión + Idempotency-Key existente |
| GET /api/registrations/:id | 200 Registration | Propietario o ADMIN autorizado |
| DELETE /api/registrations/:id | 200 Registration cancelada | Propietario, reglas actuales |
| GET /api/auth/me | 200 `{id,name,email,role}` | Sesión |
| GET /api/events/:id/registrations | 200 `{items,capacity,occupied,available}` | ADMIN; conservar agregación existente |

Registration: [data-model.md](../data-model.md). Internamente servicio conserva array y campos Snapshot. Presenter valida/proyecta los cuatro endpoints. Core/envolvente interna inválidos → 502 `{error:{code:"INVALID_UPSTREAM_RESPONSE",message:"No pudimos cargar la información de inscripciones."}}`, sin cuerpo interno. Metadata inválida→null. Query status desconocida→400.

Frontend 2xx inválido→error local INVALID_RESPONSE, nunca array desnudo ni null→[]. Empty válido `{items:[]}`. Conservar códigos de dominio 400/401/403/404/409. Fechas ausentes nunca llegan directamente a Intl.DateTimeFormat.

Timeout frontend8s/intent, sin retry privado automático; retry manual cancela anterior. Propagar AbortSignal de Query a fetch. Gateway timeout5s. Abort por cambio de sesión no muestra alarma.

401 vigente de consulta privada invalida sesión; 403 conserva sesión; 404 muestra no disponible y acceso a lista. Login fallido permanece en formulario. `from` solo ruta relativa interna iniciada `/`, no `//`, esquema, barras invertidas ni decodificación doble.

Keys privadas incluyen userId/generación. Transiciones cancelan/eliminan datos y descartan resultados/toasts antiguos. Mutaciones confirmadas invalidan lista/detalle/resumen y evento relacionado de sesión actual. Administración conserva contrato propio y permisos, añadiendo validación y formatos seguros.

Tests Gateway usan registros internos con snapshots, verifican respuesta HTTP pública y autorización previa a proyección. Integración real confirma que backend satisface esquema frontend.
