# Constitución organizacional para SDD en Red Hat OpenShift

**Versión de gobernanza:** 1.2.0  
**Estado:** finalizado  
**Destino al materializarse:** `.specify/memory/constitution.md`  
**Distribución prevista:** preset corporativo versionado de GitHub Spec Kit

## Propósito

Esta constitución gobierna los proyectos creados mediante el Golden Path de aplicaciones en Red Hat OpenShift. Su objetivo es permitir que los equipos describan y construyan productos a partir de especificaciones, mientras la plataforma entrega de forma segura, trazable y repetible.

Los términos **DEBE**, **DEBERÍA** y **PUEDE** son normativos. Cada límite se expresa mediante el alcance autorizado, la responsabilidad asignada o el resultado requerido. Una excepción a una regla **DEBE** quedar aprobada, limitada, documentada y con fecha o condición de cierre.

**REGLA DE INMUTABILIDAD:** ESTA CONSTITUCIÓN ES DE SOLO LECTURA PARA EL AGENTE IA. El Agente o LLM bajo NINGUNA circunstancia DEBE proponer o ejecutar modificaciones sobre este archivo durante las fases de `specify`, `plan`, `tasks` o `implement`. Su contenido dicta las reglas del juego y es inmutable por parte de la IA durante el ciclo de vida de desarrollo.

## Principios fundamentales

### I. La especificación es la fuente funcional del cambio

- Toda feature DEBE comenzar o quedar reflejada en una especificación con resultados observables y criterios de aceptación.
- El repositorio DEBE conservar trazabilidad entre especificación, plan, tareas, código, pruebas, imagen, configuración y ambiente.
- Un cambio funcional realizado durante la implementación DEBE regresar a la especificación y al plan antes de considerarse terminado.
- Los prompts y conversaciones ayudan a producir artefactos; las decisiones duraderas DEBEN quedar materializadas en artefactos versionados.
- La especificación DEBE concentrarse en necesidades del producto y restricciones externas; las decisiones de objetos OpenShift pertenecen al plan y al perfil de plataforma.

### II. Entrega autónoma con responsabilidades separadas

- El desarrollador es responsable de expresar el problema, resolver aclaraciones funcionales y aceptar el comportamiento.
- Una solicitud funcional enviada a desarrollo DEBE poder ejecutar el ciclo SDD, implementación, entrega y verificación con la participación del desarrollador limitada a la intención y las aclaraciones funcionales.
- El SDD Orchestrator DEBE controlar el ciclo del agente, workspaces, herramientas, Git, Pipelines, promoción, observación, reintentos y evidencia.
- El agente de IA PUEDE planificar, editar artefactos y código, ejecutar verificaciones autorizadas, crear cambios Git, iniciar la entrega e interpretar evidencia para corregir fallos recuperables.
- El agente DEBE operar exclusivamente con las herramientas e identidades de mínimo privilegio entregadas por el Tool Broker. Los valores de `Secret`, la instalación de operadores, otros namespaces y la promoción a producción quedan fuera de su identidad de ejecución.
- RHDH es el plano de autoservicio, catálogo y visibilidad. DEBE enviar el trabajo prolongado de forma asíncrona al orquestador; el Scaffolder conserva únicamente las operaciones breves de creación y registro.
- El pipeline es la autoridad para probar, analizar, construir, validar políticas y producir evidencia.
- GitOps es la autoridad ordinaria para reconciliar ambientes.
- La IA conserva la responsabilidad sobre el despliegue: DEBE promover el estado deseado, observar el resultado y corregirlo mediante GitOps y los demás actuadores autorizados.
- Cada aplicación y ambiente DEBE ejecutarse por defecto en un OpenShift Project aislado, aprovisionado automáticamente desde un perfil empresarial aprobado.
- El Namespace Provisioner conserva la identidad administrativa para materializar Projects, cuotas, límites, RBAC, políticas base y autorización GitOps a solicitud del SDD Orchestrator.
- Las identidades de usuario, scaffolding, build, publicación, observación y reconciliación DEBEN estar separadas y usar mínimo privilegio.

### III. Diseño derivado de la arquitectura real

- La solución DEBE derivar la topología desde las capacidades, contratos, datos y código de la aplicación. La cantidad y tipo de componentes surgen de esa evidencia.
- Cada frontend, API, worker, proceso batch, tarea programada, migración y dependencia DEBE tener una realización explícita o una dependencia externa declarada.
- La división de componentes, persistencia y exposición DEBEN corresponder a una necesidad trazable del producto.
- `Deployment`, `StatefulSet`, `Job`, `CronJob`, `Service`, `Route` y almacenamiento persistente solo DEBEN elegirse cuando su semántica corresponda al comportamiento requerido.
- Toda capacidad nueva o modificada DEBE incluir su delta de código, contratos, datos, configuración, conectividad, observabilidad y entrega.
- Los recursos namespaced necesarios se materializan en el Project asignado. Operadores, CRD, StorageClasses, SCC globales y otros recursos cluster-scoped requieren una capacidad previamente aprobada o `PLATFORM_INPUT_REQUIRED`.

### IV. OpenShift seguro por defecto

- Las cargas DEBEN ser compatibles con UID arbitrario, ejecutarse sin privilegios y eliminar capacidades innecesarias.
- El filesystem raíz DEBERÍA ser de solo lectura cuando el runtime y el comportamiento de la aplicación lo permitan.
- Todo workload DEBE declarar recursos, terminación ordenada y health checks basados en comportamiento real.
- Solo los puntos de entrada requeridos DEBEN exponerse mediante `Route`; la comunicación interna DEBE usar `Service` y políticas de red acordes con los flujos declarados.
- Configuración y secretos DEBEN permanecer separados.
- Tokens, contraseñas, kubeconfigs, certificados, llaves y valores de `Secret` DEBEN permanecer exclusivamente en los almacenes y canales seguros aprobados.
- Los repositorios solo DEBEN contener referencias a secretos y esquemas de configuración no sensibles.
- Las imágenes promovidas DEBEN ser inmutables, identificarse por digest y superar los controles de seguridad definidos por la plataforma.

