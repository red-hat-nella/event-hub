# Feature Specification: Event Hub — Gestión de Eventos e Inscripciones

**Feature Branch**: `001-event-hub-management`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Especifica una aplicación web llamada Event Hub para la gestión de eventos e inscripciones. El sistema debe permitir que usuarios consulten los eventos disponibles, visualicen su información detallada y se registren o cancelen su inscripción. Los administradores deben poder crear, consultar, actualizar y eliminar eventos, así como gestionar la cantidad máxima de asistentes. Actores: Usuario (registro, login, consulta de eventos, detalle, inscripción, cancelación, consulta de sus inscripciones) y Administrador (CRUD de eventos, consulta de inscripciones, control de cupos). Reglas de negocio sobre inscripción única, capacidad máxima, actualización de cupos, permisos de administración, campos obligatorios del evento, fechas pasadas e inscripciones tardías. Identidad visual bohemia, cálida y contemporánea con paleta de tonos tierra, con foco fuerte en UX/UI: jerarquía visual, navegación intuitiva, diseño responsive, estados de carga/vacío/error/éxito, formularios claros, feedback visual, tarjetas de eventos atractivas, filtros y búsqueda, visibilidad de cupos, flujo de inscripción simple, confirmaciones destructivas, accesibilidad y consistencia visual. Arquitectura futura de microservicios con frontend React y API Gateway."

## Resumen y objetivo

Event Hub es una plataforma web para descubrir eventos culturales y comunitarios, y gestionar la inscripción de asistentes. El objetivo del sistema es que cualquier persona pueda explorar eventos disponibles, entender su información clave de un vistazo (fecha, hora, ubicación y cupos) e inscribirse o cancelar su participación en pocos pasos, mientras los administradores mantienen el catálogo de eventos y controlan la capacidad máxima de asistentes de forma confiable. El sistema debe sentirse como una plataforma de descubrimiento cultural moderna y cálida, no como una herramienta administrativa genérica.

## Contexto organizacional

| Campo | Contenido esperado |
|---|---|
| Producto/componente | Event Hub |
| Propietario | `group:default/developers` |
| Dominio/sistema | Gestión de eventos e inscripciones |
| Framework | Sin restricción funcional impuesta por esta especificación; las preferencias tecnológicas registradas en `docs/product-context.md` (React, Node.js/TypeScript, PostgreSQL) son insumo de `plan`, no un requisito funcional |
| Clasificación de datos | `internal` (incluye datos personales básicos de cuenta: nombre, correo) |
| Criticidad | Estándar — no se declaró un objetivo contractual de disponibilidad o recuperación; ver Supuestos |

## Alcance

**Incluido**:

- Consulta pública del catálogo de eventos, con filtros y búsqueda.
- Consulta del detalle de un evento individual.
- Registro de cuenta e inicio/cierre de sesión de usuario.
- Inscripción y cancelación de inscripción a eventos por parte de un usuario autenticado.
- Consulta por parte del usuario de sus propias inscripciones.
- Creación, consulta, actualización y eliminación de eventos por administradores.
- Gestión de la capacidad máxima de un evento y consulta de sus inscripciones por administradores.
- Identidad visual, estados de interfaz (carga, vacío, error, éxito) y accesibilidad de la experiencia completa.

**Excluido de esta versión**:

- Procesamiento de pagos o cobros por inscripción.
- Notificaciones automáticas (correo electrónico, push, SMS).
- Inicio de sesión mediante proveedores externos (SSO/OAuth de terceros).
- Gestión de cuentas de otros usuarios por parte de administradores (por ejemplo, suspender o eliminar cuentas).
- Eventos recurrentes o con múltiples sesiones/fechas dentro de un mismo evento.
- Listas de espera cuando un evento está agotado.

**Actores y sistemas consumidores**: Usuario final (visitante o autenticado) y Administrador, ambos a través de la aplicación web. No se identifican sistemas externos consumidores en esta versión.

**Dependencias externas conocidas**: ninguna declarada para esta versión.

## Actores y permisos

| Actor | Permisos |
|---|---|
| Visitante (no autenticado) | Consultar el catálogo de eventos; usar filtros y búsqueda; ver el detalle de un evento; crear una cuenta; iniciar sesión |
| Usuario (autenticado) | Todo lo del visitante, además: inscribirse en eventos con cupo disponible; cancelar sus propias inscripciones; consultar la lista de sus propias inscripciones; cerrar sesión |
| Administrador (autenticado) | Consultar el catálogo y detalle de eventos, además: crear, actualizar y eliminar eventos; definir y modificar la capacidad máxima de un evento; consultar las inscripciones de cualquier evento |

Un usuario sin sesión iniciada que intenta una acción reservada a Usuario o Administrador debe ser dirigido a iniciar sesión antes de continuar. Un Usuario sin rol de Administrador que intenta una acción administrativa debe recibir un error de permisos.

## User Scenarios & Testing *(mandatory)*

