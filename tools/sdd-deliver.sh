#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "${ROOT}" ]] || { printf '[ERROR] Ejecute este comando dentro del repositorio.\n' >&2; exit 2; }
cd "${ROOT}"

CONFIG='.sdd/delivery.yaml'
GOVERNANCE='.specify/governance.yaml'
CONSTITUTION='.specify/memory/constitution.md'
WORKLOADS='.sdd/workloads.yaml'

yaml_value() {
  local key="$1"
  awk -F ': ' -v key="${key}" '$1 == key { value=$2; gsub(/^"|"$/, "", value); print value; exit }' "${CONFIG}"
}

die() { printf '[ERROR] %s\n' "$*" >&2; exit 2; }

preflight() {
  [[ -f "${CONFIG}" ]] || die "Falta ${CONFIG}."
  [[ -f "${GOVERNANCE}" && -f "${CONSTITUTION}" ]] || die 'Falta el contrato de gobernanza SDD.'
  [[ -s "${WORKLOADS}" ]] || die "Falta ${WORKLOADS}."
  jq -e --arg component "$(yaml_value componentId)" '
    .apiVersion == "sdd.platform.redhat.com/v1alpha1" and
    .kind == "WorkloadSet" and .metadata.name == $component and
    (.spec.workloads | type == "array" and length > 0 and length <= 12) and
    (all(.spec.workloads[];
      (.technology.runtime | IN("nodejs","java","python","dotnet","go","static","other")) and
      (.technology.framework | type == "string" and length > 0))) and
    (.spec.exposure.routeName | type == "string" and length > 0) and
    (.spec.exposure.healthPath | type == "string" and startswith("/"))
  ' "${WORKLOADS}" >/dev/null || die 'El contrato multi-workload es inválido o todavía está vacío.'
  git remote get-url origin >/dev/null 2>&1 || die 'Falta el remote origin.'
  [[ -z "$(git diff --name-only --diff-filter=U)" ]] || die 'Hay conflictos Git sin resolver.'
  git diff --check || die 'Git encontró errores de whitespace o marcadores inválidos.'

  local expected actual
  expected="$(awk -F ': ' '/^[[:space:]]*constitutionSha256:/ { print $2; exit }' "${GOVERNANCE}" | tr -d '"[:space:]')"
  [[ "${expected}" =~ ^[a-f0-9]{64}$ ]] || die 'constitutionSha256 no es válido.'
  actual="$(sha256sum "${CONSTITUTION}" | awk '{print $1}')"
  [[ "${actual}" == "${expected}" ]] || die 'La constitución inmutable fue modificada.'

  local task_file incomplete=0
  while IFS= read -r task_file; do
    if grep -n -E -- '^- \[ \]' "${task_file}"; then incomplete=1; fi
  done < <(find specs -type f -name tasks.md -print 2>/dev/null | sort)
  (( incomplete == 0 )) || die 'Existen tareas Spec Kit pendientes.'

  local placeholder
  while IFS= read -r placeholder; do
    [[ "${placeholder}" =~ ^IMAGE_[A-Z0-9_]+$ ]] || die "Placeholder de imagen inválido: ${placeholder}"
    grep -R -Fq --exclude='workloads.yaml' "${placeholder}" deploy/openshift || \
      die "El placeholder ${placeholder} no aparece en deploy/openshift."
  done < <(jq -r '.spec.workloads[].build.imagePlaceholder // empty' "${WORKLOADS}")

  local path
  while IFS= read -r path; do
    case "${path}" in
      .env.example|.env.sample|*.example|*.sample) continue ;;
      .env|.env.*|*.pem|*.key|*.p12|*.pfx|*kubeconfig*|*/secrets/*|*.secret.yaml|*.secret.yml)
        die "Archivo sensible no publicable: ${path}" ;;
    esac
    if [[ -f "${path}" ]] && grep -Iq . "${path}" &&
       grep -Eq -- 'gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN ([A-Z ]+ )?PRIVATE KEY-----' "${path}"; then
      die "Credencial detectada en ${path}."
    fi
  done < <(git ls-files --cached --others --exclude-standard)

  printf '[OK] Preflight SDD: tareas, tecnologías por workload, constitución, Git y secretos validados.\n'
}

publish() {
  preflight
  git fetch --quiet origin main || die 'No fue posible consultar origin/main.'
  git merge-base --is-ancestor origin/main HEAD ||
    die 'origin/main divergió; no se sobrescribirá trabajo remoto.'
  git add -A
  if ! git diff --cached --quiet; then
    local component
    component="$(yaml_value componentId)"
    git commit -m "feat: implement ${component}"
  fi
  if [[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]]; then
    printf '[SKIP] No hay commits nuevos para publicar.\n'
  else
    git push origin HEAD:main
    printf '[OK] Commit %s publicado en origin/main.\n' "$(git rev-parse --short=12 HEAD)"
  fi
}

status() {
  local status_url
  status_url="$(yaml_value statusUrl)"
  [[ "${status_url}" == https://* || "${status_url}" == http://127.0.0.1:* || "${status_url}" == http://localhost:* ]] ||
    die 'statusUrl debe usar HTTPS.'
  curl --fail --silent --show-error --connect-timeout 10 --max-time 30 "${status_url}"
}

is_platform_evidence() {
  grep -Eqi -- 'Kubernetes (GET|POST|PUT|PATCH|DELETE).*(401|403|429|500|502|503|504)|cannot (get|list|watch|create|update|patch|delete) resource|RBAC|Argo ?CD|Tekton|operator|service unavailable|connection refused|temporary failure' <<<"${1:-}"
}

watch_delivery() {
  local timeout idle_timeout poll trace started last_progress now payload phase evidence route signature previous_signature
  local expected_commit deployed_commit
  expected_commit="$(git rev-parse HEAD)"
  timeout="$(yaml_value timeoutSeconds)"; timeout="${timeout:-1800}"
  idle_timeout="$(yaml_value idleTimeoutSeconds)"; idle_timeout="${idle_timeout:-1800}"
  poll="$(yaml_value pollSeconds)"; poll="${poll:-10}"
  trace="$(yaml_value traceUrl)"
  started="$(date +%s)"
  last_progress="${started}"
  previous_signature=''
  while true; do
    payload="$(status)" || { printf '[WARN] El estado aún no está disponible; reintentando.\n' >&2; sleep "${poll}"; continue; }
    phase="$(printf '%s\n' "${payload}" | jq -r '.phase // empty')"
    evidence="$(printf '%s\n' "${payload}" | jq -r '.repairEvidence // empty')"
    route="$(printf '%s\n' "${payload}" | jq -r '.routeUrl // empty')"
    signature="$(printf '%s' "${payload}" | jq -r '[.phase,.message,.updatedAt,.validationRunName,.buildRunName,.gitopsStatus] | @tsv' 2>/dev/null || printf '%s' "${phase}")"
    if [[ "${signature}" != "${previous_signature}" ]]; then
      last_progress="$(date +%s)"
      previous_signature="${signature}"
    fi
    printf '[SDD] Estado: %s\n' "${phase:-desconocido}"
    case "${phase}" in
      SUCCEEDED)
        deployed_commit="$(printf '%s\n' "${payload}" | jq -r '.sourceCommitSha // empty')"
        if [[ "${deployed_commit}" != "${expected_commit}" ]]; then
          printf '[ERROR] Entrega obsoleta: esperado %s, desplegado %s. El orquestador debe iniciar la entrega vigente. Trazabilidad: %s\n' "${expected_commit}" "${deployed_commit:-desconocido}" "${trace}" >&2
          return 21
        fi
        if [[ ! "${route}" =~ ^https://[^/[:space:]]+ ]]; then
          printf '[ERROR] Éxito sin Route HTTPS verificable. Trazabilidad: %s\n' "${trace}" >&2
          return 22
        fi
        printf '[OK] Aplicación desplegada: %s\n' "${route}"
        printf '[INFO] Trazabilidad: %s\n' "${trace}"
        return 0 ;;
      FAILED|POLICY_REJECTED|CANCELLED)
        printf '%s\n' "${payload}"
        printf '[ERROR] Entrega terminada en %s. Trazabilidad: %s\n' "${phase}" "${trace}" >&2
        return 20 ;;
      WAITING_FOR_SOURCE)
        if [[ -n "${evidence}" ]]; then
          if is_platform_evidence "${evidence}"; then
            printf '[WAIT] Incidencia de plataforma detectada; el orquestador la reintenta sin modificar el repositorio.\n' >&2
          else
            printf '%s\n' "${payload}"
            printf '[ACTION] La implementación necesita una corrección automática.\n' >&2
            return 10
          fi
        fi ;;
    esac
    now="$(date +%s)"
    if (( now - started >= timeout )); then
      printf '[ERROR] Tiempo total de espera agotado. Trazabilidad: %s\n' "${trace}" >&2
      return 124
    fi
    if (( now - last_progress >= idle_timeout )); then
      printf '[ERROR] La entrega no reportó progreso durante %s segundos. Trazabilidad: %s\n' "${idle_timeout}" "${trace}" >&2
      return 125
    fi
    sleep "${poll}"
  done
}

case "${1:-}" in
  preflight) preflight ;;
  publish) publish ;;
  status) status ;;
  watch) watch_delivery ;;
  *) printf 'Uso: %s {preflight|publish|status|watch}\n' "$0" >&2; exit 2 ;;
esac
