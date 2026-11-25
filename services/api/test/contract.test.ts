import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { makeAjv } from './helpers/ajv.js';

const contractDir = fileURLToPath(new URL('../../../shared/contract/', import.meta.url));
const examples = readdirSync(join(contractDir, 'examples')).filter((f) => f.endsWith('.json') && !f.includes('.request'));

describe('contract v1', () => {
  const ajv = makeAjv();
  it('has an example for every schema', () => {
    const schemas = readdirSync(join(contractDir, 'schemas')).filter((f) => !['lang.json', 'service.json'].includes(f));
    for (const s of schemas) expect(examples).toContain(s);
  });
  for (const file of examples) {
    it(`example ${file} is valid`, () => {
      const validate = ajv.getSchema(`https://prasthan.local/schemas/${file}`);
      expect(validate, `schema for ${file}`).toBeTruthy();
      const data: unknown = JSON.parse(readFileSync(join(contractDir, 'examples', file), 'utf8'));
      const ok = validate!(data);
      expect(validate!.errors ?? []).toEqual([]);
      expect(ok).toBe(true);
    });
  }
});