**Flujo principal**: un visitante explora el catálogo de eventos → abre el detalle de un evento de interés → crea una cuenta o inicia sesión → confirma su inscripción → el sistema actualiza los cupos disponibles y muestra confirmación. Más adelante, el usuario puede consultar "Mis inscripciones" y cancelar si ya no puede asistir, liberando el cupo.

**Flujos alternativos**: un administrador crea o edita un evento antes de que esté disponible para el público; un usuario intenta inscribirse a un evento agotado o ya iniciado y recibe un mensaje de error sin completar la acción; un administrador elimina un evento y el sistema exige confirmación explícita antes de retirarlo del catálogo.

### User Story 1 - Descubrir eventos disponibles (Priority: P1)

Como visitante o usuario, quiero explorar el catálogo de eventos disponibles, filtrarlos o buscarlos, y ver el detalle completo de un evento, para decidir en cuáles quiero participar.

**Why this priority**: Es el punto de entrada y la propuesta de valor principal de la plataforma: sin descubrimiento atractivo y claro no hay inscripciones. Debe funcionar sin necesidad de cuenta.

**Independent Test**: Con un catálogo de eventos ya existente, se puede probar listando eventos, aplicando un filtro/búsqueda y abriendo el detalle de un evento, sin requerir inicio de sesión ni ninguna otra historia implementada.

**Acceptance Scenarios**:

1. **Given** existen eventos futuros publicados, **When** un visitante abre el catálogo, **Then** ve una lista de tarjetas de eventos con nombre, fecha, hora, ubicación y cupos disponibles/totales de cada uno.
2. **Given** el catálogo tiene eventos de distintas fechas y ubicaciones, **When** el visitante escribe un término de búsqueda o aplica un filtro, **Then** la lista se actualiza mostrando solo los eventos que coinciden, sin recargar toda la experiencia.
3. **Given** una búsqueda o filtro no coincide con ningún evento, **When** se aplica, **Then** el sistema muestra un estado vacío claro que explica que no hay resultados y ofrece limpiar los filtros.
4. **Given** un evento existe y es visible en el catálogo, **When** el visitante abre su detalle, **Then** ve nombre, descripción, fecha, hora, ubicación, capacidad máxima y cupos disponibles.
5. **Given** un evento alcanzó su capacidad máxima, **When** se muestra en el catálogo o en su detalle, **Then** el sistema lo indica claramente como agotado usando texto e iconografía, no solo color.

---

### User Story 2 - Crear cuenta e iniciar sesión (Priority: P2)

Como visitante, quiero crear una cuenta e iniciar sesión, para poder inscribirme en eventos y gestionar mis propias inscripciones.

**Why this priority**: Es el habilitador imprescindible de toda interacción personalizada (inscribirse, cancelar, ver "mis inscripciones"), pero no bloquea el valor de descubrimiento de la Historia 1.

**Independent Test**: Se puede probar de forma aislada creando una cuenta con datos válidos, cerrando sesión y volviendo a iniciar sesión con las mismas credenciales.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** completa el formulario de registro con nombre, correo electrónico y contraseña válidos, **Then** el sistema crea la cuenta y confirma visualmente el éxito.
2. **Given** un correo electrónico ya registrado, **When** un visitante intenta crear una cuenta con ese mismo correo, **Then** el sistema rechaza la operación y muestra un mensaje claro indicando que el correo ya está en uso.
3. **Given** una cuenta existente, **When** el usuario inicia sesión con credenciales correctas, **Then** accede a las funciones de Usuario autenticado.
4. **Given** una cuenta existente, **When** el usuario intenta iniciar sesión con una contraseña incorrecta, **Then** el sistema muestra un mensaje de error claro sin indicar si el correo existe o no.
5. **Given** un usuario con sesión iniciada, **When** cierra sesión, **Then** pierde acceso a las funciones de Usuario autenticado hasta volver a iniciar sesión.

---

### User Story 3 - Inscribirse a un evento (Priority: P3)

Como usuario autenticado, quiero inscribirme en un evento que tiene cupo disponible, para asegurar mi participación.

**Why this priority**: Es la transacción central del producto: convierte el interés detectado en la Historia 1 en una inscripción confirmada.

**Independent Test**: Con un usuario autenticado y un evento futuro con cupo disponible, se puede probar inscribiéndose directamente desde el detalle del evento y verificando la confirmación y la actualización de cupos.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado y un evento futuro con cupos disponibles al que no está inscrito, **When** confirma su inscripción, **Then** el sistema crea la inscripción, reduce en uno los cupos disponibles del evento y muestra una confirmación visual de éxito.
2. **Given** un usuario ya inscrito en un evento, **When** intenta inscribirse nuevamente al mismo evento, **Then** el sistema rechaza la operación y muestra un mensaje indicando que ya está inscrito, sin crear una segunda inscripción.
3. **Given** un evento que alcanzó su capacidad máxima, **When** un usuario no inscrito intenta inscribirse, **Then** el sistema rechaza la operación y muestra un mensaje indicando que el evento no tiene cupos disponibles.
4. **Given** un evento cuya fecha y hora de inicio ya pasaron, **When** un usuario intenta inscribirse, **Then** el sistema rechaza la operación y muestra un mensaje indicando que las inscripciones para ese evento están cerradas.
5. **Given** un visitante sin sesión iniciada, **When** intenta inscribirse a un evento, **Then** el sistema lo dirige a iniciar sesión o crear una cuenta antes de completar la inscripción.

