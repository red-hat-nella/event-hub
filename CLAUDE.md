# Instrucciones del proyecto

Siga íntegramente las instrucciones de `AGENTS.md`. La constitución ubicada en
`.specify/memory/constitution.md` es obligatoria e inmutable.

Las skills oficiales de GitHub Spec Kit están instaladas en `.claude/skills`.
Use `/speckit-specify`, `/speckit-plan`, `/speckit-tasks` y
`/speckit-implement`; no ejecute `specify init` sobre este repositorio. El hook
posterior a implement invoca `/sdd-deliver` y completa la entrega sin `oc login`.
Antes de finalizar, complete `.sdd/workloads.yaml`; el Stop hook compartido bloquea
reportes incompletos, publica en `main` y espera la Route automáticamente.
El framework no viene fijado por RHDH: declare en ese contrato la tecnología
real de cada workload definida durante `plan`.

Complete todo el flujo en esta misma sesión. No pida otro modelo, otra sesión,
`oc login`, cambios ficticios ni reparación manual de RBAC/Tekton/Argo CD. Los
errores de infraestructura pertenecen al orquestador y no justifican modificar
la aplicación; solo corrija archivos del repositorio cuando la evidencia señale
explícitamente un defecto de esos archivos.
