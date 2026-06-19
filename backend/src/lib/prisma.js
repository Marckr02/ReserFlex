const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient instance.
// The database URL is read from env("DATABASE_URL") defined in schema.prisma.
const prisma = new PrismaClient();

module.exports = prisma;
