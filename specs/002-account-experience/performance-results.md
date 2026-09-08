# SC-005 — medición local

2026-09-07. Chromium, build Vite de producción servido por preview, caché HTTP deshabilitada, CDP 10 Mbps subida/bajada y latencia 100 ms. Datos de cuenta/100 inscripciones interceptados con fixtures contractuales; esta medición aísla carga/renderizado del navegador, no acredita latencia del clúster. El flujo backend real se verifica separadamente en account-lifecycle.spec.ts.

Desde navegación hasta heading y contenido confirmado (métricas/lista cuando aplica), en milisegundos:

| Vista | Muestras (20) | <3 s |
|---|---|---|
| Cuenta | 385,365,368,375,368,362,361,374,376,371,370,364,388,364,373,380,375,363,369,365 | 20/20 |
| Inscripciones | 388,407,385,374,403,373,410,378,382,374,379,374,370,382,385,396,379,385,382,390 | 20/20 |
| Perfil | 357,355,355,358,351,351,352,358,351,353,359,358,359,359,356,355,354,361,357,360 | 20/20 |
| Detalle | 381,360,367,359,369,363,364,385,362,361,364,363,368,363,359,366,361,365,389,386 | 20/20 |

Resultado local: PASS, 80/80 bajo 3 s. Timeout 8 s por intento probado con reloj controlado en api-client.test.ts; consultas privadas sin retry automático y recuperación manual verificada en navegador. Reproducir: build frontend/backends y `node tools/run-account-test-stack.mjs account-performance.spec.ts --workers=1`.
