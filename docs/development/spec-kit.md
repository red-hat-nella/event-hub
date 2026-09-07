# Usar y actualizar GitHub Spec Kit

El repositorio ya viene inicializado con los assets oficiales de GitHub Spec
Kit fijados a la versión indicada en `.specify/SPECKIT_VERSION`. El
desarrollador no necesita ejecutar `specify init`, instalar presets ni copiar
prompts manualmente.

## Claude Code

Abra Claude desde la raíz del repositorio. Las skills se descubren en
`.claude/skills`:

```text
/speckit-specify quiero una aplicación del clima moderna
/speckit-plan usar una arquitectura simple y desplegable en OpenShift
/speckit-tasks
/speckit-implement
```

## Codex

Abra Codex desde la raíz del repositorio. Las mismas skills se descubren en
`.agents/skills`:

```text
$speckit-specify quiero una aplicación del clima moderna
$speckit-plan usar una arquitectura simple y desplegable en OpenShift
$speckit-tasks
$speckit-implement
```

Al finalizar `implement`, Spec Kit ejecuta obligatoriamente `sdd-deliver`. La
skill crea el commit, publica en `main` y sigue la entrega hasta mostrar la
Route. No se necesita ejecutar Git manualmente ni iniciar sesión con `oc`.

El flujo debe finalizar en la misma sesión y con cualquier LLM que respete los
archivos de instrucciones del repositorio. Un error de RBAC, Tekton, Argo CD,
operadores o Kubernetes API es responsabilidad de la plataforma: no requiere
otro modelo, otra sesión, un commit vacío ni una modificación artificial de la
aplicación. El instalador valida el permiso crítico antes de habilitar RHDH y el
orquestador conserva y reintenta la fase afectada.

La constitución corporativa en `.specify/memory/constitution.md` es inmutable y
no dispone de una skill `speckit-constitution` en repositorios de aplicaciones.
Claude bloquea las operaciones de modificación antes de ejecutarlas; Codex y
los demás agentes reciben la misma prohibición en `AGENTS.md`. En todos los
casos, el preflight local y Tekton vuelven a validar el SHA-256 canónico antes
de publicar o desplegar.

## Actualización centralizada

Cada aplicación puede actualizar los assets oficiales con:

```bash
./tools/update-speckit-assets.sh <nueva-version>
```

Ese comando obtiene los assets incluidos en la release oficial de
`specify-cli`, regenera las integraciones Claude y Codex y conserva intactas la
constitución, la configuración de gobernanza y la skill organizacional
`sdd-deliver`, cuya fuente canónica vive en `.sdd/extensions/`. El equipo de plataforma ejecuta
el mismo actualizador en el Software Template y publica las versiones aprobadas
para aplicaciones nuevas.