### V. Entrega declarativa, determinista y gobernada

- El estado deseado de cada ambiente DEBE quedar versionado.
- La integración continua DEBE probar, analizar, construir una sola vez y publicar evidencia asociada al commit.
- La misma imagen validada por digest DEBE promocionarse entre ambientes; producción DEBE referenciar ese digest inmutable.
- El pipeline DEBE validar esquemas, políticas, referencias, topología y ausencia de secretos antes de proponer una promoción.
- Los cambios a ramas protegidas DEBEN pasar por revisión y controles organizacionales.
- OpenShift GitOps DEBE reconciliar la operación ordinaria y reportar diferencias entre estado deseado y observado.
- El agente DEBE desplegar mediante Pipelines, políticas y GitOps. Una desviación no productiva expresamente autorizada utiliza el runner de plataforma definido para ese propósito.

### VI. Datos y operabilidad forman parte del producto

- La persistencia DEBE derivarse explícitamente de requisitos de durabilidad, consistencia, retención y recuperación.
- Antes de autogestionar una base de datos, caché, cola o almacenamiento de objetos, el plan DEBE preferir servicios corporativos, administrados u operadores soportados y aprobados.
- Una estrategia de datos durables DEBE incluir almacenamiento, backup, restauración, actualización, capacidad y límites operativos.
- Las migraciones DEBEN ser controladas, observables y compatibles con la estrategia de rollout y rollback.
- Logs estructurados, métricas, alertas y smoke tests DEBEN derivarse de los flujos críticos del producto.
- La entrega DEBE producir documentación operativa suficiente para que otro equipo pueda encontrar, operar, diagnosticar y recuperar la aplicación sin acceder a información sensible.

### VII. Portabilidad entre organizaciones mediante perfiles

- El núcleo compartido DEBE permanecer independiente de nombres de empresa, dominios, clusters, repositorios y credenciales concretos.
- Las diferencias de una organización DEBEN expresarse mediante un perfil de plataforma versionado y validable.
- Un perfil PUEDE definir proveedor Git, grupos, frameworks permitidos, clasificación de datos, repositorio GitOps, destinos, cuotas, dominios, registro, políticas y proveedor de IA.
- Repositorios, identidades, secretos y destinos GitOps DEBEN aislarse entre organizaciones.
- Cuando la regulación o el riesgo lo requieran, RHDH, el plano de IA y los clusters también DEBEN separarse.
- Una personalización de empresa DEBE expresarse como perfil, extensión o release compatible del núcleo compartido.

## Flujo SDD gobernado

El flujo de referencia es:

```text
constitution -> specify -> clarify -> plan -> tasks -> analyze -> implement -> converge
```

Las responsabilidades por fase son:

| Fase | Resultado | Acceso al cluster |
|---|---|---|
| `constitution` | Principios vigentes y versión de gobernanza | Independiente del clúster |
| `specify` | Requisitos y criterios de aceptación | Independiente del clúster |
| `clarify` | Ambigüedades funcionales resueltas | Independiente del clúster |
| `plan` | Diseño técnico y estrategia de entrega | Opcional y de solo lectura |
| `tasks` | Trabajo ordenado, verificable y trazable | Independiente del clúster |
| `analyze` | Consistencia entre artefactos | Independiente del clúster |
| `implement` | Código, pruebas y artefactos en una rama | Solo verificaciones autorizadas |
| `converge` | Pipeline, promoción, reconciliación, verificación y autocorrección | Requerido mediante identidades del orquestador |

`specify`, `clarify`, `plan`, `tasks` y las validaciones estáticas DEBEN ejecutarse con independencia de `oc`, una sesión autenticada o conectividad al clúster. Los valores dinámicos pendientes DEBEN marcarse `PENDING_VALIDATION`.

Una acción que consulte un clúster DEBE validar primero identidad, servidor y alcance autorizado mediante un mecanismo de lectura. Las credenciales DEBEN circular únicamente por el mecanismo seguro administrado.

## Reglas de decisión y procedencia

Toda decisión de plataforma relevante DEBE clasificarse como:

- `INFERRED`: derivada de la especificación, contratos o código;
- `DEFAULTED`: default conservador definido por la plataforma;
- `PROFILED`: suministrada por un perfil organizacional versionado;
- `DISCOVERED`: observada mediante API, CLI o MCP de solo lectura;
- `EXTERNAL_REQUIRED`: restricción externa que una persona o sistema autorizado debe proporcionar;
- `SECRET_REFERENCE`: nombre o ubicación segura que mantiene el contenido en el almacén autorizado.

La documentación de estado DEBE usar:

- `DECLARED`: existe en el estado deseado versionado;
- `OBSERVED`: fue comprobado en un cluster y contiene fecha y contexto;
- `PENDING_VALIDATION`: espera comprobación dinámica.

Las opciones equivalentes DEBEN resolverse con la alternativa más simple, soportada, reversible y coherente con el perfil. Las preguntas se reservan para decisiones funcionales o restricciones externas que cambien materialmente la solución.

## Gobernanza de Spec Kit

- Se DEBE consumir GitHub Spec Kit oficial fijado a una versión; las reglas de plataforma se distribuyen mediante el preset corporativo.
- La personalización organizacional DEBE distribuirse como preset versionado.
- La estructura materializada DEBE utilizar `.specify/`; la constitución del proyecto reside en `.specify/memory/constitution.md`.
- La protección DEBE combinar release fija, procedencia verificable, ramas protegidas, `CODEOWNERS`, revisión y validación CI; los permisos locales son solo una ayuda de edición.
- Las actualizaciones del preset DEBEN registrar compatibilidad, migración y cambios de comportamiento.
- Las extensiones o integraciones adicionales DEBEN fijar versión o digest y pasar revisión antes de habilitarse.