---

### User Story 4 - Cancelar inscripción y consultar mis inscripciones (Priority: P4)

Como usuario autenticado, quiero ver la lista de mis inscripciones y poder cancelar una inscripción existente, para gestionar mi propia participación cuando mis planes cambian.

**Why this priority**: Cierra el ciclo de vida de la inscripción iniciado en la Historia 3 y libera cupos para otros usuarios; es menos crítico que la inscripción inicial pero necesario para una experiencia completa y confiable.

**Independent Test**: Con un usuario autenticado que tiene al menos una inscripción activa, se puede probar consultando "Mis inscripciones" y cancelando una de ellas, verificando que desaparece de la lista de activas y que el cupo del evento aumenta.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con inscripciones existentes, **When** abre "Mis inscripciones", **Then** ve la lista de eventos a los que está inscrito, con su fecha, ubicación y estado.
2. **Given** un usuario autenticado sin inscripciones, **When** abre "Mis inscripciones", **Then** ve un estado vacío que lo invita a explorar el catálogo de eventos.
3. **Given** una inscripción activa de un evento futuro, **When** el usuario solicita cancelarla, **Then** el sistema pide confirmación explícita antes de ejecutar la cancelación.
4. **Given** el usuario confirma la cancelación, **When** se ejecuta, **Then** el sistema marca la inscripción como cancelada, aumenta en uno los cupos disponibles del evento y muestra confirmación visual.
5. **Given** una inscripción que pertenece a otro usuario, **When** se intenta cancelar, **Then** el sistema rechaza la operación.

---

### User Story 5 - Administrar el catálogo de eventos (Priority: P5)

Como administrador, quiero crear, consultar, actualizar y eliminar eventos, incluyendo su capacidad máxima, para mantener el catálogo actualizado y confiable.

**Why this priority**: Sin esta capacidad no existe contenido que descubrir ni inscribir; se prioriza después de las historias de usuario final porque, operativamente, el catálogo inicial puede poblarse una sola vez y mantenerse con menor frecuencia que las inscripciones.

**Independent Test**: Con una sesión de administrador, se puede probar creando un evento con datos válidos, consultándolo, actualizando alguno de sus campos y finalmente eliminándolo, verificando en cada paso el estado del catálogo.

**Acceptance Scenarios**:

1. **Given** una sesión de administrador, **When** crea un evento con nombre, descripción, fecha, hora, ubicación y capacidad máxima válidos, **Then** el sistema lo publica en el catálogo con los cupos disponibles iguales a la capacidad máxima.
2. **Given** una sesión de administrador, **When** intenta crear un evento con una fecha y hora en el pasado, **Then** el sistema rechaza la operación y muestra un mensaje indicando que la fecha debe ser futura.
3. **Given** una sesión de administrador, **When** intenta crear o actualizar un evento dejando algún campo obligatorio vacío (nombre, descripción, fecha, hora, ubicación o capacidad máxima), **Then** el sistema rechaza la operación y señala específicamente los campos pendientes.
4. **Given** un evento existente, **When** un administrador actualiza su información (incluida la capacidad máxima), **Then** el sistema guarda los cambios y refleja los nuevos cupos disponibles de forma consistente con las inscripciones activas.
5. **Given** un evento existente, **When** un administrador solicita eliminarlo, **Then** el sistema exige confirmación explícita antes de retirarlo del catálogo.
6. **Given** una sesión de un Usuario sin rol de Administrador, **When** intenta crear, actualizar o eliminar un evento, **Then** el sistema rechaza la operación por permisos insuficientes.

---

### User Story 6 - Consultar inscripciones y cupos como administrador (Priority: P6)

Como administrador, quiero consultar las inscripciones de un evento específico y ver claramente sus cupos ocupados y disponibles, para controlar el aforo y la operación del evento.

**Why this priority**: Es una capacidad de supervisión que depende de que ya existan eventos e inscripciones; agrega valor de control operativo una vez que el flujo principal de descubrimiento e inscripción funciona.

**Independent Test**: Con un evento que tiene al menos una inscripción activa, se puede probar abriendo la vista administrativa de ese evento y verificando que la lista de inscritos y el conteo de cupos coinciden con el estado real.

**Acceptance Scenarios**:

