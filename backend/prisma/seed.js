const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TEMP_PASSWORD = 'Test1234';

const BUSINESSES = [
  {
    name: 'Barbería El Rey',
    slug: 'barberia-el-rey',
    type: 'SALON_BARBERIA',
    address: 'Av. Amazonas N35-42 y Juan Pablo Sanz, Quito',
    adminName: 'Carlos Mendoza',
    adminEmail: 'admin.barberia@test.com',
    services: [
      { name: 'Corte de cabello clásico', description: 'Corte tradicional con máquina y tijera', price: 8, duration: 30 },
      { name: 'Corte moderno + barba', description: 'Corte contemporáneo con diseño de barba', price: 15, duration: 45 },
      { name: 'Afeitado clásico con toalla caliente', description: 'Afeitado tradicional con productos premium', price: 10, duration: 25 },
      { name: 'Diseño de cejas y bigote', description: 'Perfilado profesional de cejas masculinas', price: 5, duration: 15 },
      { name: 'Tratamiento capilar nutritivo', description: 'Mascarilla y masaje capilar revitalizante', price: 12, duration: 30 },
    ],
    employees: ['Pedro Jiménez', 'Andrés López'],
  },
  {
    name: 'Consultorio Médico Vital',
    slug: 'consultorio-vital',
    type: 'CONSULTORIO',
    address: 'Av. República N7-55 y Almagro, Quito',
    adminName: 'Dra. María Elena Sánchez',
    adminEmail: 'admin.consultorio@test.com',
    services: [
      { name: 'Consulta médica general', description: 'Evaluación completa del estado de salud', price: 25, duration: 30 },
      { name: 'Examen físico completo', description: 'Chequeo anual con laboratorio básico incluido', price: 45, duration: 60 },
      { name: 'Vacuna antigripal', description: 'Aplicación de vacuna Influenza estacional', price: 15, duration: 15 },
      { name: 'Control de presión arterial', description: 'Medición y seguimiento de presión', price: 8, duration: 15 },
      { name: 'Certificado médico', description: 'Evaluación y emisión de certificado laboral', price: 20, duration: 20 },
    ],
    employees: ['Dr. Roberto Aguilar', 'Lic. Sofía Narváez'],
  },
  {
    name: 'Restaurante La Casona',
    slug: 'restaurante-la-casona',
    type: 'RESTAURANTE',
    address: 'Calle La Ronda N6-56 y Benigno Malo, Cuenca',
    adminName: 'Chef Fernando Ríos',
    adminEmail: 'admin.restaurante@test.com',
    services: [
      { name: 'Menú del día (almuerzo)', description: 'Entrada, plato fuerte, bebida y postre', price: 12, duration: 60 },
      { name: 'Cena romántica para dos', description: 'Menú degustación con vino incluido', price: 55, duration: 120 },
      { name: 'Evento privado (hasta 20 personas)', description: 'Reservación exclusiva con menú personalizado', price: 200, duration: 180 },
      { name: 'Brunch dominical', description: 'Buffet libre con opciones internacionales', price: 18, duration: 90 },
    ],
    employees: ['Mesero Juan Carlos', 'Bartender Laura Díaz'],
    tables: [
      { number: 1, capacity: 2, posX: 15, posY: 25, shape: 'round' },
      { number: 2, capacity: 2, posX: 30, posY: 25, shape: 'round' },
      { number: 3, capacity: 4, posX: 45, posY: 25, shape: 'square' },
      { number: 4, capacity: 4, posX: 60, posY: 25, shape: 'square' },
      { number: 5, capacity: 6, posX: 75, posY: 25, shape: 'rectangle' },
      { number: 6, capacity: 8, posX: 25, posY: 50, shape: 'rectangle' },
      { number: 7, capacity: 4, posX: 50, posY: 50, shape: 'square' },
      { number: 8, capacity: 2, posX: 70, posY: 50, shape: 'round' },
    ],
  },
  {
    name: 'Hotel Boutique Casa de la Luna',
    slug: 'hotel-casa-de-la-luna',
    type: 'HOTEL',
    address: 'Calle Sucre N9-44 y Presidente Córdova, Quito',
    adminName: 'Sra. Patricia Jaramillo',
    adminEmail: 'admin.hotel@test.com',
    services: [
      { name: 'Check-in express', description: 'Registro rápido sin demora', price: 0, duration: 10 },
      { name: 'Acceso spa completo', description: 'Uso de sauna, jacuzzi y piscina termal (4h)', price: 35, duration: 240 },
      { name: 'Desayuno buffet incluido', description: 'Buffet internacional de 7:00 a 10:30', price: 12, duration: 60 },
      { name: 'Lavandería express', description: 'Servicio de lavado y planchado (24h)', price: 15, duration: 30 },
      { name: 'Room service premium', description: 'Servicio a la habitación 24/7', price: 8, duration: 30 },
    ],
    employees: ['Recepcionista Miguel Ortiz', 'Concierge Ana Lucía Bravo'],
  },
  {
    name: 'Centro Deportivo Los Deportes',
    slug: 'centro-deportivo-los-deportes',
    type: 'CANCHA_GIMNASIO',
    address: 'Av. Ordóñez Lasso N2-45 y Carlos Julio Arosemena, Guayaquil',
    adminName: 'Prof. Roberto Mendoza',
    adminEmail: 'admin.deportes@test.com',
    services: [
      { name: 'Alquiler de cancha de fútbol 5', description: 'Cancha de césped sintético (1 hora)', price: 20, duration: 60 },
      { name: 'Alquiler de cancha de tennis', description: 'Cancha de césped sintético (1 hora)', price: 15, duration: 60 },
      { name: 'Entrenamiento personal (1 hora)', description: 'Sesión individual con instructor certificado', price: 25, duration: 60 },
      { name: 'Clase grupal spinning', description: 'Clase de 45 min en bicicleta estática', price: 8, duration: 45 },
      { name: 'Acceso diario gimnasio', description: 'Uso libre de equipos y vestidores', price: 10, duration: 120 },
    ],
    employees: ['Instructor Carlos Pérez', 'Auxiliar María Fernanda Gómez'],
  },
  {
    name: 'Centro de Eventos La Gran Fiesta',
    slug: 'centro-eventos-gran-fiesta',
    type: 'GENERICO',
    address: 'Av. Cevallos N10-35 y Mariscal Lamar, Ambato',
    adminName: 'Sr. Jorge Hernándes',
    adminEmail: 'admin.eventos@test.com',
    services: [
      { name: 'Alquiler de salón (4 horas)', description: 'Salón completo con cocina y baños', price: 250, duration: 240 },
      { name: 'Decoración básica', description: 'Globos, manteles y centros de mesa', price: 80, duration: 120 },
      { name: 'Servicio de catering (por persona)', description: 'Menú ejecutivo con bebidas', price: 18, duration: 30 },
      { name: 'Equipo de sonido básico', description: 'Parlantes y micrófono inalámbrico', price: 50, duration: 60 },
      { name: 'Fotografía profesional (3 horas)', description: 'Sesión completa con editedigital', price: 150, duration: 180 },
    ],
    employees: ['Coordinador Diego López', 'DJ Sebastián Ruiz'],
  },
];