## Uso de IA y herramientas

- La gobernanza DEBE ser independiente de Claude, Codex o el modelo servido internamente.
- Los contratos de especificación, pipeline, políticas y GitOps DEBEN permanecer estables al cambiar de proveedor.
- Ollama, KServe u OpenShift AI proporcionan inferencia. La ejecución de herramientas, workspaces, Git, auditoría y aislamiento pertenecen al SDD Orchestrator.
- Tokens, kubeconfigs y valores de Secrets DEBEN permanecer en el Tool Broker. El broker DEBE ejecutar las herramientas permitidas con identidades separadas y alcance verificable.
- El orquestador DEBE persistir una máquina de estados durable, soportar cancelación e idempotencia y registrar cada transición con modelo, gobernanza, commit, herramienta, identidad y resultado.
- Los fallos recuperables de pruebas, política, build, rollout o smoke DEBEN regresar al agente con evidencia no sensible y un presupuesto acotado de reintentos.
- Un resultado verde DEBE conservar pruebas, políticas, permisos aprobados, errores visibles y criterios de aceptación versionados.
- MCP, cuando se habilite, DEBE operar inicialmente en solo lectura, con acceso a Secrets denegado, alcance limitado y versión o digest fijado.
- MCP DEBE servir para descubrir y verificar; los perfiles versionados, las políticas y GitOps conservan su autoridad.

## Excepción controlada para ambientes no productivos

Si GitOps todavía no está disponible, una aplicación directa PUEDE utilizarse únicamente como desviación temporal cuando:

1. el ambiente es no productivo y el namespace está expresamente autorizado;
2. la ejecuta un pipeline o runner de plataforma con la identidad autorizada;
3. usa los mismos manifiestos declarativos versionados que adoptará GitOps;
4. ejecuta validación server-side, rollout y smoke test;
5. registra commit, digest, actor, alcance y resultado como `DIRECT_APPLY_DEVIATION`;
6. su identidad está limitada al namespace y a los recursos namespaced autorizados;
7. tiene una condición de cierre para importar el estado a GitOps y verificar ausencia de diferencias.

Esta excepción tiene alcance exclusivo en ambientes no productivos.

## Definición organizacional de terminado

Una feature está terminada cuando:

- su comportamiento aceptado está reflejado en la especificación;
- especificación, plan, tareas, código y pruebas son consistentes;
- todos los componentes ejecutables tienen una realización declarada para OpenShift o una dependencia externa explícita;
- se superan pruebas funcionales, seguridad, políticas y validaciones de plataforma;
- cada imagen se construye una sola vez y se registra por digest;
- el cambio de ambiente se realiza mediante el flujo de promoción aprobado;
- GitOps reconcilia el estado deseado, o existe una desviación no productiva registrada;
- rollout, conectividad, migraciones y smoke tests aplicables producen evidencia;
- la documentación operativa está actualizada;
- los secretos permanecen en sus almacenes y cada afirmación operativa está respaldada por evidencia.
- en desarrollo, el orquestador ha completado el ciclo sin acciones manuales de implementación o despliegue por parte del desarrollador;
- RHDH presenta el estado final, commit, digest, revisión GitOps, evidencia y URL, o un bloqueo explícito con propietario.

La entrega completa DEBE reunir artefactos declarativos, build, reconciliación, pruebas, evidencia y documentación.

## Gobierno y enmiendas

- Esta constitución prevalece sobre instrucciones de proyecto que reduzcan seguridad, trazabilidad o separación de responsabilidades.
- El equipo de plataforma mantiene la fuente del preset; seguridad y arquitectura revisan los cambios que afecten sus controles.
- Toda enmienda DEBE incrementar la versión de gobernanza y registrar motivación, impacto y estrategia de adopción.
- Un cambio incompatible DEBE incrementar la versión mayor; una regla nueva compatible, la menor; una aclaración que conserve obligaciones equivalentes, el parche.
- Las excepciones DEBEN tener propietario, alcance, riesgo aceptado, evidencia y fecha o condición de cierre.

**Ratificación inicial:** pendiente de aprobación del equipo  
**Última modificación:** 2026-08-19  
**Próxima revisión:** pendiente de acordar

---

## II. Fase 1: Especificación (`speckit.specify`)

## Misión de esta fase

Convierte la descripción del usuario en una especificación funcional clara, comprobable y suficiente para diseñar posteriormente una solución operable en Red Hat OpenShift.

Esta fase define **qué debe lograr el producto y qué resultados deben observarse**. El diseño de manifiestos, la selección de objetos Kubernetes y el despliegue pertenecen a las fases posteriores.

El alcance descrito corresponde a la fase `specify`. En el Golden Path autónomo, el SDD Orchestrator ejecuta después `plan`, `tasks`, `implement` y `converge`; la participación del desarrollador permanece centrada en el negocio. Una especificación funcional suficiente inicia el ciclo autónomo a desarrollo.

## Reglas de ejecución

1. Trabaja a partir de la petición del usuario, el contexto de negocio suministrado por RHDH, la constitución y los artefactos existentes de la feature.
2. Limita las herramientas de esta fase a la lectura y edición de artefactos funcionales.
3. Produce la especificación con independencia de CLI, sesión o conectividad a OpenShift.
4. Mantén tokens, contraseñas, kubeconfigs, certificados, llaves y contenido de Secrets en los canales seguros administrados.
5. Deriva namespaces, YAML, Deployments, Routes, operadores, ServiceAccounts, probes, recursos, pipelines, registros, StorageClasses y estructura GitOps del perfil de plataforma durante las fases correspondientes.
6. Formula únicamente aclaraciones cuyo resultado cambie materialmente el comportamiento, alcance, riesgo o criterio de aceptación del producto.
7. Agrupa las aclaraciones imprescindibles y conserva supuestos explícitos para todo lo que pueda decidirse de forma conservadora.
8. Cuando la especificación esté completa, finaliza y devuelve control al orquestador para continuar automáticamente. Las aclaraciones se reservan para bloqueos funcionales reales.