1. **Given** un evento con inscripciones activas, **When** un administrador consulta sus inscripciones, **Then** ve la lista de usuarios inscritos junto con el conteo de cupos ocupados y disponibles.
2. **Given** un evento sin inscripciones, **When** un administrador consulta sus inscripciones, **Then** ve un estado vacío indicando que aún no hay inscritos.
3. **Given** una inscripción se cancela, **When** el administrador vuelve a consultar las inscripciones del evento, **Then** el conteo de cupos disponibles refleja la cancelación de forma inmediata.

---

### Edge Cases

- Dos usuarios intentan inscribirse simultáneamente al último cupo disponible de un evento: el sistema debe otorgar el cupo a una sola inscripción y rechazar la otra con el mensaje de capacidad máxima alcanzada, sin permitir sobre-inscripción.
- Un usuario intenta cancelar una inscripción que ya fue cancelada previamente (por ejemplo, doble clic o pestañas duplicadas): el sistema debe evitar cancelaciones duplicadas y mostrar un estado consistente.
- Un administrador reduce la capacidad máxima de un evento a un número menor que las inscripciones activas actuales: el sistema no debe permitir una capacidad inferior a los inscritos activos y debe explicar por qué.
- Un administrador intenta eliminar un evento que tiene inscripciones activas: el sistema debe advertir explícitamente sobre el impacto antes de confirmar la eliminación.
- Un evento cambia de "próximo" a "en curso" mientras un usuario tiene abierta la pantalla de detalle: si el usuario intenta inscribirse después de ese cambio, la inscripción debe rechazarse como evento ya iniciado.
- Un usuario pierde la conexión de red justo después de confirmar una inscripción o cancelación: el sistema debe permitir reintentar sin generar una operación duplicada ni dejar el estado ambiguo para el usuario.
- La sesión de un usuario expira mientras completa un formulario (inscripción, creación o edición de evento): el sistema debe solicitar reautenticación conservando, en la medida de lo posible, la intención original sin pérdida silenciosa de datos.
- Un visitante intenta acceder directamente a una URL de "Mis inscripciones" o de administración sin sesión o sin permisos suficientes: el sistema debe bloquear el acceso y explicar el motivo.
- Un evento no tiene ninguna inscripción y es eliminado: la eliminación procede sin advertencias adicionales de impacto sobre inscritos.
- El catálogo de eventos está completamente vacío (por ejemplo, instalación nueva): el sistema debe mostrar un estado vacío distinto al de "sin resultados de búsqueda", orientado a que un administrador cargue el primer evento.

## Requirements *(mandatory)*

### Reglas de negocio

- **BR-001**: Un usuario no puede tener más de una inscripción activa al mismo evento.
- **BR-002**: Un usuario no puede inscribirse en un evento cuyos cupos disponibles sean cero.
- **BR-003**: Un usuario puede cancelar una inscripción activa propia en cualquier momento antes de que el evento haya comenzado.
- **BR-004**: Los cupos disponibles de un evento se recalculan de inmediato cada vez que se crea o se cancela una inscripción.
- **BR-005**: Solo los administradores pueden crear, actualizar o eliminar eventos.
- **BR-006**: Todo evento debe tener nombre, descripción, fecha, hora, ubicación y capacidad máxima.
- **BR-007**: No se pueden crear ni reprogramar eventos con una fecha y hora en el pasado.
- **BR-008**: No se pueden crear inscripciones para un evento cuya fecha y hora de inicio ya pasaron.
- **BR-009**: Toda operación que falle una validación de negocio debe devolver un mensaje de error claro y específico sobre la causa del fallo.
- **BR-010**: Los cupos disponibles de un evento se calculan como su capacidad máxima menos el número de inscripciones activas (no canceladas).
- **BR-011**: La capacidad máxima de un evento no puede actualizarse a un valor menor que el número de inscripciones activas que tiene en ese momento.

### Functional Requirements

**Cuentas y acceso**

- **FR-001**: El sistema DEBE permitir a un visitante crear una cuenta indicando nombre, correo electrónico y contraseña.
- **FR-002**: El sistema DEBE permitir a un usuario con cuenta iniciar sesión con su correo electrónico y contraseña.
- **FR-003**: El sistema DEBE impedir la creación de una cuenta con un correo electrónico ya registrado y mostrar un mensaje de error específico.
- **FR-004**: El sistema DEBE permitir a un usuario autenticado cerrar su sesión.
- **FR-005**: El sistema DEBE distinguir entre el rol Usuario y el rol Administrador y aplicar los permisos definidos en "Actores y permisos" a cada acción.

**Catálogo y detalle de eventos**

- **FR-006**: El sistema DEBE permitir a cualquier visitante, autenticado o no, consultar el catálogo de eventos disponibles.
- **FR-007**: El sistema DEBE mostrar, para cada evento del catálogo, al menos nombre, fecha, hora, ubicación y cupos disponibles sobre capacidad total.
- **FR-008**: El sistema DEBE permitir filtrar y/o buscar eventos por texto y por al menos un criterio estructurado (por ejemplo, fecha o ubicación).
- **FR-009**: El sistema DEBE indicar de forma clara, mediante texto e iconografía además del color, cuándo un evento está agotado.
- **FR-010**: El sistema DEBE permitir consultar el detalle completo de un evento individual, incluyendo nombre, descripción, fecha, hora, ubicación, capacidad máxima y cupos disponibles.