const DAYS_OF_WEEK = [
  { day: 0, startTime: '09:00', endTime: '18:00' },
  { day: 1, startTime: '08:00', endTime: '20:00' },
  { day: 2, startTime: '08:00', endTime: '20:00' },
  { day: 3, startTime: '08:00', endTime: '20:00' },
  { day: 4, startTime: '08:00', endTime: '20:00' },
  { day: 5, startTime: '08:00', endTime: '20:00' },
  { day: 6, startTime: '09:00', endTime: '14:00' },
];

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 10);

  for (const bizData of BUSINESSES) {
    console.log(`📦 Creando: ${bizData.name}...`);

    const existingBusiness = await prisma.business.findUnique({
      where: { slug: bizData.slug },
    });

    if (existingBusiness) {
      console.log(`   ⚠️  Ya existe, saltando...\n`);
      continue;
    }

    const business = await prisma.business.create({
      data: {
        name: bizData.name,
        slug: bizData.slug,
        type: bizData.type,
        address: bizData.address,
        active: true,
      },
    });

    const admin = await prisma.user.create({
      data: {
        name: bizData.adminName,
        email: bizData.adminEmail,
        password: hashedPassword,
        role: 'ADMIN_NEGOCIO',
        verified: true,
        businessId: business.id,
      },
    });
    console.log(`   ✅ Admin: ${admin.email} / ${TEMP_PASSWORD}`);

    for (const serviceData of bizData.services) {
      await prisma.service.create({
        data: {
          businessId: business.id,
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          active: true,
        },
      });
    }
    console.log(`   ✅ ${bizData.services.length} servicios creados`);

    for (let i = 0; i < bizData.employees.length; i++) {
      const empName = bizData.employees[i];
      const empEmail = `empleado${i + 1}.${bizData.slug}@test.com`.toLowerCase().replace(/\s+/g, '');
      const employee = await prisma.user.create({
        data: {
          name: empName,
          email: empEmail,
          password: hashedPassword,
          role: 'EMPLEADO',
          verified: true,
          businessId: business.id,
        },
      });

      const services = await prisma.service.findMany({
        where: { businessId: business.id },
        take: 3,
      });

      for (const svc of services) {
        await prisma.employeeService.create({
          data: {
            employeeId: employee.id,
            serviceId: svc.id,
          },
        });
      }
      console.log(`   ✅ Empleado: ${empEmail} / ${TEMP_PASSWORD}`);
    }

    for (const day of DAYS_OF_WEEK) {
      await prisma.schedule.create({
        data: {
          businessId: business.id,
          dayOfWeek: day.day,
          startTime: day.startTime,
          endTime: day.endTime,
          isActive: true,
        },
      });
    }
    console.log(`   ✅ Horarios creados (7 días)`);

    if (bizData.tables) {
      for (const tableData of bizData.tables) {
        await prisma.restaurantTable.create({
          data: {
            businessId: business.id,
            number: tableData.number,
            capacity: tableData.capacity,
            posX: tableData.posX,
            posY: tableData.posY,
            shape: tableData.shape,
            active: true,
          },
        });
      }
      console.log(`   ✅ ${bizData.tables.length} mesas creadas`);
    }

    console.log('');
  }

  const superAdminEmail = 'superadmin@reserflex.com';
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        name: 'Super Administrador',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        verified: true,
      },
    });
    console.log('🔐 Super Admin creado:');
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Contraseña: ${TEMP_PASSWORD}`);
  } else {
    console.log('⚠️  Super Admin ya existe, saltando...');
  }

  console.log('\n✅ Seed completado exitosamente!');
  console.log('\n📋 Credenciales de prueba (todas usan la misma contraseña):');
  console.log(`   Contraseña para todos: ${TEMP_PASSWORD}`);
  console.log('\n   ┌─────────────────────────────────────────────────────────────┐');
  console.log('   │  Rol            │  Email                               │');
  console.log('   ├─────────────────────────────────────────────────────────────┤');
  console.log('   │  Super Admin    │  superadmin@reserflex.com             │');
  console.log('   │  Admin Barbería │  admin.barberia@test.com              │');
  console.log('   │  Admin Consult. │  admin.consultorio@test.com           │');
  console.log('   │  Admin Restaur. │  admin.restaurante@test.com          │');
  console.log('   │  Admin Hotel    │  admin.hotel@test.com                │');
  console.log('   │  Admin Deportes │  admin.deportes@test.com             │');
  console.log('   │  Admin Eventos  │  admin.eventos@test.com              │');
  console.log('   └─────────────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });