-- Seed businesses
BEGIN;

INSERT INTO "Business" (name, slug, type, address, active) VALUES
  ('Barbería El Rey', 'barberia-el-rey', 'SALON_BARBERIA', 'Av. Amazonas 1234, Quito', true),
  ('Consultorio Dra. Martínez', 'consultorio-martinez', 'CONSULTORIO', 'Av. Gran Colombia 5678, Quito', true),
  ('La Trattoria', 'la-trattoria', 'RESTAURANTE', 'Av. Naciones Unidas 901, Quito', true),
  ('Hotel Majestic', 'hotel-majestic', 'HOTEL', 'Av. 6 de Diciembre 3456, Quito', true),
  ('Arena Sports', 'arena-sports', 'CANCHA_GIMNASIO', 'Av. Cevallos 789, Quito', true),
  ('Centro de Eventos La Fiesta', 'centro-eventos-fiesta', 'GENERICO', 'Av. Occidental 2345, Quito', true)
ON CONFLICT (slug) DO NOTHING;

COMMIT;