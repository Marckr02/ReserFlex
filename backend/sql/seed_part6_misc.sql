-- Seed employee-services, restaurant tables, and clients
BEGIN;

-- EmployeeService: barbería (emp1 -> corte clásico + corte+barba, emp2 -> corte+barba + afeitado)
INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.barberia@test.com' AND s.name = 'Corte clásico' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.barberia@test.com' AND s.name = 'Corte + Barba' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado2.barberia@test.com' AND s.name = 'Corte + Barba' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado2.barberia@test.com' AND s.name = 'Afeitado clásico' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

-- Consultorio (emp1 -> consulta general + chequeo preventivo)
INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.consultorio@test.com' AND s.name = 'Consulta general' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.consultorio@test.com' AND s.name = 'Chequeo preventivo' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

-- Restaurante (emp1 -> menú del día + cena ejecutiva)
INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.restaurante@test.com' AND s.name = 'Menú del día' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'la-trattoria')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.restaurante@test.com' AND s.name = 'Cena ejecutiva' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'la-trattoria')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

-- Hotel (emp1 -> habitación estándar + suite junior)
INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.hotel@test.com' AND s.name = 'Habitación estándar' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.hotel@test.com' AND s.name = 'Suite junior' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'hotel-majestic')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

-- Arena Sports (emp1 -> fútbol 5 + squash)
INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.deportes@test.com' AND s.name = 'Cancha de fútbol 5' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'arena-sports')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.deportes@test.com' AND s.name = 'Cancha de squash' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'arena-sports')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

-- Eventos (emp1 -> salón pequeño + salón grande)
INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.eventos@test.com' AND s.name = 'Salón pequeño (50 pers.)' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

INSERT INTO "EmployeeService" ("employeeId", "serviceId")
SELECT u.id, s.id FROM "User" u, "Service" s
WHERE u.email = 'empleado1.eventos@test.com' AND s.name = 'Salón grande (150 pers.)' AND s."businessId" = (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta')
ON CONFLICT ("employeeId", "serviceId") DO NOTHING;

-- Restaurant tables
INSERT INTO "RestaurantTable" ("businessId", number, capacity, "posX", "posY", shape, active)
SELECT id, number, capacity, "posX", "posY", shape, true
FROM (VALUES
  (1, 4, 15.0, 20.0, 'round'),
  (2, 4, 35.0, 20.0, 'round'),
  (3, 6, 55.0, 20.0, 'square'),
  (4, 2, 15.0, 45.0, 'round'),
  (5, 2, 35.0, 45.0, 'round'),
  (6, 8, 55.0, 45.0, 'rectangle'),
  (7, 4, 75.0, 20.0, 'round'),
  (8, 4, 75.0, 45.0, 'round')
) AS t(number, capacity, "posX", "posY", shape),
(SELECT id FROM "Business" WHERE slug = 'la-trattoria') AS b
ON CONFLICT ("businessId", number) DO NOTHING;

-- Clientes
INSERT INTO "User" (name, email, password, role, verified) VALUES
  ('Juan Pérez', 'cliente1@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true),
  ('María García', 'cliente2@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true),
  ('Andrés López', 'cliente3@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true),
  ('Carolina Ruiz', 'cliente4@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true),
  ('Diego Fernández', 'cliente5@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true)
ON CONFLICT (email) DO NOTHING;

COMMIT;