import "dotenv/config";
import { defineConfig } from "@prisma/config"; // ojo: el paquete correcto es @prisma/config

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {               // aquí declaras el motor
    url: process.env.DATABASE_URL ?? "postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}/${{PGDATABASE}}",   // aquí tu conexión
  },
});