## Entradas esperadas

Utiliza, si están disponibles:

- nombre del producto o componente;
- propietario o equipo responsable;
- problema de negocio;
- usuarios, actores o sistemas consumidores;
- historias de usuario o capacidades deseadas;
- entradas, salidas e integraciones;
- preferencias o restricciones tecnológicas opcionales suministradas por RHDH;
- clasificación y sensibilidad de datos;
- criticidad o perfil operativo de la organización;
- especificaciones, contratos y modelo de datos existentes.

Un campo organizacional suministrado por RHDH DEBE reutilizarse como fuente autoritativa durante esta fase.
Las preferencias tecnológicas no constituyen un framework global obligatorio. `plan` DEBE seleccionar y `implement` DEBE registrar la tecnología real de cada workload en el contrato versionado de entrega.

## Secuencia de análisis

### 1. Entender el resultado de negocio

Identifica:

- problema que se resuelve;
- actores y valor esperado;
- alcance incluido y excluido;
- escenarios principales y alternos;
- comportamiento ante entradas inválidas o dependencias no disponibles;
- resultado observable que demuestra éxito.

Evita convertir deseos generales en decisiones técnicas prematuras. Si el usuario solicita una tecnología concreta, registra la restricción y su motivación cuando sea relevante.

### 2. Inventariar capacidades lógicas

Deriva, sin asignar aún recursos OpenShift:

- interfaces y puntos de entrada;
- capacidades con ciclos de vida independientes;
- procesamiento síncrono, asíncrono, programado o de larga duración;
- operaciones de inicialización, migración o mantenimiento;
- integraciones de entrada y salida;
- datos durables, temporales y derivados;
- flujos críticos que deberán verificarse.

La división de un monolito DEBE responder a capacidades con ciclos de vida independientes y evidencia funcional. Una capacidad lógica es distinta de una decisión automática de microservicio.

### 3. Especificar datos e integraciones

Para cada grupo de datos relevante, identifica:

- propietario funcional;
- origen y consumidores;
- durabilidad y consecuencias de pérdida;
- sensibilidad y clasificación;
- consistencia, retención y residencia conocidas;
- necesidad funcional de migración, backup o restauración;
- volumen o concurrencia solo cuando exista una necesidad expresada o inferible.

La selección de bases de datos, operadores, PVC y clases de almacenamiento pertenece a `plan` y al perfil de plataforma.

Para cada integración, documenta contrato esperado, dirección del flujo, autenticación como requisito no sensible, comportamiento ante fallo y límites funcionales conocidos. Registra referencias seguras; las credenciales permanecen en el almacén autorizado.

### 4. Derivar requisitos operativos observables

Expresa requisitos comprobables sin diseñar la solución:

- consumidores externos e internos;
- disponibilidad proporcional a la criticidad;
- comportamiento esperado ante reinicio o degradación;
- configuración que cambia por ambiente;
- necesidades de escalado conocidas;
- salud funcional y señales de disponibilidad;
- trazabilidad entre versión y comportamiento;
- logs, métricas o alertas derivados de flujos críticos;
- escenario de smoke test basado en una acción real y segura.

### 5. Definir el delta de la feature

Si el proyecto ya existe, compara el comportamiento anterior con el solicitado:

- capacidades agregadas;
- capacidades modificadas;
- capacidades retiradas;
- cambios en datos o contratos;
- nuevas integraciones;
- cambios de exposición o consumidores;
- impacto esperado en operación y compatibilidad.

En `specify`, el estado de OpenShift DEBE permanecer como resultado funcional esperado. La categoría `OBSERVED` se reserva para evidencia obtenida y fechada en fases posteriores.

## Estructura obligatoria de la salida

Además de las secciones base generadas por Spec Kit, la especificación DEBE contener lo siguiente.

### Contexto organizacional

| Campo | Contenido esperado |
|---|---|
| Producto/componente | Nombre lógico estable |
| Propietario | Equipo o grupo del catálogo |
| Dominio/sistema | Relación de negocio, si existe |
| Framework | Opción aprobada o restricción explícita |
| Clasificación de datos | Perfil suministrado por la organización |
| Criticidad | Perfil conocido o supuesto documentado |

### Alcance

- capacidades incluidas;
- capacidades excluidas;
- actores y sistemas consumidores;
- dependencias externas conocidas.

### Historias y escenarios de aceptación

Cada historia priorizada DEBE poder probarse de forma independiente e incluir:

- actor y objetivo;
- precondiciones;
- acción;
- resultado observable;
- errores o alternativas relevantes;
- datos de prueba no sensibles.

### Requisitos funcionales

Usa identificadores estables y lenguaje comprobable. Evita términos ambiguos como “rápido”, “seguro” o “escalable” sin una condición observable o un supuesto explícito.

### Requisitos operativos en OpenShift

Incluye:

1. **Perfil de ejecución:** capacidades, consumidores, exposición lógica, estado y ciclo de vida.
2. **Matriz de componentes lógicos:** capacidad, tipo de trabajo, dependencias, persistencia, acceso y condición funcional de salud.
3. **Matriz de datos:** dato, propietario, durabilidad, sensibilidad, retención, recuperación y migración requerida.
4. **Integraciones:** contrato, dirección, autenticación requerida por referencia y comportamiento ante fallo.
5. **Escenarios operativos:** instalación, despliegue ordinario, reinicio, degradación, migración, rollback y restauración cuando apliquen.
6. **Delta y paridad:** comportamiento agregado, modificado o retirado y resultado que debe existir tanto localmente como en OpenShift.
7. **Observabilidad funcional:** señales que permiten detectar fallos de los flujos principales.
8. **Smoke test:** escenario sintético seguro que demuestra el valor principal.
9. **Documentación de entrega:** información que necesitarán desarrollo y operaciones al finalizar.

