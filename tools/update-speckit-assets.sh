#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKELETON_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
VERSION_FILE="${SKELETON_DIR}/.specify/SPECKIT_VERSION"
VERSION="${1:-$(tr -d '[:space:]' < "${VERSION_FILE}" 2>/dev/null || true)}"

[[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][A-Za-z0-9.-]+)?$ ]] || {
  printf '[ERROR] Indique una versión de specify-cli, por ejemplo 0.12.2.\n' >&2
  exit 1
}
for command_name in rsync jq mktemp; do
  command -v "${command_name}" >/dev/null 2>&1 || {
    printf '[ERROR] Falta el comando %s.\n' "${command_name}" >&2
    exit 1
  }
done

update_tmp="$(mktemp -d /tmp/sdd-speckit-update.XXXXXX)"
trap 'rm -rf "${update_tmp}"' EXIT

run_specify() {
  local destination="$1" integration="$2"
  local -a integration_options=()
  [[ "${integration}" == 'codex' ]] && integration_options+=(--integration-options=--skills)
  if command -v specify >/dev/null 2>&1 &&
     [[ "$(specify --version 2>/dev/null | awk '{print $2}')" == "${VERSION}" ]]; then
    specify init "${destination}" --integration "${integration}" \
      "${integration_options[@]}" --ignore-agent-tools --force >/dev/null
  elif command -v uvx >/dev/null 2>&1; then
    uvx --from "specify-cli==${VERSION}" specify init "${destination}" \
      --integration "${integration}" "${integration_options[@]}" \
      --ignore-agent-tools --force >/dev/null
  else
    printf '[ERROR] Instale specify-cli==%s o uvx para actualizar los assets.\n' "${VERSION}" >&2
    exit 1
  fi
}

run_specify "${update_tmp}/claude" claude
run_specify "${update_tmp}/codex" codex

# Directorios generados exclusivamente por la release oficial de Spec Kit.
mkdir -p "${SKELETON_DIR}/.claude/skills" "${SKELETON_DIR}/.agents/skills"
rsync -a --delete "${update_tmp}/claude/.claude/skills/" "${SKELETON_DIR}/.claude/skills/"
rsync -a --delete "${update_tmp}/codex/.agents/skills/" "${SKELETON_DIR}/.agents/skills/"
# La constitución de una aplicación no es un comando de autoservicio. Spec Kit
# distribuye esta skill para proyectos que gobiernan su propia constitución,
# pero en el Golden Path la autoridad es la release organizacional. Se elimina
# después de cada actualización oficial para que no pueda invocarse desde el
# repositorio generado.
rm -rf \
  "${SKELETON_DIR}/.claude/skills/speckit-constitution" \
  "${SKELETON_DIR}/.agents/skills/speckit-constitution"
# La extensión organizacional vive fuera de los directorios administrados por
# Spec Kit y se reinstala después de cada actualización oficial.
ORGANIZATIONAL_SKILL="${SKELETON_DIR}/.sdd/extensions/redhat-openshift-sdd/skills/sdd-deliver"
[[ -s "${ORGANIZATIONAL_SKILL}/SKILL.md" ]] || {
  printf '[ERROR] Falta la skill organizacional canónica sdd-deliver.\n' >&2
  exit 1
}
mkdir -p "${SKELETON_DIR}/.claude/skills/sdd-deliver" "${SKELETON_DIR}/.agents/skills/sdd-deliver"
rsync -a --delete "${ORGANIZATIONAL_SKILL}/" "${SKELETON_DIR}/.claude/skills/sdd-deliver/"
rsync -a --delete "${ORGANIZATIONAL_SKILL}/" "${SKELETON_DIR}/.agents/skills/sdd-deliver/"
rsync -a --delete "${update_tmp}/claude/.specify/scripts/" "${SKELETON_DIR}/.specify/scripts/"
rsync -a --delete "${update_tmp}/claude/.specify/templates/" "${SKELETON_DIR}/.specify/templates/"
rsync -a --delete "${update_tmp}/claude/.specify/workflows/" "${SKELETON_DIR}/.specify/workflows/"
mkdir -p "${SKELETON_DIR}/.specify/integrations"
install -m 0644 "${update_tmp}/claude/.specify/integrations/claude.manifest.json" \
  "${SKELETON_DIR}/.specify/integrations/claude.manifest.json"
