# Instrucciones SDD para agentes de IA

Antes de trabajar, lea obligatoriamente:

- `.specify/memory/constitution.md` (inmutable; nunca modificar);
- `.specify/governance.yaml`;
- `.sdd/workloads.yaml`, completado con todos los workloads, tecnología real por workload, imágenes, runtimes y la Route principal;
- `docs/development/workloads.md`, contrato exacto que debe respetar plan/implement;
- `docs/product-context.md`;
- `policies/conftest/openshift.rego`.

Interprete las solicitudes del desarrollador así:

- `specify <intención>`: cree o actualice `specs/<feature>/spec.md` con historias y criterios verificables.
- `plan <preferencias>`: cree `specs/<feature>/plan.md` respetando la constitución y OpenShift.
- `tasks`: cree `specs/<feature>/tasks.md` con tareas ordenadas y verificables.
- `implement`: implemente código, pruebas, `Containerfile` y manifiestos en `deploy/openshift/base` y `deploy/openshift/overlays/dev`.

No herede ni invente un framework global desde el catálogo. Durante `plan`
elija la tecnología apropiada para cada workload y durante `implement`
registre la decisión real en `.sdd/workloads.yaml`; la plataforma construye ese
contrato y no presupone Quarkus ni ningún otro framework.

Los flujos oficiales están versionados en `.claude/skills` y `.agents/skills`.
No regenere ni sustituya la constitución durante la inicialización de una
herramienta.

La aplicación debe exponer `/healthz` y ejecutarse sin privilegios. Al terminar
`speckit-implement`, ejecute el hook obligatorio `sdd.deliver`: este valida,
publica en `main` y supervisa la entrega hasta obtener la Route. No solicite
credenciales del clúster, no despliegue directamente ni escriba Secrets en Git.

La entrega DEBE completarse en esta misma sesión del agente. No solicite otro
modelo, otra sesión, un commit ficticio ni intervención manual para resolver
RBAC, disponibilidad de operadores, Argo CD, Tekton o conectividad interna: son
responsabilidad de la plataforma y el orquestador las reintenta. Solo modifique
el repositorio cuando la evidencia identifique de forma explícita un defecto en
su código, pruebas, Containerfile, contrato de workloads o manifiestos.

<!-- SPECKIT START -->
## Contexto de planificación: 002-account-experience

- Feature activa: `specs/002-account-experience`; leer plan, research, contratos y ux-design antes de implementar.
- Conservar React 18/Vite, NestJS 10/Node 20, Prisma 5 y PostgreSQL 16 por workload; sin nuevas tablas ni servicios.
- Gateway debe proyectar snapshots de inscripción y devolver listado `{items}`; datos esenciales inválidos son error, nunca lista vacía.
- Dashboard usa todas las inscripciones propias; consultas privadas se aíslan por usuario y generación de sesión.
- Seed ADMIN compilado dentro de user-service, initContainer después de migración, referencias privadas existentes; no elevar USER ni sobrescribir contraseñas.
- Verificar contratos con fixtures internos reales, integración de cuenta, capturas responsive y handoff privado antes de declarar terminado.
<!-- SPECKIT END -->
