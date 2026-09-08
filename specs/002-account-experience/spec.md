# Feature Specification: Cuenta confiable, dashboard y administrador inicial

**Feature Branch**: `main` (rama actual; sin hook de creación de ramas)

**Created**: 2026-09-07

**Status**: Draft — validada para planificación

**Input**: El usuario reporta “Unexpected Application Error! Cannot read properties of undefined (reading 'slice')” al abrir Mi cuenta y fallos similares en Mis inscripciones. Solicita corregir este tipo de problemas, crear un dashboard atractivo para las cuentas y disponer de un administrador base con entrega de sus credenciales.

## Ampliación solicitada — 2026-09-08

- FR-016: Poblar el catálogo con 12 eventos de ejemplo, identificados como «Demo», repartidos entre las seis categorías, con ubicación virtual de demostración, fechas futuras y cupos positivos. No afirmar que representan actividades reales ni crear inscripciones ficticias.
- FR-017: La inicialización no debe duplicar eventos, sobrescribir ediciones, reponer cupos consumidos ni borrar datos existentes al repetirse o reiniciarse.
- FR-018: La entrega solo puede anunciar éxito cuando la revisión desplegada corresponde al commit solicitado y tiene una Route HTTPS. Un éxito histórico no acredita la corrección.
- A-007: Al no proporcionarse un catálogo real, se usan eventos sintéticos claramente identificados. La solicitud de producción requiere un destino/perfil aprobado; solo está configurado `event-hub-dev`, que no se presentará como producción.
- Aceptación: 12 registros nuevos, seis categorías y cupos íntegros inicialmente; repetir la carga después de editar uno conserva todos los datos y mantiene el total; una entrega de otro SHA se rechaza como obsoleta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar mi cuenta e inscripciones sin bloqueos (Priority: P1)

Como usuario autenticado quiero consultar mi cuenta, mis inscripciones y sus detalles sin perder la navegación cuando faltan datos o falla una consulta.

**Why this priority**: El fallo reportado impide gestionar la participación en eventos, una capacidad central del producto.

**Independent Test**: Abrir directamente y desde la navegación Mi cuenta, Perfil, Mis inscripciones y Detalle de inscripción con una cuenta nueva y otra con inscripciones; repetir con información incompleta y un fallo temporal.

**Acceptance Scenarios**:

1. **Given** una cuenta sin inscripciones, **When** abre Mi cuenta o Mis inscripciones, **Then** ve un estado vacío explícito y un acceso al catálogo, sin pantalla de excepción.
2. **Given** inscripciones activas y canceladas propias, **When** consulta la lista y cambia el filtro, **Then** ve exactamente los registros correspondientes y puede abrir sus detalles.
3. **Given** información de inscripciones ausente o con formato inválido, **When** abre una pantalla que depende de ella, **Then** ve un error recuperable; no se presenta como una lista vacía confirmada ni como un conteo de cero.
4. **Given** un registro con fecha, nombre o ubicación ausente o inválida, **When** se muestra, **Then** la pantalla permanece operativa e identifica el dato no disponible; no ofrece acciones cuya validez dependa de información desconocida.
5. **Given** una consulta fallida, **When** selecciona Reintentar y la información vuelve a estar disponible, **Then** la sección se recupera sin reiniciar sesión y conserva el filtro seleccionado.
6. **Given** una sesión vencida, **When** abre una vista privada, **Then** se dirige a iniciar sesión y puede volver al destino solicitado dentro de la aplicación; nunca ve datos de otro usuario.
7. **Given** una inscripción cancelable, **When** confirma su cancelación, **Then** su estado y los resúmenes se actualizan; un fallo no muestra una confirmación de éxito ni descuenta conteos.
8. **Given** un fallo inesperado de una vista, **When** se presenta, **Then** se ofrece un mensaje comprensible y una salida hacia una página segura, sin traza técnica visible.

### User Story 2 - Entender mi actividad en un dashboard atractivo (Priority: P2)

Como titular de una cuenta quiero reconocer mi información, mi próxima participación y las acciones disponibles en un panel claro, cálido y coherente con Event Hub.

