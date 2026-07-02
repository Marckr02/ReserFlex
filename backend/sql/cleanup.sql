-- ReserFlex — Script de limpieza completa de negocios
-- Elimina todos los negocios y su información relacionada
-- NO elimina SUPER_ADMIN ni clientes independientes

BEGIN;

-- 1. Reservas de mesa
DELETE FROM "TableReservation" tr
USING "RestaurantTable" rt
WHERE tr."tableId" = rt.id;

-- 2. Mesas de restaurante
DELETE FROM "RestaurantTable" rt
USING "Business" b
WHERE rt."businessId" = b.id;

-- 3. Fotos de negocio
DELETE FROM "BusinessPhoto" bp
USING "Business" b
WHERE bp."businessId" = b.id;

-- 4. Empleados — desasignar servicios primero
DELETE FROM "EmployeeService" es
USING "User" u
WHERE es."employeeId" = u.id AND u."businessId" IS NOT NULL;

-- 5. Reservaciones normales
DELETE FROM "Reservation" r
USING "Business" b
WHERE r."businessId" = b.id;

-- 6. Servicios
DELETE FROM "Service" s
USING "Business" b
WHERE s."businessId" = b.id;

-- 7. Horarios
DELETE FROM "Schedule" sc
USING "Business" b
WHERE sc."businessId" = b.id;

-- 8. Usuarios admin y empleados del negocio
DELETE FROM "User" u
WHERE u."businessId" IS NOT NULL;

-- 9. Finalmente, los negocios
DELETE FROM "Business";

COMMIT;