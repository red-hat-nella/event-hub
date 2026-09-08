import { readFileSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Load functions without CLI dispatch, override only the read-only status source.
const source = readFileSync(new URL('./sdd-deliver.sh', import.meta.url), 'utf8').split('case "${1:-}" in')[0];
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const route = 'https://example.test';
function watch(payload, compact = false) {
  return spawnSync('bash', ['-c', `${source}\nstatus() { printf '%s' "$TEST_STATUS"; }\nwatch_delivery`], {
    env: { ...process.env, TEST_STATUS: JSON.stringify(payload, null, compact ? undefined : 2) }, encoding: 'utf8', timeout: 3000,
  });
}
test('rejects historical SUCCEEDED rather than announcing deployment', () => {
  const result = watch({ phase: 'SUCCEEDED', sourceCommitSha: '0'.repeat(40), routeUrl: route });
  assert.equal(result.status, 21);
  assert.doesNotMatch(result.stdout, /\[OK\]/);
});
test('rejects SUCCEEDED without commit provenance', () => {
  assert.equal(watch({ phase: 'SUCCEEDED', routeUrl: route }).status, 21);
});
test('accepts only current commit with HTTPS Route, including compact JSON', () => {
  const result = watch({ phase: 'SUCCEEDED', sourceCommitSha: head, routeUrl: route }, true);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Aplicación desplegada: https:\/\/example.test/);
});
test('rejects missing or non-HTTPS Route', () => {
  for (const routeUrl of ['', 'http://example.test']) {
    assert.equal(watch({ phase: 'SUCCEEDED', sourceCommitSha: head, routeUrl }).status, 22);
  }
});
test('retains repository failure and platform terminal failure codes', () => {
  assert.equal(watch({ phase: 'WAITING_FOR_SOURCE', repairEvidence: 'TypeScript compile error' }).status, 10);
  assert.equal(watch({ phase: 'FAILED' }).status, 20);
});
