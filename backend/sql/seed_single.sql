BEGIN;

INSERT INTO "Business" (id, name, slug, type, address, active)
VALUES ((SELECT gen_random_uuid()), 'Barbería El Rey', 'barberia-el-rey', 'SALON_BARBERIA', 'Av. Amazonas 1234, Quito', true);

INSERT INTO "Business" (id, name, slug, type, address, active)
VALUES ((SELECT gen_random_uuid()), 'Consultorio Dra. Martínez', 'consultorio-martinez', 'CONSULTORIO', 'Av. Gran Colombia 5678, Quito', true);

INSERT INTO "Business" (id, name, slug, type, address, active)
VALUES ((SELECT gen_random_uuid()), 'La Trattoria', 'la-trattoria', 'RESTAURANTE', 'Av. Naciones Unidas 901, Quito', true);

INSERT INTO "Business" (id, name, slug, type, address, active)
VALUES ((SELECT gen_random_uuid()), 'Hotel Majestic', 'hotel-majestic', 'HOTEL', 'Av. 6 de Diciembre 3456, Quito', true);

INSERT INTO "Business" (id, name, slug, type, address, active)
VALUES ((SELECT gen_random_uuid()), 'Arena Sports', 'arena-sports', 'CANCHA_GIMNASIO', 'Av. Cevallos 789, Quito', true);

INSERT INTO "Business" (id, name, slug, type, address, active)
VALUES ((SELECT gen_random_uuid()), 'Centro de Eventos La Fiesta', 'centro-eventos-fiesta', 'GENERICO', 'Av. Occidental 2345, Quito', true);

COMMIT;