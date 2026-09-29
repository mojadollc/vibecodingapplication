import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { registerRoutes } from "./routes/index.js"

async function main() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" })

  await registerRoutes(app)

  const port = Number(process.env.ORCHESTRATOR_PORT ?? 3001)

  try {
    await app.listen({ port, host: "0.0.0.0" })
    console.log(`Orchestrator running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
