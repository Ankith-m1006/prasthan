import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const schemaDir = fileURLToPath(new URL('../../../../shared/contract/schemas/', import.meta.url));
const addFormats = addFormatsModule as unknown as (ajv: Ajv2020) => Ajv2020;

export function makeAjv(): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const f of readdirSync(schemaDir)) {
    ajv.addSchema(JSON.parse(readFileSync(join(schemaDir, f), 'utf8')) as object);
  }
  return ajv;
}

export function assertValid(ajv: Ajv2020, schemaFile: string, data: unknown): void {
  const v = ajv.getSchema(`https://prasthan.local/schemas/${schemaFile}`);
  if (!v) throw new Error(`no schema ${schemaFile}`);
  if (!v(data)) throw new Error(`${schemaFile} invalid: ${JSON.stringify(v.errors)}`);
}
