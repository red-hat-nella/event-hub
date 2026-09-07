package openshift

is_workload if {
  input.kind in {"Deployment", "StatefulSet", "DaemonSet"}
}

deny contains msg if {
  is_workload
  not input.spec.template.spec.securityContext.runAsNonRoot
  msg := sprintf("%s/%s debe declarar pod securityContext.runAsNonRoot=true", [input.kind, input.metadata.name])
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  not container.securityContext.allowPrivilegeEscalation == false
  msg := sprintf("%s/%s contenedor %s debe declarar allowPrivilegeEscalation=false", [input.kind, input.metadata.name, container.name])
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  container.securityContext.privileged == true
  msg := sprintf("%s/%s contenedor %s no puede ser privilegiado", [input.kind, input.metadata.name, container.name])
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  not drops_all_capabilities(container)
  msg := sprintf("%s/%s contenedor %s debe eliminar la capability ALL", [input.kind, input.metadata.name, container.name])
}

drops_all_capabilities(container) if {
  container.securityContext.capabilities.drop[_] == "ALL"
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  not container.resources.requests.cpu
  msg := sprintf("%s/%s contenedor %s no declara requests.cpu", [input.kind, input.metadata.name, container.name])
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  not container.resources.requests.memory
  msg := sprintf("%s/%s contenedor %s no declara requests.memory", [input.kind, input.metadata.name, container.name])
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.cpu
  msg := sprintf("%s/%s contenedor %s no declara limits.cpu", [input.kind, input.metadata.name, container.name])
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.memory
  msg := sprintf("%s/%s contenedor %s no declara limits.memory", [input.kind, input.metadata.name, container.name])
}

deny contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  endswith(container.image, ":latest")
  msg := sprintf("%s/%s contenedor %s usa el tag mutable latest", [input.kind, input.metadata.name, container.name])
}

warn contains msg if {
  is_workload
  container := input.spec.template.spec.containers[_]
  not contains(container.image, "@sha256:")
  not endswith(container.image, ":latest")
  msg := sprintf("%s/%s contenedor %s todavía no está fijado por digest", [input.kind, input.metadata.name, container.name])
}

deny contains msg if {
  input.kind == "Route"
  not input.spec.tls
  msg := sprintf("Route/%s debe declarar TLS", [input.metadata.name])
}

deny contains msg if {
  input.kind == "Service"
  input.spec.type in {"LoadBalancer", "NodePort"}
  msg := sprintf("Service/%s usa %s; las entradas HTTP(S) deben utilizar Route", [input.metadata.name, input.spec.type])
}

deny contains msg if {
  input.kind == "Secret"
  msg := sprintf("Secret/%s no puede materializar valores desde el repositorio; use referencias o el gestor aprobado", [input.metadata.name])
}

