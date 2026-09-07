"use client";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Protected } from "@/components/protected";
import { api } from "@/lib/api";
const days = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
export default function WorkingHours() {
  const [schedule, setSchedule] = useState<
    { dayOfWeek: number; periods: { startTime: string; endTime: string }[] }[]
  >([]);
  const [day, setDay] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api
      .schedule()
      .then(setSchedule)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    void load();
  }, []);
  const active = schedule.find((s) => s.dayOfWeek === day);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      await api.saveSchedule({
        dayOfWeek: day,
        periods: [
          {
            startTime: String(values.startTime),
            endTime: String(values.endTime),
          },
        ],
      });
      setMessage(`${days[day]} atualizado com sucesso.`);
      load();
    } catch (error) {
      setMessage((error as { message: string }).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Protected roles={["BARBER"]}>
      <AppShell>
        <div className="max-w-xl">
          <h2 className="text-xl font-bold">Horários de trabalho</h2>
          <p className="mb-6 text-stone-500">
            Defina quando os clientes podem encontrar horários disponíveis.
          </p>
          <form key={day} className="card space-y-4" onSubmit={submit}>
            {message && (
              <p className="rounded-lg bg-stone-100 p-3 text-sm">{message}</p>
            )}
            <label className="label">
              Dia da semana
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              >
                {days.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="label">
                Início
                <input
                  name="startTime"
                  type="time"
                  defaultValue={active?.periods[0]?.startTime ?? "09:00"}
                  required
                />
              </label>
              <label className="label">
                Fim
                <input
                  name="endTime"
                  type="time"
                  defaultValue={active?.periods[0]?.endTime ?? "18:00"}
                  required
                />
              </label>
            </div>
            <p className="text-xs text-stone-500">
              Por enquanto, cada dia suporta um período contínuo de atendimento.
            </p>
            <button className="button w-full" disabled={busy}>
              {busy ? "Salvando..." : "Salvar horário"}
            </button>
          </form>
        </div>
      </AppShell>
    </Protected>
  );
}
