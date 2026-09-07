# Contexto del producto

## Problema y resultado esperado

Las organizaciones necesitan una plataforma para gestionar eventos y sus inscripciones. Los usuarios deben poder registrarse, consultar eventos disponibles, ver sus detalles y gestionar sus inscripciones. Los administradores deben poder crear, modificar y eliminar eventos y controlar los cupos disponibles. La aplicación debe implementarse como una arquitectura de microservicios con servicios independientes para usuarios, eventos e inscripciones, exponiendo sus capacidades mediante un API Gateway. El frontend debe desarrollarse con React y consumir las APIs del backend. La solución debe ser contenerizada y desplegable en OpenShift utilizando OpenShift Pipelines para CI y OpenShift GitOps para CD.
Microservicios:

1. User Service

Crear usuarios
Consultar usuarios
Actualizar información
Autenticación básica

2. Event Service

Crear eventos
Listar eventos
Consultar detalles
Actualizar/eliminar eventos
Controlar cupos disponibles

3. Registration Service

Registrar usuarios en eventos
Cancelar inscripciones
Consultar inscripciones
Validar disponibilidad de cupos

4. API Gateway

Punto de entrada único
Routing hacia microservicios
Validación de autenticación
Manejo básico de errores

5. React Frontend

Login
Dashboard
Lista de eventos
Detalle de evento
Registro a evento
Mis inscripciones
Administración de eventos


## Contexto organizacional

| Campo | Valor |
|---|---|
| Componente | `event-hub` |
| Propietario | `group:default/developers` |
| Estrategia tecnológica | `auto-per-workload` (por workload) |
| Preferencias tecnológicas | "Frontend:\nReact + TypeScript + Vite\n\nBackend:\nNode.js + TypeScript\n\nMicroservices:\nREST APIs\n\nAPI Gateway:\nNode.js / NestJS\n\nDatabases:\nPostgreSQL\n\nContainerization:\nDocker\n\nPlatform:\nOpenShift\n\nCI:\nOpenShift Pipelines\n\nCD:\nOpenShift GitOps / Argo CD\n\nSource Control:\nGitHub" |
| Clasificación de datos | `internal` |
| Agente inicial | `developer` |
| Project OpenShift | `event-hub-dev` |

Este documento es la entrada inicial. Las historias, escenarios y criterios verificables se crean mediante la skill `speckit-specify`; las decisiones de infraestructura se derivan posteriormente en `speckit-plan`.

## Contrato de entrega fijo

- Modo: `orchestrated`.
- Topología: uno o varios workloads declarados en `.sdd/workloads.yaml`.
- La aplicación genera Containerfiles y manifiestos Kustomize con placeholders.
- La plataforma compartida genera PipelineRuns, digests y Applications GitOps.
- No se crean Pipelines Tekton, Triggers ni Applications Argo CD en este repositorio.
