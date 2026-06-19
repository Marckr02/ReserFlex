const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient instance.
// In Prisma v7+ with prisma.config.ts, the datasource URL is not embedded
// in the generated client, so we must pass it explicitly at runtime.
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

module.exports = prisma;
