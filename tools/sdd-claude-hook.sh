#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
if [[ -n "${PROJECT_DIR}" && -d "${PROJECT_DIR}/.git" ]]; then
  ROOT="$(git -C "${PROJECT_DIR}" rev-parse --show-toplevel 2>/dev/null || true)"
else
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi
[[ -n "${ROOT}" ]] || exit 0
cd "${ROOT}"

MARKER="$(git rev-parse --git-path sdd-claude-delivery-session)"
RESULT="$(git rev-parse --git-path sdd-claude-delivery-result)"
INPUT="$(cat)"
SESSION_ID="$(printf '%s' "${INPUT}" | jq -r '.session_id // "unknown"' 2>/dev/null || printf unknown)"

case "${1:-}" in
  self-check)
    missing=()
    for command_name in git jq curl sha256sum; do
      command -v "${command_name}" >/dev/null 2>&1 || missing+=("${command_name}")
    done
    for required_path in tools/sdd-deliver.sh .sdd/delivery.yaml .sdd/workloads.yaml .specify/governance.yaml .specify/memory/constitution.md; do
      [[ -e "${required_path}" ]] || missing+=("${required_path}")
    done
    if ((${#missing[@]})); then
      printf 'SDD SELF-CHECK FALLÓ: faltan %s. No inicie implement hasta restaurar el scaffold gobernado.\n' "${missing[*]}" >&2
      exit 2
    fi
    [[ -x tools/sdd-deliver.sh ]] || { printf 'SDD SELF-CHECK FALLÓ: tools/sdd-deliver.sh no es ejecutable.\n' >&2; exit 2; }
    printf 'SDD listo: el hook está anclado en %s y entregará por Pipelines/GitOps al finalizar implement.\n' "${ROOT}"
    ;;
  protect-constitution)
    tool_name="$(printf '%s' "${INPUT}" | jq -r '.tool_name // ""' 2>/dev/null || true)"
    tool_payload="$(printf '%s' "${INPUT}" | jq -c '.tool_input // {}' 2>/dev/null || printf '{}')"
    protected_path='.specify/memory/constitution.md'

    case "${tool_name}" in
      Skill)
        skill_name="$(printf '%s' "${tool_payload}" | jq -r '.skill // .name // ""' 2>/dev/null || true)"
        if [[ "${skill_name}" == *speckit-constitution* ]]; then
          printf 'BLOQUEADO: speckit-constitution no está disponible. La constitución OpenShift es administrada exclusivamente por Platform Engineering.\n' >&2
          exit 2
        fi
        ;;
      Write|Edit|MultiEdit|NotebookEdit)
        if printf '%s' "${tool_payload}" | grep -Fq "${protected_path}"; then
          printf 'BLOQUEADO: %s es de solo lectura y su checksum es administrado por la plataforma.\n' "${protected_path}" >&2
          exit 2
        fi
        ;;
      Bash)
        if printf '%s' "${tool_payload}" | grep -Fq "${protected_path}"; then
          printf 'BLOQUEADO: los comandos Bash no pueden operar directamente sobre %s. Use la herramienta Read para consultarla.\n' "${protected_path}" >&2
          exit 2
        fi
        ;;
    esac
    exit 0
    ;;
  begin)
    printf '%s\n' "${SESSION_ID}" > "${MARKER}"
    rm -f "${RESULT}"
    printf '%s\n' \
      'SDD delivery guard enabled. Complete every task; the Stop hook will run preflight, publish to main and wait for the OpenShift Route.'
    ;;
  stop)
    [[ -s "${MARKER}" ]] || exit 0
    [[ "$(cat "${MARKER}")" == "${SESSION_ID}" ]] || exit 0

    last_message="$(printf '%s' "${INPUT}" | jq -r '.last_assistant_message // ""' 2>/dev/null || true)"
    if [[ -s "${RESULT}" ]]; then
      result_message="$(cat "${RESULT}")"
      if [[ -n "${result_message}" && "${last_message}" == *"${result_message}"* ]]; then
        rm -f "${MARKER}" "${RESULT}"
        exit 0
      fi
      printf '%s\n' "${result_message}" >&2
      exit 2
    fi

    if ! preflight_output="$("${ROOT}/tools/sdd-deliver.sh" preflight 2>&1)"; then
      printf 'SDD no permite finalizar todavía. Corrige el diagnóstico real y continúa implementando:\n%s\n' \
        "${preflight_output}" >&2
      exit 2
    fi

    if ! publish_output="$("${ROOT}/tools/sdd-deliver.sh" publish 2>&1)"; then
      printf 'La publicación SDD falló; corrige la causa y vuelve a intentarlo:\n%s\n' \
        "${publish_output}" >&2
      exit 2
    fi

    set +e
    watch_output="$("${ROOT}/tools/sdd-deliver.sh" watch 2>&1)"
    watch_status=$?
    set -e
    if (( watch_status == 0 )); then
      route="$(printf '%s\n' "${watch_output}" | sed -n 's/^\[OK\] Aplicación desplegada: //p' | tail -n1)"
      result_message="Entrega SDD completada. Route: ${route}"
    elif (( watch_status == 10 )); then
      printf 'La plataforma solicitó una corrección recuperable. Corrige código/manifiestos y deja que el guard vuelva a publicar:\n%s\n' \
        "${watch_output}" >&2
      exit 2
    else
      trace="$(awk -F ': ' '$1 == "traceUrl" { print $2; exit }' .sdd/delivery.yaml)"
      result_message="Entrega SDD bloqueada (código ${watch_status}). Trazabilidad: ${trace}"
    fi
    printf '%s\n' "${result_message}" > "${RESULT}"
    printf '%s\n' "${result_message}" >&2
    exit 2
    ;;
  *) exit 0 ;;
esac
