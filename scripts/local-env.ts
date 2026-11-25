import { readFileSync } from 'node:fs'
import { parse } from 'dotenv'

export function localEnv() {
  try {
    return parse(readFileSync(new URL('../.env', import.meta.url)))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw new Error('Cannot read the checkout .env')
  }
}