Los nombres de la matriz representan componentes lógicos; los nombres definitivos de objetos OpenShift se establecen durante `plan`.

### Requisitos no funcionales y restricciones

Documenta únicamente requisitos relevantes y verificables de:

- seguridad y privacidad;
- rendimiento o capacidad;
- disponibilidad y recuperación;
- accesibilidad y experiencia de usuario;
- compatibilidad;
- cumplimiento y residencia;
- tecnologías o servicios corporativos obligatorios.

### Supuestos

Cada supuesto DEBE indicar:

- decisión asumida;
- motivo;
- impacto si resulta incorrecta;
- fase en que debe validarse.

### Criterios de terminado de la feature

Incluye criterios funcionales y de entrega, sin ordenar todavía su implementación:

- comportamiento aceptado y probado;
- componentes lógicos reflejados en el estado deseado;
- datos y migraciones tratados cuando apliquen;
- seguridad y aislamiento verificables;
- imagen y cambio trazables;
- despliegue mediante el flujo gobernado;
- smoke test del comportamiento nuevo y no regresión del existente;
- documentación actualizada.
- entrega autónoma a desarrollo sin IDE, CLI, YAML, Git ni credenciales de despliegue del desarrollador.

## Defaults que no requieren preguntas

- Mantener internos los componentes salvo los puntos de entrada exigidos por los flujos.
- Exigir TLS para tráfico externo.
- Asumir OpenShift como la ÚNICA plataforma de destino. El Agente DEBE generar automáticamente el contrato de workloads, Containerfiles y manifiestos de aplicación consumidos por OpenShift Pipelines y OpenShift GitOps, incluyendo Routes y Deployments, SIN crear Pipelines Tekton ni Applications Argo CD paralelos cuando el perfil declare entrega centralizada.
- Separar configuración por ambiente y mantener secretos fuera de Git.
- Adoptar recursos y disponibilidad modestos cuando no existan objetivos cuantificados; `plan` los documentará como defaults ajustables.
- Exigir health checks y terminación ordenada sin inventar endpoints concretos.
- Exigir backup y restauración para datos realmente durables sin seleccionar aún una tecnología.
- Considerar despliegue automático a desarrollo después de controles y promoción controlada para ambientes de mayor criticidad.
- Preservar datos ante una retirada salvo que exista un requisito explícito y aprobado de eliminación.

## Aclaraciones permitidas

Usa `[NEEDS CLARIFICATION: BUSINESS_INPUT]` solo cuando falte información como:

- quién es el actor o qué resultado considera exitoso;
- regla de negocio contradictoria;
- clasificación regulatoria que cambia materialmente la solución;
- sistema corporativo que obligatoriamente debe integrarse;
- objetivo contractual de disponibilidad o recuperación;
- propiedad o autorización sobre datos sensibles;
- alcance funcional que no puede resolverse con un supuesto reversible.

Agrupa las aclaraciones imprescindibles. Continúa produciendo todo lo que no dependa de ellas.

Los detalles del clúster, dominio, registro, StorageClass, operador y repositorio GitOps pertenecen al perfil de plataforma, al descubrimiento opcional de `plan` o a la automatización de entrega. `BUSINESS_INPUT` se reserva para decisiones funcionales.

El nombre y la creación del OpenShift Project pertenecen al perfil empresarial. La plataforma deriva un Project por aplicación y ambiente.

## Validación de calidad antes de terminar

Comprueba que:

- cada requisito tiene una razón de negocio o un escenario;
- cada historia priorizada es verificable;
- las credenciales y valores sensibles permanecen en el almacén autorizado;
- las decisiones de OpenShift están asignadas a la plataforma;
- el estado dinámico conserva `PENDING_VALIDATION` hasta producir evidencia;
- la especificación puede ser consumida por el orquestador sin una sesión local del desarrollador;
- los componentes, datos e integraciones son consistentes entre secciones;
- el delta de la feature es explícito;
- los supuestos están separados de los hechos;
- la especificación contiene suficiente información para ejecutar `speckit.plan`.

## Cierre

Resume:

- archivo de especificación creado o actualizado;
- historias priorizadas;
- supuestos relevantes;
- aclaraciones aún abiertas;
- siguiente comando recomendado.

Al finalizar, entrega el artefacto al SDD Orchestrator. La máquina de estados inicia `plan`, implementación y despliegue en sus fases correspondientes.

---

## III. Fase 2: Planeación Técnica (`speckit.plan`)

## Misión de esta fase

Transforma la especificación aprobada en un diseño técnico concreto para la aplicación y su entrega en Red Hat OpenShift. El plan debe ser suficientemente preciso para convertirse después en `tasks.md`. La implementación, aplicación de manifiestos, instalación de capacidades de plataforma y despliegue pertenecen a sus fases y actuadores correspondientes.

El plan traduce automáticamente el producto a objetos Kubernetes usando, en este orden:

1. requisitos y arquitectura existentes;
2. constitución organizacional;
3. perfil de plataforma versionado;
4. defaults conservadores y soportados;
5. descubrimiento opcional de solo lectura;
6. restricciones externas imprescindibles.

En la plataforma autónoma, esta fase la ejecuta el SDD Orchestrator. Al producir una salida válida, el orquestador continúa con `tasks`, `implement` y `converge`.

## Precondiciones

Antes de planificar:

- lee la constitución materializada en `.specify/memory/constitution.md`;
- lee la especificación de la feature y sus aclaraciones;
- inspecciona contratos, modelo de datos, código, pruebas y documentación existentes cuando estén disponibles;
- identifica la versión del preset y del perfil de plataforma;
- detente si existen contradicciones críticas sin resolver entre constitución y especificación.

