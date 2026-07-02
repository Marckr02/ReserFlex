BEGIN;

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 1, '09:00', '20:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 2, '09:00', '20:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 3, '09:00', '20:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 4, '09:00', '20:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 5, '09:00', '20:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 6, '09:00', '20:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'barberia-el-rey'), 0, '10:00', '14:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 1, '08:00', '18:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 2, '08:00', '18:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 3, '08:00', '18:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 4, '08:00', '18:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'consultorio-martinez'), 5, '08:00', '18:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 1, '12:00', '16:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 2, '12:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 3, '12:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 4, '12:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 5, '12:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 6, '12:00', '23:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'la-trattoria'), 0, '12:00', '20:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 0, '00:00', '23:59', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 1, '00:00', '23:59', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 2, '00:00', '23:59', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 3, '00:00', '23:59', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 4, '00:00', '23:59', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 5, '00:00', '23:59', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'hotel-majestic'), 6, '00:00', '23:59', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'arena-sports'), 1, '06:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'arena-sports'), 2, '06:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'arena-sports'), 3, '06:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'arena-sports'), 4, '06:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'arena-sports'), 5, '06:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'arena-sports'), 6, '06:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'arena-sports'), 0, '07:00', '14:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 4, '10:00', '22:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 5, '10:00', '23:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 6, '09:00', '23:00', true);

INSERT INTO "Schedule" (id, "businessId", "dayOfWeek", "startTime", "endTime", "isActive")
VALUES ((SELECT gen_random_uuid()), (SELECT id FROM "Business" WHERE slug = 'centro-eventos-fiesta'), 0, '09:00', '20:00', true);

COMMIT;