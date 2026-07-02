-- Seed services
BEGIN;

INSERT INTO "Service" ("businessId", name, description, price, duration) VALUES
  -- Barbería
  ((SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 'Corte clásico', 'Corte tradicional con máquina y tijera', 8.00, 30),
  ((SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 'Corte + Barba', 'Corte completo más arreglo de barba', 12.00, 45),
  ((SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 'Afeitado clásico', 'Afeitado con navaja y espuma caliente', 6.00, 25),
  ((SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 'Tintura', 'Cobertura de canas con tintura profesional', 20.00, 60),
  ((SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 'Tratamiento capilar', 'Mascarilla nutritiva para el cabello', 15.00, 30),
  -- Consultorio
  ((SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 'Consulta general', 'Evaluación médica general', 25.00, 30),
  ((SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 'Chequeo preventivo', 'Examen completo de rutina', 40.00, 45),
  ((SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 'Seguimiento crónico', 'Control de enfermedad crónica', 20.00, 20),
  -- Restaurante
  ((SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 'Menú del día', 'Entrada + plato fuerte + bebida', 12.00, 60),
  ((SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 'Cena ejecutiva', '3 platos + postre + café', 25.00, 90),
  ((SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 'Sopa del día', 'Sopa artesanal según disponibilidad', 5.00, 20),
  ((SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 'Bebidas', 'Refrescos, jugos, agua', 3.00, 5),
  -- Hotel
  ((SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 'Habitación estándar', 'Habitación doble con desayuno incluido', 85.00, 1440),
  ((SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 'Suite junior', 'Habitación suite con sala de estar', 140.00, 1440),
  ((SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 'Late checkout', 'Salida después de las 12:00', 25.00, 180),
  ((SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 'Lavandería', 'Servicio de lavado y planchado', 15.00, 240),
  ((SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 'Room service', 'Comida y bebida en la habitación', 10.00, 30),
  -- Cancha/Gimnasio
  ((SELECT id FROM "Business" WHERE slug = 'arena-sports'), 'Cancha de fútbol 5', 'Alquiler de cancha sintética 1 hora', 25.00, 60),
  ((SELECT id FROM "Business" WHERE slug = 'arena-sports'), 'Cancha de squash', 'Alquiler de cancha 1 hora', 15.00, 60),
  ((SELECT id FROM "Business" WHERE slug = 'arena-sports'), 'Gimnasio libre', 'Acceso día completo al gimnasio', 10.00, 480),
  ((SELECT id FROM "Business" WHERE slug = 'arena-sports'), 'Clase grupal', 'Spinning, yoga o CrossFit', 8.00, 60),
  ((SELECT id FROM "Business" WHERE slug = 'arena-sports'), 'Locker', 'Bodega segura para pertenencias', 5.00, 480),
  -- Eventos
  ((SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 'Salón pequeño (50 pers.)', 'Salón con capacidad para 50 personas', 200.00, 240),
  ((SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 'Salón grande (150 pers.)', 'Salón con capacidad para 150 personas', 450.00, 480),
  ((SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 'Decoración básica', 'Arreglos florales y centros de mesa', 80.00, 180),
  ((SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 'Catering básico', 'Menú corridas para eventos', 15.00, 60),
  ((SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 'Sonido e iluminación', 'Equipo de audio y luces básicas', 120.00, 240);

COMMIT;