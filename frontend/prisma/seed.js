const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'superadmin@reservflex.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@reservflex.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      verified: true
    }
  });
  console.log('SuperAdmin ready:', user.email);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
