import { ApiError, AuthResponse, Appointment, AppointmentStatus, Barber, Service, User } from './types';
import { session } from './session';
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = session.get()?.accessToken;
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (response.status === 401 && retry && session.get()?.refreshToken) { try { const renewed = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session.get()?.refreshToken }) }); if (renewed.ok) { const data = await renewed.json(); session.set({ ...session.get()!, ...data }); return request<T>(path, init, false); } } catch { /* fall through */ } session.clear(); if (typeof window !== 'undefined') window.location.assign('/login'); }
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw { message: Array.isArray(body.message) ? body.message.join(', ') : body.message || 'Não foi possível concluir a solicitação.', status: response.status } satisfies ApiError; }
  return response.status === 204 ? undefined as T : response.json();
}
export const api = {
  login: (data: { email: string; password: string }) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { name: string; email: string; password: string; phone?: string }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<User>('/auth/me'),
  barbers: () => request<Barber[]>('/barbers'), services: () => request<Service[]>('/services'),
  createService: (data: { name: string; description?: string; duration: number; price: number }) => request<Service>('/services', { method: 'POST', body: JSON.stringify(data) }),
  createBarber: (data: { name: string; email: string; password: string; phone?: string }) => request<Barber>('/admin/barbers', { method: 'POST', body: JSON.stringify(data) }),
  assignBarberService: (barberId: string, serviceId: string) => request(`/admin/barbers/${barberId}/services`, { method: 'POST', body: JSON.stringify({ serviceId }) }),
  appointments: () => request<Appointment[]>('/appointments/me'),
  adminAppointments: () => request<Appointment[]>('/appointments'),
  barberDashboard: (date?: string) => request<{ appointments: Appointment[] }>(`/barber/dashboard${date ? `?date=${date}` : ''}`),
  availability: (barberId: string, date: string, serviceId: string) => request<{ date: string; slots: string[] }>(`/appointments/barbers/${barberId}/availability?date=${date}&serviceId=${serviceId}`),
  createAppointment: (data: { barberId: string; serviceId: string; date: string; startTime: string }) => request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id: string, status: AppointmentStatus) => request<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  blocks: (date?: string) => request<unknown[]>(`/barber/schedule/blocks${date ? `?date=${date}` : ''}`),
  createBlock: (data: { date: string; startTime?: string; endTime?: string; reason?: string }) => request('/barber/schedule/blocks', { method: 'POST', body: JSON.stringify(data) }),
  schedule: () => request<{ dayOfWeek: number; periods: { startTime: string; endTime: string }[] }[]>('/barber/schedule'),
  saveSchedule: (data: { dayOfWeek: number; periods: { startTime: string; endTime: string }[] }) => request('/barber/schedule', { method: 'POST', body: JSON.stringify(data) })
};