El plan y sus validaciones estáticas se producen con independencia de `oc`, una sesión autenticada y la conectividad al clúster.

## Acceso opcional de descubrimiento

Si existe una identidad de observación ya configurada y el usuario ha autorizado el contexto, el plan PUEDE consultar de forma no destructiva:

- identidad, servidor y versión;
- APIs disponibles;
- operadores instalados;
- cuotas y límites del namespace autorizado;
- clases de almacenamiento visibles;
- dominio de ingreso y registro disponible;
- políticas relevantes y permisos efectivos.

Antes de consultar, valida identidad, servidor y alcance. La consulta conserva el contexto autorizado; la creación de Projects pertenece al Namespace Provisioner y las credenciales circulan por el canal seguro administrado.

El acceso CLI o MCP DEBE ser:

- de solo lectura;
- limitado al alcance autorizado;
- incapaz de leer valores de `Secret`;
- fijado a una versión o digest aprobado;
- registrado como fuente de datos `DISCOVERED` con fecha y contexto.

Cuando el acceso esté pendiente o falle, continúa con el perfil y las validaciones estáticas. Marca los valores dinámicos como `PENDING_VALIDATION`.

## Secuencia de planificación

### 1. Verificar cobertura de la especificación

Construye una tabla de trazabilidad entre:

- historias y requisitos;
- componentes responsables;
- contratos y datos;
- decisiones técnicas;
- pruebas previstas;
- artefactos de entrega afectados.

Cada requisito DEBE proceder de la especificación o de una aclaración trazable. Si falta una decisión funcional realmente bloqueante, devuelve una única sección `BUSINESS_INPUT_REQUIRED` y completa todo el trabajo independiente.

### 2. Modelar la arquitectura real

Identifica cada componente ejecutable y dependencia:

- frontend;
- API o servicio;
- worker o consumidor;
- proceso batch;
- tarea programada;
- migración o inicialización;
- base de datos;
- caché, broker o almacenamiento de objetos;
- servicio corporativo o externo.

Para cada componente registra:

| Campo | Contenido |
|---|---|
| Origen | Requisito, contrato o evidencia de código |
| Responsabilidad | Capacidad que materializa |
| Runtime | Framework, comando y ciclo de vida |
| Interfaces | Puertos, protocolos y contratos |
| Dependencias | Componentes y servicios requeridos |
| Estado | Stateless, temporal o durable |
| Exposición | Interna o externa con justificación |
| Escalado | Unidad y señal relevante |
| Salud | Condición real de startup/readiness/liveness |
| Recurso propuesto | Recurso OpenShift o servicio administrado |
| Procedencia | `INFERRED`, `DEFAULTED`, `PROFILED` o `DISCOVERED` |

Usa:

- `Deployment` para procesos reemplazables y stateless;
- `StatefulSet` cuando la identidad estable sea una propiedad real y represente la opción aprobada más apropiada;
- `Job` para migraciones o trabajo finito;
- `CronJob` para trabajo recurrente;
- `Service` para descubrimiento interno;
- `Route` solo para entradas externas HTTP(S);
- `ConfigMap` para configuración no sensible;
- referencias a `Secret` o al gestor aprobado para datos sensibles;
- `PersistentVolumeClaim` solo cuando se requiera filesystem durable.

Cada base de datos, volumen, Route, autoscaling, configuración de alta disponibilidad y operador DEBE corresponder a una necesidad trazable.

### 3. Calcular delta y paridad

Compara:

1. arquitectura y composición anterior;
2. arquitectura resultante de la feature;
3. estado deseado de OpenShift;
4. estado observado, solo si fue descubierto.

Clasifica cada componente como `UNCHANGED`, `MODIFIED`, `ADDED` o `REMOVED`.

Para `ADDED` y `MODIFIED`, planifica todos los cambios aplicables: imagen, workload, Service, identidad, configuración, secretos por referencia, conectividad, políticas de red, probes, recursos, datos, migraciones, Jobs, observabilidad, pipeline y documentación. Cada capacidad local nueva DEBE tener una realización equivalente en OpenShift.

Para `REMOVED`, planifica una retirada segura. Los datos persistentes DEBEN conservarse hasta que exista una decisión explícita de retención o eliminación.

Define una prueba de paridad topológica y otra funcional. Las diferencias permitidas por ambiente, como hostname, TLS, réplicas o mecanismo de secretos, deben quedar explícitas.

### 4. Diseñar datos e integraciones

Para cada servicio de datos:

1. confirma que es obligatorio por el producto;
2. prefiere servicio corporativo requerido, servicio administrado aprobado, operador soportado disponible y, como última opción de desarrollo, instancia autogestionada;
3. define propiedad, conectividad, TLS, autenticación por referencia y NetworkPolicy;
4. define capacidad, disponibilidad, actualización y observabilidad;
5. define backup, restauración, retención y evidencia de prueba;
6. diseña migraciones separadas del arranque concurrente de réplicas;
7. trata compatibilidad de esquema durante rollout y rollback.

Si una elección depende del clúster, define la interfaz y una opción condicionada por el perfil. El plan DEBE conservar una única implementación suficiente y obtener el operador desde el perfil o catálogo aprobado.

### 5. Diseñar seguridad e identidades

Por componente y automatización, define:

- ServiceAccount y permisos mínimos;
- ejecución no root y compatibilidad con UID arbitrario;
- capacidades eliminadas;
- filesystem de solo lectura cuando aplique;
- configuración no sensible y referencias de secretos;
- flujos de red permitidos;
- procedencia de imagen y uso de digest;
- controles de dependencias, secretos, SBOM e imagen;
- requisitos de firma o attestations definidos por el perfil.

