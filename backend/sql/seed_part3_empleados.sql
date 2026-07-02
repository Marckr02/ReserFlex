-- Seed employees
BEGIN;

INSERT INTO "User" (name, email, password, role, verified, "businessId") VALUES
  ('Pedro López', 'empleado1.barberia@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')),
  ('Jorge Soto', 'empleado2.barberia@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')),
  ('Dr. Roberto Díaz', 'empleado1.consultorio@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')),
  ('Lic. Susana Flores', 'empleado2.consultorio@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')),
  ('Chef Eduardo Ruiz', 'empleado1.restaurante@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'la-trattoria')),
  ('Mesero Carlos Vega', 'empleado2.restaurante@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'la-trattoria')),
  ('Recepcionista María José', 'empleado1.hotel@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')),
  ('Conserje Jorge Pérez', 'empleado2.hotel@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')),
  ('Instructor Diego Aguilar', 'empleado1.deportes@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'arena-sports')),
  ('Auxiliar Carmen Salazar', 'empleado2.deportes@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'arena-sports')),
  ('Coordinador Pablo Muñoz', 'empleado1.eventos@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta')),
  ('Decoradora Jenny Ortiz', 'empleado2.eventos@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true,
   (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'))
ON CONFLICT (email) DO NOTHING;

COMMIT;