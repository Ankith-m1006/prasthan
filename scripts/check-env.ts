import { readFileSync } from 'node:fs'
import { parse } from 'dotenv'
import { localEnv } from './local-env.js'

const example = parse(readFileSync(new URL('../.env.example', import.meta.url)))
const values = localEnv()
for (const name of Object.keys(example)) {
  console.log(name + ': ' + (values[name]?.trim() ? 'SET' : 'MISSING'))
}