**Why this priority**: Recuperada la funcionalidad, el panel debe ayudar a decidir qué hacer y transmitir una experiencia cuidada.

**Independent Test**: Revisar el dashboard con cero, una y varias inscripciones, en móvil y escritorio, usando también solo el teclado.

**Acceptance Scenarios**:

1. **Given** una sesión válida, **When** abre Mi cuenta, **Then** ve saludo personal con alternativa si falta el nombre, resumen de actividad, próximos eventos y accesos a Perfil, Mis inscripciones y catálogo.
2. **Given** varias inscripciones, **When** consulta el resumen, **Then** los conteos de activas y canceladas coinciden con el conjunto completo de sus inscripciones y la próxima participación es la activa futura más cercana.
3. **Given** eventos activos pasados y futuros, **When** consulta Próximos eventos, **Then** ve como máximo tres eventos futuros ordenados de más cercano a más lejano, con acceso a la lista completa; las cancelaciones no aparecen como próximas.
4. **Given** una cuenta nueva, **When** abre el dashboard, **Then** ve una composición completa con orientación hacia el catálogo, sin estadísticas ni actividad inventadas.
5. **Given** un ancho de pantalla de 360, 768 o 1440 píxeles, **When** navega por el panel, **Then** la jerarquía, los textos y las acciones son legibles, sin solapamientos ni desplazamiento horizontal de la página.
6. **Given** una cuenta administradora, **When** abre su área de cuenta, **Then** tiene un acceso claramente identificado al panel administrativo; un usuario ordinario no dispone de acciones administrativas.

### User Story 3 - Acceder con el administrador inicial (Priority: P1)

Como responsable del producto quiero disponer de una cuenta administradora inicial operativa y recibir su acceso de forma privada para administrar eventos.

**Why this priority**: La aplicación debe poder administrarse al finalizar la entrega, sin intervención manual sobre sus datos.

**Independent Test**: Verificar una inicialización nueva y otra repetida; iniciar sesión con la cuenta resultante y completar una operación administrativa autorizada.

**Acceptance Scenarios**:

1. **Given** que la identidad inicial configurada no existe, **When** finaliza la inicialización, **Then** existe una única cuenta administradora y sus credenciales permiten iniciar sesión.
2. **Given** que esa cuenta administradora ya existe, **When** se repite la inicialización o el despliegue, **Then** no se duplica ni se modifica su contraseña, perfil o información existente.
3. **Given** que el correo configurado pertenece a un usuario ordinario, **When** se intenta inicializar el administrador, **Then** se informa del conflicto y no se eleva silenciosamente su rol ni se sobrescribe la cuenta.
4. **Given** que el acceso inicial ha sido verificado, **When** se entrega el resultado al solicitante, **Then** recibe la URL de inicio de sesión, el identificador de acceso y la contraseña por un canal privado aprobado, o un mecanismo privado de recuperación de un solo uso; no se publican valores en el repositorio ni en registros.
5. **Given** credenciales de inicialización ausentes o inválidas, **When** se intenta crear la cuenta, **Then** no se usa una contraseña universal de respaldo y el resultado informa del problema sin exponer valores sensibles.

### Edge Cases

