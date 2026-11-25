import { deploy } from './deploy.mjs'

deploy(true).catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
