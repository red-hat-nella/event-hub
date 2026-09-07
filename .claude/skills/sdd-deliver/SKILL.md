---
name: sdd-deliver
description: Publica una implementación Spec Kit terminada y supervisa su entrega administrada mediante OpenShift Pipelines y GitOps. Úsala al terminar speckit-implement o para reanudar una entrega SDD; no realiza despliegues directos con oc o kubectl.
metadata:
  author: red-hat-sdd-platform
---

# Entrega SDD administrada

Esta skill es el hook obligatorio posterior a `speckit-implement`. La plataforma
ya posee las credenciales y recursos del clúster: no solicites `oc login`,
kubeconfig, tokens ni secretos, y no ejecutes `oc apply` o `kubectl apply`.

1. Lee `.sdd/delivery.yaml`, `.sdd/workloads.yaml`, `.specify/governance.yaml`, la constitución y el
   `tasks.md` activo. Ejecuta `./tools/sdd-deliver.sh preflight`; detente y
   corrige cualquier incumplimiento. Confirma que `technology.runtime` y
   `technology.framework` de cada workload describan el código real; no uses
   un framework global heredado del catálogo.
2. Ejecuta las pruebas y validaciones locales definidas por el plan, las tareas
   o los scripts del proyecto. No ejecutes el smoke test que requiera acceso al
   clúster; el orquestador lo ejecuta después de GitOps.
3. Ejecuta `./tools/sdd-deliver.sh publish`. Este comando está autorizado para
   crear el commit de implementación y hacer un push no forzado a `main`.
4. Ejecuta `./tools/sdd-deliver.sh watch`. Si termina correctamente, informa la
   Route que imprime el comando.
5. Si devuelve código 10, lee la evidencia mostrada, corrige únicamente el
   código o los manifiestos del repositorio cuando la evidencia los identifique
   explícitamente, vuelve a probar y repite `publish` y `watch`. Si la evidencia
   menciona RBAC, permisos, operadores, Kubernetes API, Tekton, Argo CD o
   conectividad de plataforma, no inventes cambios ni pidas otra sesión: vuelve
   a `watch`, pues el orquestador conserva la fase y reintenta la infraestructura.
   No excedas `maxRepairAttempts` para defectos que sí pertenecen al repositorio.
6. Si devuelve otro código distinto de cero, informa el diagnóstico y
   `traceUrl`. No sustituyas Pipelines/GitOps con un despliegue manual.

Nunca modifiques `.specify/memory/constitution.md`, uses force-push ni publiques
archivos sensibles. Si `origin/main` divergió, detente para evitar sobrescribir
trabajo ajeno.

El criterio de terminación es estricto: esta misma sesión debe informar la
Route saludable emitida por `watch`. Una explicación, un manifiesto listo o una
instrucción manual de despliegue no constituyen una entrega terminada.
