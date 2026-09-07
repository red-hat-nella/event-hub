# Procedencia de Spec Kit

Los scripts, templates, workflows y skills bajo `.claude/skills`,
`.agents/skills` y `.specify` se generan desde la release oficial de
`specify-cli` indicada en `SPECKIT_VERSION`.

Se pueden actualizar desde la raíz de una aplicación mediante:

```bash
./tools/update-speckit-assets.sh <version>
```

El actualizador regenera las integraciones de Claude y Codex, pero nunca
reemplaza `.specify/memory/constitution.md` ni `.specify/governance.yaml`.

La constitución no proviene de Spec Kit: el bootstrap la materializa desde la
release versionada de `ocp-sdd-governance` declarada en
`.specify/governance.yaml`, después de verificar los SHA-256 de la release y del
archivo.