**Inscripciones**

- **FR-011**: El sistema DEBE permitir a un usuario autenticado inscribirse en un evento futuro con cupos disponibles.
- **FR-012**: El sistema NO DEBE permitir que un usuario se inscriba dos veces en el mismo evento (BR-001).
- **FR-013**: El sistema NO DEBE permitir una inscripción cuando el evento alcanzó su capacidad máxima (BR-002).
- **FR-014**: El sistema NO DEBE permitir inscripciones a un evento cuya fecha y hora de inicio ya pasaron (BR-008).
- **FR-015**: El sistema DEBE actualizar los cupos disponibles de un evento inmediatamente después de crear una inscripción (BR-004).
- **FR-016**: El sistema DEBE permitir a un usuario autenticado cancelar una inscripción propia y activa (BR-003).
- **FR-017**: El sistema DEBE actualizar los cupos disponibles de un evento inmediatamente después de cancelar una inscripción (BR-004).
- **FR-018**: El sistema DEBE permitir a un usuario autenticado consultar la lista de sus propias inscripciones, incluyendo su estado (activa o cancelada).
- **FR-019**: El sistema DEBE solicitar confirmación explícita antes de cancelar una inscripción.
- **FR-020**: El sistema NO DEBE permitir que un usuario cancele una inscripción que pertenece a otro usuario.
- **FR-021**: El sistema DEBE redirigir a un visitante sin sesión iniciada a iniciar sesión o crear una cuenta cuando intenta inscribirse o cancelar una inscripción.

**Administración de eventos**

- **FR-022**: El sistema DEBE permitir únicamente a administradores crear nuevos eventos.
- **FR-023**: El sistema DEBE exigir nombre, descripción, fecha, hora, ubicación y capacidad máxima al crear un evento (BR-006).
- **FR-024**: El sistema NO DEBE permitir crear o actualizar un evento con una fecha y hora en el pasado (BR-007).
- **FR-025**: El sistema NO DEBE permitir una capacidad máxima igual o menor a cero.
- **FR-026**: El sistema DEBE permitir únicamente a administradores actualizar los datos de un evento existente, incluida su capacidad máxima.
- **FR-027**: El sistema NO DEBE permitir reducir la capacidad máxima de un evento por debajo del número de inscripciones activas actuales (BR-011).
- **FR-028**: El sistema DEBE permitir únicamente a administradores eliminar eventos.
- **FR-029**: El sistema DEBE solicitar confirmación explícita antes de eliminar un evento.
- **FR-030**: El sistema DEBE advertir al administrador si el evento que intenta eliminar tiene inscripciones activas, antes de confirmar la eliminación.

**Administración de inscripciones y cupos**

- **FR-031**: El sistema DEBE permitir únicamente a administradores consultar la lista de inscripciones de un evento específico.
- **FR-032**: El sistema DEBE mostrar a los administradores el número de cupos ocupados y disponibles de cada evento.

**Validación y manejo de errores (transversal)**

- **FR-033**: El sistema DEBE validar el formato del correo electrónico al crear una cuenta.
- **FR-034**: El sistema DEBE mostrar mensajes de error claros, específicos y orientados a la acción cuando cualquier validación de datos o de negocio falle (BR-009).
- **FR-035**: El sistema DEBE impedir el acceso a funciones administrativas a cualquier sesión sin rol de Administrador, mostrando un mensaje de permisos insuficientes.

### Validaciones

- **V-001**: Nombre del evento — obligatorio, texto no vacío.
- **V-002**: Descripción del evento — obligatoria, texto no vacío.
- **V-003**: Fecha y hora del evento — obligatorias; la combinación de fecha y hora debe ser posterior al momento de creación o actualización del evento (BR-007).
- **V-004**: Ubicación del evento — obligatoria, texto no vacío.
- **V-005**: Capacidad máxima del evento — obligatoria, número entero mayor a cero; al reducirse, no puede ser menor que las inscripciones activas actuales (BR-011).
- **V-006**: Correo electrónico de cuenta — obligatorio, formato de correo electrónico válido, único entre las cuentas existentes.
- **V-007**: Contraseña de cuenta — obligatoria, con una longitud mínima razonable definida por buenas prácticas de seguridad.
- **V-008**: Inscripción — requiere una sesión de usuario válida, un evento existente, cupos disponibles mayores a cero y que el evento no haya comenzado.
- **V-009**: Cancelación de inscripción — requiere que la inscripción exista, pertenezca al usuario autenticado y se encuentre activa.

### Manejo de errores

