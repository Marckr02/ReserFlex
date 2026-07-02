DELETE FROM "Schedule" WHERE "businessId" IN (
  SELECT id FROM "Business" WHERE slug IN (
    'barberia-el-rey', 'consultorio-martinez', 'la-trattoria',
    'hotel-majestic', 'arena-sports', 'centro-eventos-fiesta'
  )
);