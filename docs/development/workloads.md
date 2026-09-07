# Contrato de workloads SDD

`plan` define y `implement` completa `.sdd/workloads.yaml`. El archivo conserva
extensión YAML, pero usa sintaxis JSON válida para que el mismo contrato sea
interpretado sin ambigüedad por el agente, el preflight y el orquestador.

```json
{
  "apiVersion": "sdd.platform.redhat.com/v1alpha1",
  "kind": "WorkloadSet",
  "metadata": { "name": "my-app" },
  "spec": {
    "exposure": { "routeName": "web", "healthPath": "/healthz" },
    "workloads": [
      {
        "name": "api",
        "technology": { "runtime": "nodejs", "framework": "nestjs", "version": "22" },
        "build": {
          "contextDir": "backend",
          "containerfile": "Containerfile",
          "imagePlaceholder": "IMAGE_API"
        },
        "runtime": { "kind": "Deployment", "name": "api", "required": true }
      },
      {
        "name": "web",
        "technology": { "runtime": "nodejs", "framework": "react", "version": "22" },
        "build": {
          "contextDir": "frontend",
          "containerfile": "Containerfile",
          "imagePlaceholder": "IMAGE_WEB"
        },
        "runtime": { "kind": "Deployment", "name": "web", "required": true }
      }
    ],
    "resources": [
      { "name": "database", "kind": "StatefulSet", "required": true }
    ],
    "managedSecrets": [
      { "name": "database-credentials", "keys": ["username", "password"] }
    ]
  }
}
```

Cada placeholder debe aparecer en `deploy/openshift/` como valor de `image`.
La plataforma lo reemplaza por un digest inmutable. Los Containerfiles se
resuelven dentro de `contextDir`. `Route`, Deployments y StatefulSets deben usar
exactamente los nombres declarados. Los valores de `managedSecrets` los crea la
plataforma y nunca se escriben en Git.

`technology` se decide durante `plan` y debe describir lo implementado de
verdad. No existe un framework global: una aplicación puede combinar, por
ejemplo, React, NestJS, Python y Java. Cambiar documentación o
`catalog-info.yaml` no cambia este contrato; antes de publicar, `implement`
debe reconciliar cada workload, su Containerfile y su runtime real.

Con el perfil `delivery.mode: orchestrated`, no se generan Pipelines Tekton,
Triggers ni Applications Argo CD en este repositorio.