- **E-001**: Campo obligatorio o formato inválido en un formulario → el sistema impide el envío y señala el campo específico con una indicación de cómo corregirlo.
- **E-002**: Intento de inscripción a un evento sin cupos disponibles → mensaje indicando que el evento alcanzó su capacidad máxima; no se crea la inscripción.
- **E-003**: Intento de inscripción duplicada al mismo evento → mensaje indicando que el usuario ya está inscrito; no se crea una segunda inscripción.
- **E-004**: Intento de inscripción o cancelación sobre un evento ya iniciado → mensaje indicando que las inscripciones para ese evento están cerradas.
- **E-005**: Intento de acción sin los permisos requeridos (por ejemplo, un Usuario intentando administrar eventos) → mensaje de acceso denegado, sin exponer información interna del sistema.
- **E-006**: Intento de operar sobre un evento o inscripción que ya no existe → mensaje indicando que el recurso ya no está disponible, con una opción para volver al catálogo o a "Mis inscripciones".
- **E-007**: Falla de comunicación con el servidor durante una acción → mensaje de error transitorio con opción de reintentar, conservando los datos ya ingresados en el formulario cuando sea posible.
- **E-008**: Expiración de la sesión durante una acción en curso → mensaje solicitando reautenticación, preservando la intención original de la acción cuando sea posible.
- **E-009**: Intento de crear una cuenta con un correo ya registrado → mensaje indicando que el correo ya está en uso, sin revelar más información de la cuenta existente.

### Key Entities

- **Usuario**: persona que interactúa con la plataforma. Atributos clave: nombre, correo electrónico (único), credencial de acceso, rol (Usuario o Administrador), fecha de creación de la cuenta. Se relaciona con cero o más Inscripciones.
- **Evento**: capacidad publicada por un Administrador para que los Usuarios se inscriban. Atributos clave: nombre, descripción, fecha, hora, ubicación, capacidad máxima, cupos disponibles (derivado de BR-010), estado temporal (próximo, en curso o finalizado, derivado de la fecha/hora actual). Se relaciona con cero o más Inscripciones.
- **Inscripción**: relación entre un Usuario y un Evento que representa la intención de asistencia. Atributos clave: usuario, evento, fecha de creación, estado (activa o cancelada), fecha de cancelación (si aplica). Regla: como máximo una Inscripción activa por combinación única de Usuario y Evento (BR-001).

## Requisitos operativos en OpenShift

**Perfil de ejecución**: aplicación web con un área pública de descubrimiento (catálogo y detalle de eventos) y áreas autenticadas para Usuario (inscripciones propias) y Administrador (gestión de eventos e inscripciones). Todas las capacidades son de consulta o transacción síncrona; no se identifican procesos por lotes, tareas programadas ni trabajos de larga duración en esta versión.

**Matriz de componentes lógicos**:

| Capacidad | Tipo de trabajo | Dependencias | Persistencia | Acceso | Condición funcional de salud |
|---|---|---|---|---|---|
| Catálogo y detalle de eventos | Consulta síncrona | Datos de eventos | Lectura de datos durables de eventos | Público | Responde listado y detalle con cupos actualizados |
| Cuenta y sesión de usuario | Transaccional síncrono | Datos de usuarios | Datos durables de cuentas | Público (registro/login) | Emite y valida sesiones correctamente |
| Inscripciones | Transaccional síncrono | Datos de eventos y de usuarios | Datos durables de inscripciones | Usuario autenticado | Cupos consistentes con inscripciones activas en todo momento |
| Administración de eventos | Transaccional síncrono | Datos de eventos | Datos durables de eventos | Administrador autenticado | Operaciones CRUD disponibles y consistentes |
| Administración de inscripciones y cupos | Consulta síncrona | Datos de inscripciones y eventos | Lectura de datos durables | Administrador autenticado | Refleja el estado real de inscritos y cupos |
| Punto de entrada unificado | Enrutamiento síncrono | Todas las capacidades anteriores | No aplica | Público y autenticado según ruta | Enruta solicitudes y aplica validación de sesión/rol |

**Matriz de datos**:

| Dato | Propietario funcional | Durabilidad | Sensibilidad | Retención | Recuperación | Migración requerida |
|---|---|---|---|---|---|---|
| Cuenta de usuario (nombre, correo, credencial, rol) | Capacidad de cuentas | Durable | Interna / dato personal básico | Mientras la cuenta exista | Backup estándar | No aplica (funcionalidad nueva) |
| Evento (nombre, descripción, fecha, hora, ubicación, capacidad) | Capacidad de eventos | Durable | Interna | Mientras el evento y su historial sean relevantes | Backup estándar | No aplica |
| Inscripción (usuario, evento, estado, fechas) | Capacidad de inscripciones | Durable | Interna | Se conserva el historial de inscripciones activas y canceladas para trazabilidad | Backup estándar | No aplica |

**Integraciones**: no se identifican integraciones con sistemas externos en esta versión (sin pagos, sin notificaciones, sin proveedores externos de identidad). Existe un contrato funcional interno entre la capacidad de Inscripciones y la de Eventos para verificar y actualizar cupos de forma consistente (BR-004, BR-010).

