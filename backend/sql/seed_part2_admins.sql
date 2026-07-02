-- Seed admins
BEGIN;

INSERT INTO "User" (name, email, password, role, verified, "businessId") VALUES
  ('Carlos Mendoza', 'admin.barberia@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'ADMIN_NEGOCIO', true,
   (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')),
  ('Dra. Ana Martínez', 'admin.consultorio@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZ', 'ADMIN_NEGOCIO', true,
   (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')),
  ('Marco Torres', 'admin.restaurante@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'ADMIN_NEGOCIO', true,
   (SELECT id FROM "Business" WHERE slug = 'la-trattoria')),
  ('Laura Burbano', 'admin.hotel@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'ADMIN_NEGOCIO', true,
   (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')),
  ('Roberto Enríquez', 'admin.deportes@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'ADMIN_NEGOCIO', true,
   (SELECT id FROM "Business" WHERE slug = 'arena-sports')),
  ('Sofía Alejandra', 'admin.eventos@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'ADMIN_NEGOCIO', true,
   (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'))
ON CONFLICT (email) DO NOTHING;

COMMIT;