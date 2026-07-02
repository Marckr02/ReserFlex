SELECT 'Business' as tabla, COUNT(*)::int as total FROM "Business"
UNION ALL SELECT 'User total', COUNT(*)::int FROM "User"
UNION ALL SELECT 'User admin+emp', COUNT(*)::int FROM "User" WHERE "businessId" IS NOT NULL
UNION ALL SELECT 'User cliente', COUNT(*)::int FROM "User" WHERE role = 'CLIENTE'
UNION ALL SELECT 'Service', COUNT(*)::int FROM "Service"
UNION ALL SELECT 'EmployeeService', COUNT(*)::int FROM "EmployeeService"
UNION ALL SELECT 'Schedule', COUNT(*)::int FROM "Schedule"
UNION ALL SELECT 'RestaurantTable', COUNT(*)::int FROM "RestaurantTable";