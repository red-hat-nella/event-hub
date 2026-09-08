// Local-only PostgreSQL test: all DDL/data is rolled back, including on failure.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const schema = `seed_test_${randomUUID().replaceAll('-', '')}`;
const init = readFileSync(new URL('../backend/event-service/prisma/migrations/20260907230527_init/migration.sql', import.meta.url), 'utf8');
const seed = readFileSync(new URL('../backend/event-service/prisma/migrations/20260908090000_seed_demo_catalog/migration.sql', import.meta.url), 'utf8');
const result = spawnSync('podman', ['exec', '-i', 'event-hub_db-events_1', 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'dev', '-d', 'account_experience_test'], {
  encoding: 'utf8',
  input: `BEGIN;
CREATE SCHEMA "${schema}";
SET LOCAL search_path TO "${schema}";
${init}
INSERT INTO events (id,name,description,starts_at,location,max_capacity,available_slots,updated_at)
VALUES ('existing-fixture','Existing event','Must survive', '2025-01-01','Existing location',10,3,'2025-01-01');
CREATE TEMP TABLE original_event ON COMMIT DROP AS SELECT * FROM events;
${seed}
DO $$ BEGIN
  IF (SELECT count(*) FROM events) <> 13 THEN RAISE EXCEPTION 'Expected 12 new events'; END IF;
  IF (SELECT count(DISTINCT category) FROM events WHERE id <> 'existing-fixture') <> 6 THEN RAISE EXCEPTION 'Expected six categories'; END IF;
  IF EXISTS (SELECT 1 FROM events WHERE id <> 'existing-fixture' AND
    (name NOT LIKE 'Demo %' OR description NOT LIKE '%demostración%' OR starts_at <= CURRENT_TIMESTAMP OR
     max_capacity <= 0 OR available_slots <> max_capacity OR location = '' OR image_url IS NOT NULL))
    THEN RAISE EXCEPTION 'Invalid demo data'; END IF;
  IF EXISTS (SELECT * FROM original_event EXCEPT SELECT * FROM events) THEN RAISE EXCEPTION 'Existing data changed'; END IF;
END $$;
UPDATE events SET name='Edited by admin', available_slots=1, starts_at='2025-01-01', updated_at='2025-01-02'
WHERE id = (SELECT id FROM events WHERE id <> 'existing-fixture' ORDER BY id LIMIT 1);
CREATE TEMP TABLE before_repeat ON COMMIT DROP AS SELECT * FROM events;
${seed}
DO $$ BEGIN
  IF EXISTS (SELECT * FROM before_repeat EXCEPT SELECT * FROM events) OR
     EXISTS (SELECT * FROM events EXCEPT SELECT * FROM before_repeat)
    THEN RAISE EXCEPTION 'Repeated seed changed or duplicated data'; END IF;
END $$;
ROLLBACK;`,
});
assert.equal(result.status, 0, result.error?.message || result.stderr);
console.log('PASS: 12 demo events, six categories, future dates, existing data preserved, repeat unchanged; transaction rolled back.');
