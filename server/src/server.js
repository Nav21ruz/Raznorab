import { app } from './app.js'
import { env } from './env.js'

app.listen(env.port, () => {
  console.log(`Raznorab API слушает порт ${env.port}`)
})
