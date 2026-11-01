import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';
import { lane } from '../src/lane.js';

// runs/ is read-only: the normal night is copied into a temp dir, never written in place.
const FIXTURE = fileURLToPath(new URL('../runs/2026-10-28.jsonl', import.meta.url));
const NORMAL = '2026-10-28'; // 5 jobs, 1 bad last line
const EMPTY = '2026-10-30'; // empty file
const MISSING = '2026-10-31'; // no file at all
const JOBS = ['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs'];
const MARKER = 'DIGEST-ROUTES-MARKER';

let runsDir: string;
let oldMarker: string | undefined;

function makeApp() {
  const config: RigConfig = {
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir,
  };
  return createApp(config);
}

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-routes-'));
  writeFileSync(join(runsDir, `${NORMAL}.jsonl`), readFileSync(FIXTURE, 'utf8'));
  writeFileSync(join(runsDir, `${EMPTY}.jsonl`), '');
  oldMarker = process.env.LANE_MARKER;
  process.env.LANE_MARKER = MARKER;
});

afterAll(() => {
  rmSync(runsDir, { recursive: true, force: true });
  if (oldMarker === undefined) delete process.env.LANE_MARKER;
  else process.env.LANE_MARKER = oldMarker;
});

describe('GET /digest/:night (page)', () => {
  it('renders the normal night: 200, each job, the lane banner', async () => {
    const res = await makeApp().request(`/digest/${NORMAL}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    for (const job of JOBS) expect(html).toContain(job);
    expect(html).toContain(lane().id);
    expect(html).toContain(MARKER);
  });

  it('answers 404 for a night with no file', async () => {
    const res = await makeApp().request(`/digest/${MISSING}`);
    expect(res.status).toBe(404);
  });

  it('renders the empty night with "nothing ran"', async () => {
    const res = await makeApp().request(`/digest/${EMPTY}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('nothing ran');
  });

  it('renders a night with a bad line: 200 and "didn\'t parse"', async () => {
    const res = await makeApp().request(`/digest/${NORMAL}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toMatch(/didn(&#39;|')t parse/); // hono escapes the apostrophe
  });
});

describe('GET /api/digest/:night (JSON)', () => {
  it('answers 200 with { night, rows, badLines } for the normal night', async () => {
    const res = await makeApp().request(`/api/digest/${NORMAL}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { night: string; rows: { job: string }[]; badLines: number };
    expect(body.night).toBe(NORMAL);
    expect(body.rows).toHaveLength(5);
    expect(body.badLines).toBe(1);
  });

  it('lists the jobs in the same order as the HTML page', async () => {
    const html = await (await makeApp().request(`/digest/${NORMAL}`)).text();
    const body = (await (await makeApp().request(`/api/digest/${NORMAL}`)).json()) as { rows: { job: string }[] };
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual(JOBS);
    const positions = jobs.map((job) => html.indexOf(job));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('answers 404 for a night with no file', async () => {
    const res = await makeApp().request(`/api/digest/${MISSING}`);
    expect(res.status).toBe(404);
  });

  it('returns no rows and no bad lines for the empty night', async () => {
    const res = await makeApp().request(`/api/digest/${EMPTY}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: unknown[]; badLines: number };
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });
});
