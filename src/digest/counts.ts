import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLine } from './read.js';

export type NightCounts = { night: string; ok: number; retry: number; fail: number };

// Run lines by status for one night; bad lines are not counted. A missing file counts as zeros.
export function countNight(runsDir: string, night: string): NightCounts {
  const counts: NightCounts = { night, ok: 0, retry: 0, fail: 0 };
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return counts;
  }
  for (const line of text.split('\n')) {
    const run = parseLine(line);
    if (run) counts[run.status]++;
  }
  return counts;
}
