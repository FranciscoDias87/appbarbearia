"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Protected } from "@/components/protected";
import { api } from "@/lib/api";
import { Appointment, Barber, Service } from "@/lib/types";
export default function AdminDashboard() {
  const [data, setData] = useState<{
    appointments: Appointment[];
    barbers: Barber[];
    services: Service[];
  }>({ appointments: [], barbers: [], services: [] });
  useEffect(() => {
    Promise.all([api.adminAppointments(), api.barbers(), api.services()])
      .then(([appointments, barbers, services]) =>
        setData({ appointments, barbers, services }),
      )
      .catch(() => {});
  }, []);
  return (
    <Protected roles={["ADMIN"]}>
      <AppShell>
        <h2 className="mb-6 text-xl font-bold">Visão geral</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Agendamentos", data.appointments.length],
            ["Barbeiros", data.barbers.length],
            ["Serviços ativos", data.services.length],
          ].map(([label, value]) => (
            <div className="card" key={String(label)}>
              <p className="text-sm text-stone-500">{label}</p>
              <p className="mt-1 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </AppShell>
    </Protected>
  );
}
