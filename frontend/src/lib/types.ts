export type Role = "ADMIN" | "BARBER" | "CLIENT";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  barbershopId?: string;
  barber?: { id: string };
};
export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: User;
};
export type Service = {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active?: boolean;
};
export type Barber = {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  services?: { service: Service }[];
};
export type AppointmentStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";
export type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  service: Service;
  barber: Barber;
  client?: User;
  cancelReason?: string;
};
export type ApiError = { message: string; status?: number };
