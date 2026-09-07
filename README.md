# Componente: `event-hub`

> **Descripción:** Las organizaciones necesitan una plataforma para gestionar eventos y sus inscripciones. Los usuarios deben poder registrarse, consultar eventos disponibles, ver sus detalles y gestionar sus inscripciones. Los administradores deben poder crear, modificar y eliminar eventos y controlar los cupos disponibles. La aplicación debe implementarse como una arquitectura de microservicios con servicios independientes para usuarios, eventos e inscripciones, exponiendo sus capacidades mediante un API Gateway. El frontend debe desarrollarse con React y consumir las APIs del backend. La solución debe ser contenerizada y desplegable en OpenShift utilizando OpenShift Pipelines para CI y OpenShift GitOps para CD.
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


---

## Contexto y Gobernanza

| Campo | Valor |
|---|---|
| **Nombre del Componente** | `event-hub` |
| **Propietario** | `group:default/developers` |
| **Estrategia tecnológica** | `auto-per-workload` (por workload) |
| **Preferencias** | "Frontend:\nReact + TypeScript + Vite\n\nBackend:\nNode.js + TypeScript\n\nMicroservices:\nREST APIs\n\nAPI Gateway:\nNode.js / NestJS\n\nDatabases:\nPostgreSQL\n\nContainerization:\nDocker\n\nPlatform:\nOpenShift\n\nCI:\nOpenShift Pipelines\n\nCD:\nOpenShift GitOps / Argo CD\n\nSource Control:\nGitHub" |
| **Clasificación de Datos** | `internal` |
| **Plataforma de Destino** | **Red Hat OpenShift** (Zero-Touch) |
| **Versión de Gobernanza SDD** | `1.2.0` (Inmutable) |

---

## Flujo de Desarrollo (Spec-Driven Development)

Este proyecto utiliza **Spec-Driven Development (SDD)** con **GitHub Spec Kit**. El desarrollador interactúa únicamente en lenguaje natural con su herramienta de IA preferida (Claude, Codex, OpenCode, etc.) siguiendo estas 4 fases:

1. **`specify`**: Expresa la necesidad de negocio y resultados esperados (ej. *"Quiero una app del clima con estilo moderno..."*).
2. **`plan`**: Define la arquitectura técnica deseada (ej. *"Quiero arquitectura de microservicios y consumir la API X..."*).
3. **`tasks`**: Desglosa las tareas de desarrollo e infraestructura.
4. **`implement`**: Genera el código fuente y los manifiestos declarativos de OpenShift.

Durante `plan` e `implement`, complete el contrato versionado descrito en
[`docs/development/workloads.md`](docs/development/workloads.md). Este permite
una o varias imágenes sin duplicar Pipelines o Applications GitOps.

La tecnología no queda fijada por el template. Spec Kit debe declarar en
`.sdd/workloads.yaml` el runtime y framework reales de cada workload; ese
contrato validado es la única fuente tecnológica usada para construir.

> **Nota para el desarrollador:** No es necesario configurar Dockerfiles ni YAMLs de Kubernetes manualmente. La Constitución organizacional guía a la IA para generar todo el ecosistema nativo de OpenShift automáticamente.

### Pasos mínimos

```bash
git clone <URL_ENTREGADA_POR_RHDH>
cd event-hub
```

Abra Claude o Codex en esta carpeta. Las skills oficiales de GitHub Spec Kit ya
están incluidas; no ejecute `specify init`. En Claude solicite, en orden:

```text
/speckit-specify quiero una aplicación ...
/speckit-plan quiero que use ...
/speckit-tasks
/speckit-implement
```

En Codex use los mismos nombres con prefijo `$`, por ejemplo
`$speckit-specify` y `$speckit-implement`.

Para adoptar una versión aprobada nueva de GitHub Spec Kit sin reemplazar la
constitución:

```bash
./tools/update-speckit-assets.sh <version>
```

No debe ejecutar commit, push ni `oc login`: `/speckit-implement` invoca el hook
obligatorio `sdd-deliver`, publica el resultado y espera la Route. También puede
reanudar el seguimiento con `/sdd-deliver` en Claude o `$sdd-deliver` en Codex.

`AGENTS.md` y `CLAUDE.md` hacen que la herramienta lea la constitución y genere
los artefactos requeridos por OpenShift.

---

## Barreras de Seguridad e Inmutabilidad

Para garantizar la seguridad y cumplimiento organizacional en OpenShift, este repositorio cuenta con controles estrictos:

* **Constitución de Solo Lectura:** El archivo de gobernanza `.specify/memory/constitution.md` es **inmutable**. Ningún desarrollador ni Agente de IA tiene permitido modificarlo.
  La skill `speckit-constitution` se excluye deliberadamente y Claude bloquea
  cualquier herramienta que intente escribir, editar o ejecutar comandos sobre
  ese archivo. Las demás skills solamente pueden leerlo como política vigente.
* **Validación de Checksum SHA256 en Tekton:** Cada `git push` o Pull Request activa un pipeline en **OpenShift Pipelines** que valida la integridad del archivo mediante el SHA256 canónico (`c5a466956169471fdb68d90397abb8edc538af85c33245cd0262b8d0f2128ddf`) publicado por gobernanza.
* **Cancelación Automática:** Si la constitución es alterada, el pipeline falla de inmediato y se bloquea el proceso de construcción y despliegue.

---

## Despliegue Autónomo Zero-Touch en OpenShift

1. **Publicación SDD:** La skill valida, crea el commit y publica en `main`.
2. **SDD Orchestrator:** Detecta el nuevo commit y activa la entrega.
3. **OpenShift Pipelines (Tekton):**
   - Valida la constitución y políticas de seguridad (Conftest).
   - Ejecuta las pruebas unitarias.
   - Construye la imagen inmutable y genera su digest (`@sha256:`).
4. **OpenShift GitOps (ArgoCD):**
   - Lee el estado deseado en `deploy/openshift/`.
   - Sincroniza y despliega la aplicación de forma declarativa en el clúster.
5. **Resultado:** La aplicación queda disponible en su **Route** de OpenShift y se visualiza en la trazabilidad de **Red Hat Developer Hub (RHDH)**.

---

## Estructura del Repositorio

```text
├── .specify/
│   ├── memory/constitution.md  # Constitución organizacional inmutable SDD
│   ├── extensions.yml          # Hook obligatorio posterior a implement
│   ├── scripts/                # Scripts oficiales fijados de Spec Kit
│   └── templates/              # Templates oficiales fijados de Spec Kit
├── .claude/skills/             # Skills oficiales para Claude Code
├── .agents/skills/             # Skills oficiales para Codex
├── .sdd/                        # Configuración y extensión organizacional
│   └── workloads.yaml           # Imágenes, runtimes, Route y dependencias
├── .tekton/
│   └── pull-request.yaml       # PipelineRun de validación de gobernanza (Tekton)
├── policies/
│   └── conftest/               # Políticas OPA/Conftest para validación de manifiestos
├── docs/
│   ├── development/            # Guías de desarrollo con Spec Kit
│   └── operations/             # Manual operativo y de arquitectura en OpenShift
├── tools/update-speckit-assets.sh # Actualizador oficial-versionado y seguro
├── tools/sdd-deliver.sh         # Publicación y seguimiento sin acceso al clúster
├── README.md                   # Documentación principal
└── catalog-info.yaml           # Registro del componente en Red Hat Developer Hub
```
