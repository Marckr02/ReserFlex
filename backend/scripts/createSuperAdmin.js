const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@reservflex.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      verified: true
    }
  });

  console.log('✅ Super Admin creado exitosamente');
  console.log(`   Email: ${user.email}`);
  console.log(`   Contraseña: Admin123!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());