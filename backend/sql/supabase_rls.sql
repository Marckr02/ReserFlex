ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Business" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmployeeService" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RestaurantTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TableReservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusinessPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_businesses_anon" ON "Business";
DROP POLICY IF EXISTS "update_business_admin" ON "Business";
DROP POLICY IF EXISTS "read_schedules_anon" ON "Schedule";
DROP POLICY IF EXISTS "write_schedules_admin" ON "Schedule";
DROP POLICY IF EXISTS "read_services_anon" ON "Service";
DROP POLICY IF EXISTS "write_services_admin" ON "Service";
DROP POLICY IF EXISTS "read_employee_service_anon" ON "EmployeeService";
DROP POLICY IF EXISTS "write_employee_service_admin" ON "EmployeeService";
DROP POLICY IF EXISTS "read_reservations_anon" ON "Reservation";
DROP POLICY IF EXISTS "write_reservations_admin" ON "Reservation";
DROP POLICY IF EXISTS "read_tables_anon" ON "RestaurantTable";
DROP POLICY IF EXISTS "write_tables_admin" ON "RestaurantTable";
DROP POLICY IF EXISTS "read_table_reservations_anon" ON "TableReservation";
DROP POLICY IF EXISTS "write_table_reservations_admin" ON "TableReservation";
DROP POLICY IF EXISTS "read_photos_anon" ON "BusinessPhoto";
DROP POLICY IF EXISTS "write_photos_admin" ON "BusinessPhoto";
DROP POLICY IF EXISTS "read_reviews_anon" ON "Review";
DROP POLICY IF EXISTS "write_reviews_admin" ON "Review";
DROP POLICY IF EXISTS "read_users_admin" ON "User";
DROP POLICY IF EXISTS "write_users_admin" ON "User";

CREATE POLICY "read_businesses_anon" ON "Business" FOR SELECT USING (true);
CREATE POLICY "write_business_admin" ON "Business" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_schedules_anon" ON "Schedule" FOR SELECT USING (true);
CREATE POLICY "write_schedules_admin" ON "Schedule" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_services_anon" ON "Service" FOR SELECT USING (active = true);
CREATE POLICY "write_services_admin" ON "Service" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_employee_service_anon" ON "EmployeeService" FOR SELECT USING (true);
CREATE POLICY "write_employee_service_admin" ON "EmployeeService" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_reservations_anon" ON "Reservation" FOR SELECT USING (true);
CREATE POLICY "write_reservations_admin" ON "Reservation" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_tables_anon" ON "RestaurantTable" FOR SELECT USING (active = true);
CREATE POLICY "write_tables_admin" ON "RestaurantTable" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_table_reservations_anon" ON "TableReservation" FOR SELECT USING (true);
CREATE POLICY "write_table_reservations_admin" ON "TableReservation" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_photos_anon" ON "BusinessPhoto" FOR SELECT USING (true);
CREATE POLICY "write_photos_admin" ON "BusinessPhoto" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_reviews_anon" ON "Review" FOR SELECT USING (true);
CREATE POLICY "write_reviews_admin" ON "Review" FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "read_users_anon" ON "User" FOR SELECT USING (true);
CREATE POLICY "write_users_admin" ON "User" FOR ALL USING (true) WITH CHECK (true);