**Escenarios operativos**: alta de un nuevo evento por un administrador antes de su publicación; consulta pública en horas de alta demanda de un evento popular con cupos limitados; degradación de la capacidad transaccional de inscripción, en cuyo caso el catálogo debe seguir siendo consultable en modo de solo lectura. No se identifican migraciones de datos existentes, al tratarse de una funcionalidad nueva.

**Delta y paridad**: todo el comportamiento descrito en esta especificación es nuevo (`ADDED`); no existe comportamiento previo del sistema que deba preservarse o compararse.

**Observabilidad funcional**: señales derivadas de los flujos críticos, entre ellas intentos de inscripción rechazados por falta de cupo o por duplicidad, tasa de inscripciones creadas y canceladas por evento, e intentos de acceso a funciones administrativas sin permisos suficientes.

**Smoke test**: crear un evento de prueba con capacidad máxima de uno, inscribir a un usuario de prueba, verificar que un segundo usuario no puede inscribirse por falta de cupo, cancelar la inscripción del primer usuario y verificar que el cupo vuelve a estar disponible.

**Documentación de entrega**: esta especificación funcional, el catálogo de reglas de negocio (BR-001 a BR-011), las validaciones (V-001 a V-009) y el manejo de errores (E-001 a E-009) definidos arriba constituyen la documentación de referencia para diseño, pruebas y operación de esta funcionalidad.

## Requisitos no funcionales y restricciones

**Experiencia de usuario y diseño visual**

- **NFR-001**: La interfaz DEBE aplicar una identidad visual bohemia, cálida y contemporánea, con una paleta basada principalmente en tonos tierra y naturales (terracota, arcilla, arena, beige, crema, marrón, verde oliva), evitando una apariencia excesivamente saturada, de forma consistente en todas las vistas.
- **NFR-002**: La interfaz DEBE presentar jerarquía visual clara y navegación intuitiva, de modo que una persona nueva encuentre el catálogo, el detalle de un evento y sus propias inscripciones sin instrucciones adicionales.
- **NFR-003**: La interfaz DEBE ser completamente utilizable en resoluciones de escritorio, tablet y móvil, sin pérdida de información ni de funciones entre tamaños de pantalla.
- **NFR-004**: Cada vista que dependa de datos DEBE definir explícitamente un estado de carga, un estado vacío, un estado de error y un estado de éxito, cada uno con mensaje e indicación visual propios.
- **NFR-005**: Los formularios (registro de cuenta, inicio de sesión, inscripción, creación/edición de evento) DEBEN mostrar validaciones e indicaciones de error específicas por campo, sin obligar a adivinar la causa del error.
- **NFR-006**: Toda acción relevante para la persona usuaria (inscripción, cancelación, creación, actualización o eliminación de evento, inicio o cierre de sesión) DEBE producir una confirmación visual inmediata de éxito o de fallo.
- **NFR-007**: El catálogo DEBE presentar los eventos mediante tarjetas visualmente atractivas que muestren de forma prominente nombre, fecha, ubicación y cupos disponibles.
- **NFR-008**: El catálogo DEBE ofrecer filtros y búsqueda simples de usar, aplicables en un solo paso, combinando texto libre con al menos un criterio estructurado.
- **NFR-009**: La información de cupos disponibles sobre capacidad total DEBE ser visible en el listado y en el detalle de cada evento en todo momento, incluyendo cuando un evento está agotado.
- **NFR-010**: El flujo de inscripción a un evento DEBE completarse en pocos pasos desde el detalle del evento (idealmente revisar y confirmar).
- **NFR-011**: Las acciones destructivas o irreversibles para la persona usuaria (cancelar una inscripción, eliminar un evento) DEBEN requerir una confirmación explícita antes de ejecutarse.
- **NFR-012**: La interfaz DEBE mantener un contraste de color adecuado para la legibilidad y NO DEBE comunicar ningún estado (disponible, agotado, error, éxito) usando únicamente el color; debe complementarlo con texto e iconografía.
- **NFR-013**: Las vistas de Usuario y de Administrador DEBEN compartir el mismo lenguaje visual (tipografía, iconografía, espaciado y composición) para mantener consistencia entre ambas.

**Seguridad y privacidad**

- **NFR-014**: Las contraseñas de las cuentas NO DEBEN mostrarse en texto plano en ninguna interfaz.
- **NFR-015**: Una sesión de usuario DEBE finalizar al cerrar sesión explícitamente o tras un período razonable de inactividad.
- **NFR-016**: Los datos personales de un usuario (correo electrónico, historial de inscripciones) solo DEBEN ser visibles para el propio usuario y para los administradores dentro del ámbito de sus funciones descritas en "Actores y permisos".

**Rendimiento y disponibilidad**

