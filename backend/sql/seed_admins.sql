BEGIN;

INSERT INTO "User" (id, name, email, password, role, verified, "businessId")
VALUES (
  (SELECT gen_random_uuid()),
  'Carlos Mendoza',
  'admin.barberia@test.com',
  '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ',
  'ADMIN_NEGOCIO',
  true,
  (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')
);

INSERT INTO "User" (id, name, email, password, role, verified, "businessId")
VALUES (
  (SELECT gen_random_uuid()),
  'Dra. Ana Martínez',
  'admin.consultorio@test.com',
  '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ',
  'ADMIN_NEGOCIO',
  true,
  (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')
);

INSERT INTO "User" (id, name, email, password, role, verified, "businessId")
VALUES (
  (SELECT gen_random_uuid()),
  'Marco Torres',
  'admin.restaurante@test.com',
  '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ',
  'ADMIN_NEGOCIO',
  true,
  (SELECT id FROM "Business" WHERE slug = 'la-trattoria')
);

INSERT INTO "User" (id, name, email, password, role, verified, "businessId")
VALUES (
  (SELECT gen_random_uuid()),
  'Laura Burbano',
  'admin.hotel@test.com',
  '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ',
  'ADMIN_NEGOCIO',
  true,
  (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')
);

INSERT INTO "User" (id, name, email, password, role, verified, "businessId")
VALUES (
  (SELECT gen_random_uuid()),
  'Roberto Enríquez',
  'admin.deportes@test.com',
  '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ',
  'ADMIN_NEGOCIO',
  true,
  (SELECT id FROM "Business" WHERE slug = 'arena-sports')
);

INSERT INTO "User" (id, name, email, password, role, verified, "businessId")
VALUES (
  (SELECT gen_random_uuid()),
  'Sofía Alejandra',
  'admin.eventos@test.com',
  '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ',
  'ADMIN_NEGOCIO',
  true,
  (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta')
);

COMMIT;