- Lista ausente, nula, de tipo incorrecto, vacía válida o con registros parciales: distinguir indisponibilidad de ausencia real de inscripciones.
- Fechas inválidas, evento eliminado o inscripción huérfana: preservar la inscripción y mostrar información no disponible sin romper el detalle.
- Más de una página de inscripciones: no calcular el total usando solamente la página visible.
- Un evento comienza mientras el usuario consulta el panel: deja de ser próximo al actualizar; conservar las reglas existentes de cancelación.
- Respuestas que llegan después de cerrar sesión o cambiar de usuario: no reutilizar información privada de la sesión anterior.
- Recarga de una URL privada, navegación atrás/adelante y enlace a inscripción ajena: mantener recuperación de sesión y controles de propiedad.
- Doble pulsación o reintento de cancelación: no duplicar efectos ni liberar cupos más de una vez.
- Fallo parcial de una sección: las secciones independientes y la navegación siguen disponibles.
- Inicialización repetida o concurrente del administrador: mantener una sola identidad y sus credenciales vigentes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mi cuenta, Perfil, Mis inscripciones, Detalle de inscripción y las vistas administrativas que presentan estos datos DEBEN tolerar datos ausentes o inválidos sin pantalla de excepción sin gestionar. Cubre US1.1–4 y US1.8.
- **FR-002**: Cada sección DEBE distinguir carga, vacío confirmado, contenido y error recuperable; los datos desconocidos NO DEBEN representarse como cero ni como una lista vacía confirmada. Cubre US1.1, US1.3 y US1.5.
- **FR-003**: La información presentada DEBE corresponder al usuario autenticado y conservar controles de propiedad y rol en navegación directa, recarga y cambios de sesión. Cubre US1.2, US1.6 y US2.6.
- **FR-004**: Mis inscripciones DEBE conservar filtros por estado, acceso al detalle y cancelación con confirmación, respetando las reglas de disponibilidad y propiedad existentes. Cubre US1.2 y US1.7.
- **FR-005**: Los fallos de datos o presentación DEBEN ofrecer recuperación o navegación segura con mensajes en español; las trazas técnicas se reservan al diagnóstico autorizado. Cubre US1.3–5 y US1.8.
- **FR-006**: El dashboard DEBE incluir saludo, conteos de inscripciones activas y canceladas, próxima participación, hasta tres próximos eventos y accesos a las acciones principales. Cubre US2.1–4.
- **FR-007**: Los conteos DEBEN usar todos los registros propios del estado indicado; Próximos eventos solo incluye inscripciones activas con fecha futura conocida, ordenadas ascendentemente por fecha. Cubre US2.2–3.
- **FR-008**: Una inscripción o cancelación confirmada DEBE reflejarse en lista, detalle y resumen al volver a esas vistas, sin obligar a recargar toda la aplicación. Cubre US1.7.
- **FR-009**: El dashboard DEBE conservar la identidad cálida de Event Hub: tonos tierra, jerarquía tipográfica consistente, tarjetas de resumen, separación clara de secciones, estados de interacción visibles y espaciado uniforme. Cubre US2.4–5.
- **FR-010**: Los controles DEBEN tener nombres accesibles, foco visible, uso por teclado y estados identificables sin depender solo del color. La información y acciones deben seguir disponibles en los tres tamaños de US2.5.
- **FR-011**: La experiencia de cuenta DEBE adaptar los accesos al rol sin mostrar acciones administrativas a usuarios ordinarios. Cubre US2.6 y US3.1.
- **FR-012**: La entrega DEBE crear o reutilizar una cuenta administradora inicial, de forma repetible y sin duplicar identidades ni sobrescribir accesos existentes. Cubre US3.1–3.
- **FR-013**: La identidad y contraseña iniciales DEBEN provenir de configuración privada administrada; no puede existir una contraseña compartida universal ni una credencial incluida en fuentes, documentación o registros. Cubre US3.4–5.
- **FR-014**: La entrega DEBE verificar el inicio de sesión y una acción administrativa con el administrador inicial y facilitar al solicitante su acceso privado. Si se reutiliza una cuenta, no debe afirmarse que su contraseña inicial sigue vigente sin verificarlo. Cubre US3.1, US3.2 y US3.4.
- **FR-015**: La validación funcional DEBE cubrir los flujos afectados con datos reales de prueba integrados entre cuenta, eventos e inscripciones, además de respuestas incompletas y errores simulados. La salud del servicio por sí sola no acredita estas pantallas.

### Key Entities

- **Cuenta**: identidad, nombre visible, correo y rol; delimita qué datos y acciones puede consultar su titular.
- **Inscripción**: relación entre usuario y evento con estado activo o cancelado; conserva su identidad aun si faltan detalles del evento.
- **Evento**: nombre, fecha y ubicación usados para identificar la próxima participación; mantiene las reglas de cupo existentes.
- **Resumen de cuenta**: información derivada de las inscripciones propias, sin historial ni datos ficticios adicionales.
- **Acceso administrador inicial**: identidad privilegiada de la aplicación, credencial privada y resultado verificable de inicialización; no otorga administración de la plataforma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los escenarios US1 pasa sin pantalla blanca, traza técnica visible ni pérdida de navegación.
- **SC-002**: Para cuentas con 0, 1 y más de 20 inscripciones mixtas, el 100 % de conteos, filtros y próximos eventos coincide con los datos de prueba y no muestra información ajena.
- **SC-003**: Un usuario puede localizar su próxima participación y abrir su detalle en un máximo de dos acciones desde Mi cuenta; cuando no tiene próximas participaciones, puede abrir el catálogo en una acción.
- **SC-004**: El 100 % de controles principales es operable con teclado; la revisión visual a 360, 768 y 1440 píxeles no encuentra solapamientos, texto truncado que impida comprender acciones ni desplazamiento horizontal de página. El texto normal alcanza contraste mínimo de 4,5:1.
- **SC-005**: En 20 aperturas de cada vista principal de cuenta con hasta 100 inscripciones, conexión estable de 10 Mbps y latencia de 100 ms, al menos 19 muestran contenido o vacío confirmado en menos de 3 segundos; ante fallo muestran un estado recuperable al agotarse la espera definida en planificación.
- **SC-006**: La inicialización del administrador, ejecutada dos veces y con concurrencia, conserva una única identidad; el acceso entregado permite iniciar sesión y completar la acción administrativa de aceptación.
- **SC-007**: Tras la entrega, los escenarios integrados de consultar cuenta, inscribirse, consultar detalle, cancelar y administrar un evento pasan en el ambiente de desarrollo sin pérdida de datos existentes ni exposición de credenciales en artefactos públicos.

## Assumptions

- **A-001 — INFERRED**: Se mejora la aplicación existente, conservando cuentas, eventos, roles y reglas de cupos. Cambiar esas reglas ampliaría el alcance; validar en planificación.
- **A-002 — DEFAULTED**: “Este tipo de problemas” abarca datos incompletos, discordancias de información y errores de presentación en los recorridos de cuenta/inscripciones y sus vistas administrativas relacionadas; no implica una auditoría ilimitada de funciones ajenas. Validar al derivar tareas.
- **A-003 — DEFAULTED**: Se mantiene la identidad visual cálida/bohemia existente y se mejora composición y jerarquía del dashboard. Una nueva marca requeriría otro alcance; validar en diseño.
- **A-004 — INFERRED**: Se reutiliza la identidad administradora configurada si es válida. La referencia privada existente es `user-service-seed-admin`; su contenido y la existencia efectiva de la cuenta quedan PENDING_VALIDATION durante la entrega.
- **A-005 — PROFILED**: Las credenciales se entregan por un canal privado aprobado. El mecanismo concreto de entrega/recuperación se resolverá en planificación con las capacidades de la plataforma, sin introducir contraseñas en esta especificación.
- **A-006 — DEFAULTED**: Los conteos de activas incluyen activas pasadas y futuras; el bloque Próximos eventos restringe a futuras. Esto evita cambiar el significado del estado de inscripción existente; validar en contratos.

## Contexto organizacional y alcance

- **Producto/dominio**: Event Hub, gestión de eventos e inscripciones.
- **Propietario**: `group:default/developers`.
- **Clasificación**: `internal`, con datos personales básicos y acceso privado.
- **Criticidad**: estándar; se conservan las condiciones operativas existentes.
- **Tecnología**: sin nueva restricción funcional; planificación deriva decisiones del contrato de workloads vigente.
- **Incluido**: estabilidad de las vistas afectadas, dashboard personal y accesos por rol, inicialización y entrega privada de acceso administrativo, regresión integrada y entrega verificada.
- **Excluido**: pagos, notificaciones, nueva identidad de marca, nuevos roles, administración general de usuarios, analítica inventada, eliminación o reinicialización de datos, despliegue a producción.
- **Dependencias**: capacidades existentes de identidad, catálogo, inscripciones y provisión privada de acceso inicial.

## Requisitos operativos en OpenShift

### Perfil y componentes lógicos

Se conserva la aplicación web con procesos de atención continua y datos durables. Solo el punto de entrada web existente es público. La inicialización de administrador es trabajo finito y repetible; su realización técnica pertenece al plan.