Separa identidades para:

- scaffolding y catálogo;
- pipeline de build/publicación;
- GitOps/reconciliación;
- observación de RHDH/MCP;
- bootstrap administrativo;
- aprovisionamiento gobernado de Projects.

El plan DEBE contener únicamente referencias seguras; los valores de credenciales permanecen en el almacén administrado.

### 5.1 Diseñar el Project aislado de la aplicación

El plan DEBE declarar, sin preguntárselo al desarrollador:

- convención del Project derivada del perfil, normalmente uno por aplicación y ambiente;
- labels de aplicación, propietario, ambiente y costo;
- `ResourceQuota` y `LimitRange` aplicables;
- RBAC para aplicación, pipeline, GitOps y observación;
- NetworkPolicies base y flujos adicionales trazables;
- autorización de GitOps limitada al Project;
- ownership, retención y retirada segura del Project.

El Namespace Provisioner crea el Project con su identidad administrativa. Los recursos namespaced de la solución se despliegan allí. Una necesidad cluster-scoped se resuelve con el catálogo aprobado o queda como `PLATFORM_INPUT_REQUIRED`.

### 6. Diseñar artefactos de aplicación y plataforma

Adapta la estructura a las convenciones existentes. Como referencia:

```text
.specify/
  memory/constitution.md
  # presets y configuración administrados por Spec Kit
specs/<feature>/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/
  tasks.md                 # creado en la fase posterior
deploy/openshift/
  base/
  overlays/dev/
  overlays/staging/        # solo si el alcance lo necesita
  overlays/production/     # solo si el alcance lo necesita
.tekton/                   # Pipelines as Code cuando esté habilitado
scripts/platform/
  render
  validate
  smoke
docs/operations/
  openshift-deployment.md
catalog-info.yaml
```

El repositorio de aplicación contiene código y artefactos declarativos de la aplicación. El estado por ambiente y sus revisiones pueden vivir en un repositorio GitOps separado según el perfil. El plan DEBE indicar con precisión qué repositorio es dueño de cada archivo.

Cada directorio y recurso generado DEBE tener contenido y una responsabilidad real en la solución.

### 7. Diseñar CI y promoción

Define un flujo determinista:

1. `inspect`: coherencia entre especificación, contratos, código y artefactos;
2. `test`: lint, unitarias, integración, contrato y E2E aplicables;
3. `secure`: secretos, dependencias, SBOM y escaneo de imágenes;
4. `build`: una construcción por imagen y commit;
5. `render`: renderizado de overlays y validación de esquemas/políticas;
6. `publish`: publicación por digest y evidencia;
7. `promote`: pull request al repositorio GitOps;
8. `reconcile`: sincronización por OpenShift GitOps;
9. `verify`: migraciones, rollout, conectividad, persistencia y smoke tests;
10. `report`: commit, digest, revisión GitOps, ambiente y resultados.

El SDD Orchestrator controla esta secuencia, observa cada resultado y vuelve a implementación ante fallos recuperables. Pipelines y GitOps son sus actuadores gobernados; sus credenciales permanecen en el Tool Broker.

Cuando el perfil declare `delivery.mode: orchestrated`, el repositorio de aplicación DEBE declarar sus imágenes, tecnologías reales por workload, runtimes, Route y dependencias en `.sdd/workloads.yaml`. El orquestador es dueño de los PipelineRuns, builds, digests, promoción y Applications GitOps. El agente NO DEBE duplicar ese plano de entrega dentro del repositorio de aplicación.

Usa OpenShift Pipelines y Pipelines as Code cuando formen parte del perfil. Si existe otro CI corporativo, conserva las mismas puertas y GitOps como autoridad de despliegue.

El pipeline DEBE recibir explícitamente la revisión Git como parámetro autoritativo.

### 8. Separar bootstrap y operación continua

El plan distingue:

**Bootstrap de plataforma**

- instalar operadores aprobados;
- configurar RHDH, Pipelines y GitOps;
- crear proyectos, identidades, cuotas y políticas base;
- conectar repositorios, registro y mecanismo de secretos;
- registrar perfiles y destinos.

El Namespace Provisioner forma parte del bootstrap compartido, pero cada Project de aplicación se crea bajo demanda como operación gobernada e idempotente.

**Importante sobre el Bootstrap:** El desarrollador y el Agente de IA NO DEBEN preocuparse por la instalación o existencia de la plataforma. El Agente asume obligatoriamente que el clúster ya tiene o tendrá OpenShift GitOps, OpenShift Pipelines y RHDH aprovisionados mediante el script base de la organización. El Agente debe limitarse a generar los artefactos declarativos (`.yaml`) que estas herramientas consumirán, sin intentar automatizar su instalación.

El bootstrap pertenece al equipo o automatización de plataforma con autorización explícita. Las features ordinarias y el agente consumen las capacidades ya publicadas.

**Operación continua de la aplicación**

- validar un pull request;
- construir y publicar;
- proponer promoción;
- reconciliar;
- verificar y reportar.

La operación continua es autónoma para desarrollo. El orquestador debe mantener una máquina de estados durable, idempotencia y un presupuesto de reintentos para pruebas, build, política, reconciliación y smoke tests.

El SDD Orchestrator ejecuta el flujo ordinario de despliegue en representación del desarrollador.

### 9. Diseñar observabilidad y documentación

Deriva logs, métricas y alertas de los flujos críticos y utiliza las herramientas publicadas en el perfil.

Planifica `docs/operations/openshift-deployment.md` con:

- resumen y diagrama de arquitectura;
- ambientes y namespaces;
- inventario de workloads, Services, Routes, datos, Jobs y almacenamiento;
- imágenes por digest;
- identidades y referencias de configuración/secretos;
- flujos de red;
- pipeline, repositorio GitOps y promoción;
- procedimientos seguros de consulta, smoke test y rollback;
- dashboards y alertas cuando existan;
- commit, revisión GitOps y fecha de verificación.