- **NFR-017**: Las acciones principales (listar eventos, ver detalle, inscribirse, cancelar) DEBEN reflejar su resultado a la persona usuaria en un tiempo comparable al de una aplicación web moderna bajo condiciones normales de operación.
- **NFR-018**: El sistema DEBE mantener la consistencia de cupos disponibles incluso ante inscripciones o cancelaciones concurrentes sobre el mismo evento.

**Accesibilidad**

- **NFR-019**: La interfaz DEBE ser navegable y comprensible utilizando tecnologías de asistencia y navegación por teclado para las acciones principales (consultar, inscribirse, cancelar, administrar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede crear una cuenta e inscribirse en un evento disponible en menos de 3 minutos desde que llega al catálogo.
- **SC-002**: El listado de eventos y sus cupos disponibles reflejan una inscripción o cancelación reciente en menos de 2 segundos para cualquier persona que consulte el catálogo o el detalle.
- **SC-003**: El 100% de los intentos de inscripción duplicada o de inscripción a un evento sin cupo son rechazados con el mensaje de error correspondiente, sin generar inscripciones inválidas.
- **SC-004**: Ante 100 intentos de inscripción concurrentes sobre un mismo evento con capacidad limitada, el número final de inscripciones activas nunca supera la capacidad máxima del evento.
- **SC-005**: El proceso de inscripción se completa en un máximo de 2 pasos desde el detalle del evento hasta la confirmación.
- **SC-006**: Un administrador puede crear un evento y verlo reflejado en el catálogo público en menos de 1 minuto.
- **SC-007**: El 100% de las vistas principales (catálogo, detalle, mis inscripciones, administración de eventos) son utilizables sin pérdida de funcionalidad en resoluciones de escritorio, tablet y móvil.
- **SC-008**: El 100% de las acciones destructivas (cancelar inscripción, eliminar evento) exigen una confirmación explícita antes de ejecutarse.
- **SC-009**: En una evaluación de accesibilidad básica, ningún estado de la interfaz (disponible, agotado, error, éxito) depende únicamente del color para comunicarse.

## Assumptions

- Se asume autenticación basada en cuenta propia del sistema (correo electrónico y contraseña); no se incluye inicio de sesión mediante proveedores externos en esta versión. Validar en `plan` si surge un requisito corporativo de identidad.
- Se asume que la contraseña de una cuenta debe cumplir una longitud mínima razonable acorde a buenas prácticas de seguridad, ya que el usuario no especificó una política concreta.
- Se asume que un evento representa una única ocasión (fecha y hora de inicio), sin múltiples sesiones ni recurrencia; eventos recurrentes quedan fuera de alcance de esta versión.
- Se asume que la cancelación de una inscripción es posible en cualquier momento antes del inicio del evento, sin una ventana mínima de anticipación adicional, salvo que el usuario indique lo contrario.
- Se asume que reducir la capacidad máxima de un evento por debajo del número de inscritos activos no está permitido (BR-011); el administrador debe gestionar cancelaciones antes de reducir el cupo. Validar esta regla con negocio si se requiere un comportamiento distinto.
- Se asume que eliminar un evento con inscripciones activas es una operación permitida tras una confirmación explícita con advertencia, no una operación bloqueada por completo.
- Se asume que no existen listas de espera para eventos agotados en esta versión; un usuario solo puede inscribirse si hay cupo disponible en el momento de la solicitud.
- Se asume que la interfaz se entrega en un único idioma (español) en esta versión.
- Se asume que no se requiere procesamiento de pagos, ya que el usuario no mencionó costos de inscripción.
- Se asume que los administradores no gestionan cuentas de otros usuarios (por ejemplo, suspensión o eliminación) en esta versión; esa capacidad queda fuera de alcance.
- Se asume que el historial de inscripciones canceladas se conserva para trazabilidad y para que el usuario pueda consultarlo, en lugar de eliminarse físicamente.

## Criterios de terminado de la feature

- El comportamiento de las seis historias de usuario está reflejado en esta especificación y puede verificarse mediante sus escenarios de aceptación.
- Las reglas de negocio sobre inscripción única, capacidad máxima, actualización de cupos y fechas (BR-001 a BR-011) están cubiertas por requisitos funcionales verificables y por los casos límite identificados.
- Todos los mensajes de error definidos en "Manejo de errores" (E-001 a E-009) corresponden a una validación o regla de negocio verificable.
- Los requisitos no funcionales de experiencia de usuario, accesibilidad y consistencia visual entre las vistas de Usuario y Administrador quedan documentados y son verificables.
- Esta especificación no conserva marcadores `[NEEDS CLARIFICATION]` pendientes.
- El escenario de smoke test funcional descrito (crear evento de capacidad uno, inscribir, rechazar por sobrecupo, cancelar, liberar cupo) puede ejecutarse de extremo a extremo sobre el comportamiento aceptado.
- La especificación queda lista para continuar de forma autónoma con `speckit.plan` sin bloqueos funcionales pendientes.