| Capacidad | Trabajo y acceso | Dependencias/datos | Condición funcional de salud |
|---|---|---|---|
| Experiencia de cuenta | Interacción web del titular | Sesión, resumen e inscripciones | Puede consultar y recuperar cada sección |
| Acceso y autorización | Atención continua, entrada autenticada | Identidad y rol | Mantiene sesión y permisos correctos |
| Catálogo | Consulta interna y pública existente | Eventos durables | Proporciona detalles válidos o ausencia explícita |
| Inscripciones | Atención continua, privada | Cuenta, evento y relación durable | Consulta/cancelación conservan propiedad y cupos |
| Administrador inicial | Inicialización finita administrada | Identidad y credencial privada | Acceso verificado sin duplicados |

### Datos, integraciones y recuperación

| Dato | Propietario | Durabilidad/sensibilidad | Retención, recuperación y migración |
|---|---|---|---|
| Cuenta y rol | Identidad | Durable, personal | Preservar cuentas y recuperación existente; no resetear credenciales |
| Eventos | Catálogo | Durable, contenido del producto | Preservar eventos; sin cambio de retención |
| Inscripciones | Inscripciones | Durable, actividad personal | Preservar historial y cancelaciones; no borrar para resolver errores |
| Resumen | Experiencia de cuenta | Derivado, privado | Recalcular desde datos propios, sin nueva retención |
| Credencial inicial | Gestor privado autorizado | Sensible | Almacén aprobado y recuperación privada; nunca versionar valores |

Las consultas fluyen desde la experiencia de cuenta hacia identidad e inscripciones y, cuando se necesitan detalles, hacia catálogo. Requieren la autorización del titular; la inicialización usa exclusivamente el canal privado existente. Ante fallos, cada consumidor presenta indisponibilidad explícita y mantiene las secciones independientes. Cualquier migración necesaria debe preservar datos y permitir recuperación documentada.

### Delta, paridad y escenarios operativos

- **MODIFIED**: experiencia de cuenta, dashboard y presentación de inscripciones; integración de sus datos y provisión verificable de acceso inicial cuando lo requiera la evidencia.
- **UNCHANGED**: propiedad de datos, reglas de cupos y cancelación, separación de roles y exposición pública existente.
- **ADDED**: cobertura de datos incompletos y recuperación, verificación integrada de cuentas e información privada de entrega.
- **Instalación/reinicio**: inicialización repetible del administrador sin duplicarlo ni reemplazar contraseñas existentes.
- **Actualización**: cuentas e inscripciones previas siguen operativas; mantener compatibilidad durante el cambio.
- **Degradación**: fallos de una consulta no derriban la navegación ni muestran éxito falso.
- **Rollback/restauración**: conservar los datos y el acceso administrativo; documentar cómo volver a la versión anterior sin borrar información.
- **Paridad**: mismos resultados funcionales en pruebas locales y desarrollo desplegado; las diferencias de exposición y entrega privada de credenciales no cambian permisos o datos.
- **Observabilidad**: registrar categorías de fallo de cuenta/inscripciones e inicialización con referencia de diagnóstico, sin contraseñas, tokens ni detalles personales innecesarios.
- **Smoke funcional**: con cuentas sintéticas, abrir cuenta nueva, inscribirse a un evento futuro, consultar dashboard y detalle, cancelar y comprobar el resumen; verificar además acceso y acción administrativa. La limpieza afecta solo los datos sintéticos identificados.
- **Entrega**: conservar el flujo administrado de OpenShift Pipelines/GitOps, ejecución sin privilegios, entrada saludable y referencias privadas. Verificar todos los workloads y los escenarios funcionales; documentar commit, versión desplegada, evidencia y URL. Todo resultado dinámico de esta feature permanece **PENDING_VALIDATION** hasta su ejecución.

## Criterios de terminado de la feature

La feature está terminada cuando FR-001–015 y SC-001–007 tienen evidencia de aceptación, los datos existentes están preservados, el solicitante dispone del acceso administrativo privado verificado y la entrega administrada publica una URL saludable con las pantallas corregidas. Completar esta especificación no acredita todavía implementación, despliegue ni creación de credenciales.