Cada dato dinámico debe marcarse `DECLARED`, `OBSERVED` o `PENDING_VALIDATION`. Los nombres efímeros de Pods observados son evidencia fechada, no identificadores estables.

## Perfil de plataforma

El plan DEBE consumir o proponer un perfil validable, sin secretos, con campos como:

```yaml
apiVersion: platform.redhat.com/v1alpha1
kind: OpenShiftApplicationProfile
metadata:
  name: openshift-dev
spec:
  organization: example
  environment: dev
  gitProvider: github
  sourceRepositoryPolicy: separate-per-component
  gitopsRepositoryPolicy: shared-by-environment
  technologyPolicy:
    selection: per-workload
    defaultStrategy: auto
    containerBuildRequired: true
  delivery:
    pipeline: openshift-pipelines
    gitops: openshift-gitops
  exposure:
    externalTlsRequired: true
  security:
    runAsNonRoot: true
    immutableImages: true
  discovery:
    enabled: false
```

Este ejemplo es un contrato de diseño, no un perfil aprobado. Los esquemas y valores definitivos pertenecen al repositorio de gobernanza.

## Preguntas y bloqueos permitidos

Después de inferir, aplicar el perfil y defaults, usa `PLATFORM_INPUT_REQUIRED` únicamente si falta una restricción externa que impide una decisión segura, por ejemplo:

- destino autorizado entre varios perfiles no equivalentes;
- obligación regulatoria no registrada;
- servicio corporativo obligatorio cuyo identificador no puede descubrirse;
- propietario o aprobación necesaria para un ambiente regulado.

Incluye solo:

- dato requerido;
- motivo;
- propietario esperado;
- referencia segura para suministrarlo;
- trabajo que pudo completarse sin ese dato.

Las credenciales se obtienen mediante el canal seguro administrado. El acceso al clúster condiciona únicamente la validación dinámica; el plan continúa con evidencia estática.

## Matriz de verificación requerida

El plan debe asociar cada control con herramienta, momento, resultado esperado y evidencia:

- build reproducible;
- pruebas de aplicación y contratos;
- renderizado de cada overlay;
- validación contra esquemas y APIs objetivo;
- políticas de seguridad y mínimo privilegio;
- ausencia de secretos y tags mutables;
- migraciones y compatibilidad de esquema;
- rollout y probes;
- conectividad permitida y tráfico denegado;
- Route, TLS y DNS cuando apliquen;
- persistencia, backup y restauración;
- paridad topológica;
- smoke funcional y regresión;
- promoción de la misma imagen por digest;
- rollback de aplicación y tratamiento de datos;
- actualización de documentación.

Una verificación dinámica se marca como aprobada únicamente cuando existe evidencia `OBSERVED`.

## Desviación no productiva sin GitOps

Si el perfil del MVP declara que GitOps aún no está disponible, el plan PUEDE diseñar `DIRECT_APPLY_DEVIATION` como transición. Debe cumplir:

- runner o pipeline de plataforma;
- namespace no productivo autorizado;
- manifiestos versionados idénticos a los que adoptará GitOps;
- `render -> policy -> server-side dry-run -> apply -> rollout -> smoke -> report`;
- imagen por digest;
- evidencia de actor, commit, alcance y resultado;
- prohibición de instalar operadores o ampliar privilegios;
- condición y tarea de cierre para migrar a GitOps.

La desviación se ejecuta en la fase de entrega mediante el runner de plataforma y tiene alcance exclusivo en ambientes no productivos.

## Salida obligatoria de `plan.md`

El documento final DEBE incluir:

1. contexto, alcance y versión de gobernanza;
2. resumen de arquitectura y diagrama;
3. trazabilidad requisito-componente-prueba;
4. matriz de componentes y mapeo OpenShift;
5. Project objetivo, tenancy, cuotas, RBAC y autorización GitOps;
6. delta y paridad local/OpenShift;
7. decisiones con procedencia y evidencia;
8. estrategia de datos, migración, backup y restauración;
9. contratos e integraciones;
10. seguridad, identidades y red;
11. estructura exacta de artefactos y propietarios de repositorio;
12. CI, build, promoción, GitOps y rollback;
13. observabilidad y documentación;
14. matriz de validación;
15. riesgos, alternativas y valores `PENDING_VALIDATION`;
16. secuencia ordenada que pueda transformarse en `tasks.md`;
17. `PLATFORM_INPUT_REQUIRED`, solo si permanece un bloqueo externo real.

## Validación antes de terminar

Comprueba que:

- todas las decisiones respetan la constitución;
- cada componente corresponde a una necesidad real;
- cada requisito tiene diseño y prueba;
- cada operador requerido está confirmado o declarado como prerrequisito;
- los artefactos contienen referencias seguras y los valores secretos permanecen en su almacén;
- el orquestador quedó como responsable del resultado end-to-end sin crear un plano paralelo a GitOps;
- Pipelines, políticas y GitOps son los únicos actuadores de escritura ordinaria;
- RHDH, pipeline y GitOps tienen responsabilidades separadas;
- el plan puede ejecutarse con Claude, Codex o un modelo propio;
- el acceso dinámico pendiente está marcado como `PENDING_VALIDATION`;
- las tareas posteriores pueden implementarlo sin decisiones arquitectónicas esenciales pendientes.

## Cierre

Resume:

- archivos de diseño creados o actualizados;
- decisiones principales y su procedencia;
- riesgos y validaciones pendientes;
- entradas externas bloqueantes, si existen;
- siguiente comando recomendado (`speckit.tasks`).

Esta fase entrega un estado estructurado al SDD Orchestrator. La máquina de estados asigna `tasks`, implementación, construcción y despliegue a sus fases correspondientes y ejecuta la transición automática cuando el resultado está completo.
