BEGIN;

INSERT INTO "User" (id, name, email, password, role, verified, "businessId") VALUES
  ((SELECT gen_random_uuid()), 'Pedro López', 'empleado1.barberia@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')),
  ((SELECT gen_random_uuid()), 'Jorge Soto', 'empleado2.barberia@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')),
  ((SELECT gen_random_uuid()), 'Dr. Roberto Díaz', 'empleado1.consultorio@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')),
  ((SELECT gen_random_uuid()), 'Lic. Susana Flores', 'empleado2.consultorio@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')),
  ((SELECT gen_random_uuid()), 'Chef Eduardo Ruiz', 'empleado1.restaurante@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'la-trattoria')),
  ((SELECT gen_random_uuid()), 'Mesero Carlos Vega', 'empleado2.restaurante@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'la-trattoria')),
  ((SELECT gen_random_uuid()), 'Recepcionista María José', 'empleado1.hotel@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')),
  ((SELECT gen_random_uuid()), 'Conserje Jorge Pérez', 'empleado2.hotel@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZq', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')),
  ((SELECT gen_random_uuid()), 'Instructor Diego Aguilar', 'empleado1.deportes@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'arena-sports')),
  ((SELECT gen_random_uuid()), 'Auxiliar Carmen Salazar', 'empleado2.deportes@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'arena-sports')),
  ((SELECT gen_random_uuid()), 'Coordinador Pablo Muñoz', 'empleado1.eventos@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta')),
  ((SELECT gen_random_uuid()), 'Decoradora Jenny Ortiz', 'empleado2.eventos@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'EMPLEADO', true, (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'));

COMMIT;