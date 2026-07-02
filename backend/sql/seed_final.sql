BEGIN;

-- EmployeeService: Barbería emp1 -> Corte clásico + Corte+Barba
INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.barberia@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Corte clásico' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'))
);

INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.barberia@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Corte + Barba' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'))
);

-- Barbería emp2 -> Corte+Barba + Afeitado
INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado2.barberia@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Corte + Barba' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'))
);

INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado2.barberia@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Afeitado clásico' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'))
);

-- Consultorio emp1 -> Consulta general + Chequeo preventivo
INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.consultorio@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Consulta general' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'))
);

INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.consultorio@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Chequeo preventivo' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'))
);

-- Restaurante emp1 -> Menú del día + Cena ejecutiva
INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.restaurante@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Menú del día' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'la-trattoria'))
);

INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.restaurante@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Cena ejecutiva' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'la-trattoria'))
);

-- Hotel emp1 -> Habitación estándar + Suite junior
INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.hotel@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Habitación estándar' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'))
);

INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.hotel@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Suite junior' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'))
);

-- Arena emp1 -> Fútbol 5 + Squash
INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.deportes@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Cancha de fútbol 5' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'arena-sports'))
);

INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.deportes@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Cancha de squash' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'arena-sports'))
);

-- Eventos emp1 -> Salón pequeño + Salón grande
INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.eventos@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Salón pequeño (50 pers.)' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'))
);

INSERT INTO "EmployeeService" (id, "employeeId", "serviceId")
VALUES (
  (SELECT gen_random_uuid()),
  (SELECT id FROM "User" WHERE email = 'empleado1.eventos@test.com'),
  (SELECT id FROM "Service" WHERE name = 'Salón grande (150 pers.)' AND "businessId" = (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'))
);

-- RestaurantTables para La Trattoria (8 mesas)
INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 1, 4, 15.0, 20.0, 'round', true);

INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 2, 4, 35.0, 20.0, 'round', true);

INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 3, 6, 55.0, 20.0, 'square', true);

INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 4, 2, 15.0, 45.0, 'round', true);

INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 5, 2, 35.0, 45.0, 'round', true);

INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 6, 8, 55.0, 45.0, 'rectangle', true);

INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 7, 4, 75.0, 20.0, 'round', true);

INSERT INTO "RestaurantTable" (id, "businessId", number, capacity, "posX", "posY", shape, active)
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 8, 4, 75.0, 45.0, 'round', true);

-- Clientes
INSERT INTO "User" (id, name, email, password, role, verified)
VALUES ((SELECT gen_random_uuid()), 'Juan Pérez', 'cliente1@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true);

INSERT INTO "User" (id, name, email, password, role, verified)
VALUES ((SELECT gen_random_uuid()), 'María García', 'cliente2@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true);

INSERT INTO "User" (id, name, email, password, role, verified)
VALUES ((SELECT gen_random_uuid()), 'Andrés López', 'cliente3@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true);

INSERT INTO "User" (id, name, email, password, role, verified)
VALUES ((SELECT gen_random_uuid()), 'Carolina Ruiz', 'cliente4@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true);

INSERT INTO "User" (id, name, email, password, role, verified)
VALUES ((SELECT gen_random_uuid()), 'Diego Fernández', 'cliente5@test.com', '$2b$10$rQZ8K7VqJGZrYkQZqZqZqZqOqJZGZqZqZqZqZqZqZqZqZqZqZqZqZ', 'CLIENTE', true);

COMMIT;