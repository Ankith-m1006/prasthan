import { deploy } from './deploy.mjs'

deploy(false).catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
