-- Execute after prisma migrate dev.
-- Prevents two confirmed appointments for the same barber/date/start time.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_appointment
ON "Appointment" ("barberId", "date", "startTime")
WHERE "status" = 'CONFIRMED';