install -m 0644 "${update_tmp}/codex/.specify/integrations/codex.manifest.json" \
  "${SKELETON_DIR}/.specify/integrations/codex.manifest.json"
install -m 0644 "${update_tmp}/claude/.specify/integrations/speckit.manifest.json" \
  "${SKELETON_DIR}/.specify/integrations/speckit.manifest.json"

# Los manifiestos registran únicamente assets efectivamente materializados.
for manifest_file in \
  "${SKELETON_DIR}/.specify/integrations/claude.manifest.json" \
  "${SKELETON_DIR}/.specify/integrations/codex.manifest.json"; do
  jq 'del(.files[".claude/skills/speckit-constitution/SKILL.md"]) |
      del(.files[".agents/skills/speckit-constitution/SKILL.md"])' \
    "${manifest_file}" > "${manifest_file}.tmp"
  mv "${manifest_file}.tmp" "${manifest_file}"
done

# Spec Kit registra la hora local de instalación. Se normaliza para que una
# misma release produzca exactamente el mismo contenido versionado.
normalized_timestamp='1970-01-01T00:00:00Z'
for manifest_file in \
  "${SKELETON_DIR}/.specify/integrations/claude.manifest.json" \
  "${SKELETON_DIR}/.specify/integrations/codex.manifest.json" \
  "${SKELETON_DIR}/.specify/integrations/speckit.manifest.json"; do
  jq --arg timestamp "${normalized_timestamp}" \
    'if has("installed_at") then .installed_at=$timestamp else . end' \
    "${manifest_file}" > "${manifest_file}.tmp"
  mv "${manifest_file}.tmp" "${manifest_file}"
done
jq --arg timestamp "${normalized_timestamp}" \
  '.workflows |= with_entries(.value.installed_at=$timestamp | .value.updated_at=$timestamp)' \
  "${SKELETON_DIR}/.specify/workflows/workflow-registry.json" \
  > "${SKELETON_DIR}/.specify/workflows/workflow-registry.json.tmp"
mv "${SKELETON_DIR}/.specify/workflows/workflow-registry.json.tmp" \
  "${SKELETON_DIR}/.specify/workflows/workflow-registry.json"

jq -n --arg version "${VERSION}" '{
  version:$version,
  integration_state_schema:1,
  installed_integrations:["claude","codex"],
  integration_settings:{
    claude:{script:"sh",invoke_separator:"-"},
    codex:{script:"sh",raw_options:"--skills",parsed_options:{skills:true},invoke_separator:"-"}
  },
  integration:"claude",
  default_integration:"claude"
}' > "${SKELETON_DIR}/.specify/integration.json"

jq -n --arg version "${VERSION}" '{
  ai:"claude", ai_skills:true, feature_numbering:"sequential", here:true,
  integration:"claude", script:"sh", speckit_version:$version
}' > "${SKELETON_DIR}/.specify/init-options.json"

printf '%s\n' "${VERSION}" > "${VERSION_FILE}"
[[ -s "${SKELETON_DIR}/.claude/settings.json" && -x "${SKELETON_DIR}/tools/sdd-claude-hook.sh" && \
   -s "${SKELETON_DIR}/.sdd/workloads.schema.json" ]] || {
  printf '[ERROR] La actualización no puede eliminar el guard ni el contrato SDD organizacional.\n' >&2
  exit 1
}
printf '[OK] Assets oficiales de GitHub Spec Kit %s actualizados para Claude y Codex.\n' "${VERSION}"
printf '[OK] Skill speckit-constitution excluida: la constitución pertenece a la plataforma.\n'
printf '[OK] Skill organizacional sdd-deliver reinstalada para Claude y Codex.\n'
printf '[OK] Guard de Claude y contrato multi-workload preservados.\n'
printf '[OK] Constitución preservada: %s\n' "${SKELETON_DIR}/.specify/memory/constitution.md"
