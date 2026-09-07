import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";
import {
  AppointmentHistoryAction,
  AppointmentStatus,
  Role,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
class CreateAppointmentDto {
  @IsString() barberId!: string;
  @IsString() serviceId!: string;
  @IsString() date!: string;
  @IsString() startTime!: string;
}
class CancelDto {
  @IsOptional() @IsString() reason?: string;
}
class UpdateStatusDto {
  @IsIn(["COMPLETED", "NO_SHOW"]) status!: AppointmentStatus;
}
function mins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function time(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private prisma: PrismaService) {}
  @Get() @UseGuards(RolesGuard) @Roles(Role.ADMIN) all(@CurrentUser() u: any) {
    return this.prisma.appointment.findMany({
      where: { barbershopId: u.barbershopId },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        barber: { select: { id: true, name: true } },
        service: true,
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });
  }
  @Get("me") me(@CurrentUser() u: any, @Query("status") status?: any) {
    return this.prisma.appointment.findMany({
      where: {
        barbershopId: u.barbershopId,
        clientId: u.id,
        ...(status ? { status } : {}),
      },
      include: { barber: { select: { id: true, name: true } }, service: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });
  }
  @Get(":id") one(@CurrentUser() u: any, @Param("id") id: string) {
    return this.prisma.appointment.findFirst({
      where: {
        id,
        barbershopId: u.barbershopId,
        OR: [{ clientId: u.id }, { barberId: u.id }],
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        barber: { select: { id: true, name: true } },
        service: true,
        history: true,
      },
    });
  }
  @Post() async create(@CurrentUser() u: any, @Body() d: CreateAppointmentDto) {
    if (u.role !== "CLIENT")
      throw new BadRequestException("Somente clientes podem agendar");
    const day = new Date(`${d.date}T00:00:00.000Z`);
    if (Number.isNaN(day.getTime()))
      throw new BadRequestException("Data inválida");
    const barber = await this.prisma.user.findFirst({
      where: {
        id: d.barberId,
        barbershopId: u.barbershopId,
        role: "BARBER",
        isActive: true,
      },
    });
    const service = await this.prisma.service.findFirst({
      where: {
        id: d.serviceId,
        barbershopId: u.barbershopId,
        isActive: true,
        barberServices: { some: { barberId: d.barberId } },
      },
    });
    if (!barber || !service)
      throw new BadRequestException("Barbeiro ou serviço inválido");
    const dow = day.getUTCDay();
    const sched = await this.prisma.barberSchedule.findUnique({
      where: { barberId_dayOfWeek: { barberId: d.barberId, dayOfWeek: dow } },
      include: { periods: true },
    });
    if (!sched?.isActive)
      throw new BadRequestException("Barbeiro não trabalha neste dia");
    const start = mins(d.startTime),
      end = start + service.duration;
    const valid = sched.periods.some(
      (p) => start >= mins(p.startTime) && end <= mins(p.endTime),
    );
    if (!valid) throw new BadRequestException("Horário fora da agenda");
    const block = await this.prisma.scheduleBlock.findFirst({
      where: {
        barbershopId: u.barbershopId,
        barberId: d.barberId,
        date: day,
        OR: [
          { startTime: null, endTime: null },
          {
            AND: [
              { startTime: { lte: d.startTime } },
              { endTime: { gt: d.startTime } },
            ],
          },
        ],
      },
    });
    if (block) throw new ConflictException("Horário bloqueado");
    const existing = await this.prisma.appointment.findFirst({
      where: {
        barberId: d.barberId,
        barbershopId: u.barbershopId,
        date: day,
        startTime: d.startTime,
        status: "CONFIRMED",
      },
    });
    if (existing) throw new ConflictException("SLOT_ALREADY_BOOKED");
    try {
      return await this.prisma.$transaction(async (tx) => {
        const a = await tx.appointment.create({
          data: {
            barbershopId: u.barbershopId,
            clientId: u.id,
            barberId: d.barberId,
            serviceId: d.serviceId,
            date: day,
            startTime: d.startTime,
            endTime: time(end),
            price: service.price,
          },
        });
        await tx.appointmentHistory.create({
          data: {
            appointmentId: a.id,
            userId: u.id,
            action: "CREATED",
            newStatus: "CONFIRMED",
          },
        });
        return tx.appointment.findUnique({
          where: { id: a.id },
          include: {
            barber: { select: { id: true, name: true } },
            service: true,
          },
        });
      });
    } catch (e: any) {
      if (e?.code === "P2002")
        throw new ConflictException("SLOT_ALREADY_BOOKED");
      throw e;
    }
  }
  @Patch(":id/cancel") async cancel(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() d: CancelDto,
  ) {
    const a = await this.prisma.appointment.findFirst({
      where: {
        id,
        barbershopId: u.barbershopId,
        OR: [{ clientId: u.id }, { barberId: u.id }],
      },
    });
    if (!a) throw new BadRequestException("Agendamento não encontrado");
    if (a.status !== "CONFIRMED")
      throw new BadRequestException("Agendamento não pode ser cancelado");
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: { status: "CANCELLED", cancelReason: d.reason },
      });
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          userId: u.id,
          action: "CANCELLED",
          oldStatus: a.status,
          newStatus: "CANCELLED",
          reason: d.reason,
        },
      });
      return updated;
    });
  }
  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(Role.BARBER, Role.ADMIN)
  async status(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() d: UpdateStatusDto,
  ) {
    const a = await this.prisma.appointment.findFirst({
      where: {
        id,
        barbershopId: u.barbershopId,
        ...(u.role === Role.BARBER ? { barberId: u.id } : {}),
      },
    });
    if (!a) throw new BadRequestException("Agendamento não encontrado");
    if (a.status !== AppointmentStatus.CONFIRMED)
      throw new BadRequestException("Status não pode mais ser alterado");
    const action =
      d.status === AppointmentStatus.COMPLETED
        ? AppointmentHistoryAction.COMPLETED
        : AppointmentHistoryAction.NO_SHOW;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: { status: d.status },
      });
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          userId: u.id,
          action,
          oldStatus: a.status,
          newStatus: d.status,
        },
      });
      return updated;
    });
  }
  @Get("/barbers/:barberId/availability") async availability(
    @CurrentUser() u: any,
    @Param("barberId") barberId: string,
    @Query("date") date: string,
    @Query("serviceId") serviceId: string,
  ) {
    const day = new Date(`${date}T00:00:00.000Z`);
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        barbershopId: u.barbershopId,
        isActive: true,
        barberServices: { some: { barberId } },
      },
    });
    if (!service) throw new BadRequestException("Serviço inválido");
    const dow = day.getUTCDay();
    const s = await this.prisma.barberSchedule.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek: dow } },
      include: { periods: true },
    });
    if (!s?.isActive) return { date, slots: [] };
    const blocks = await this.prisma.scheduleBlock.findMany({
      where: { barbershopId: u.barbershopId, barberId, date: day },
    });
    const booked = await this.prisma.appointment.findMany({
      where: {
        barbershopId: u.barbershopId,
        barberId,
        date: day,
        status: "CONFIRMED",
      },
    });
    const slots: string[] = [];
    for (const p of s.periods) {
      for (
        let t = mins(p.startTime);
        t + service.duration <= mins(p.endTime);
        t += s.slotIntervalMinutes
      ) {
        const st = time(t),
          en = time(t + service.duration);
        const blocked = blocks.some(
          (b) =>
            !b.startTime || !b.endTime || (st < b.endTime && en > b.startTime),
        );
        const occupied = booked.some((a) => st < a.endTime && en > a.startTime);
        if (!blocked && !occupied) slots.push(st);
      }
    }
    return { date, barberId, serviceId, slots: [...new Set(slots)] };
  }
}
