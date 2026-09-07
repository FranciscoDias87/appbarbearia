import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
class PeriodDto {
  @IsString() startTime!: string;
  @IsString() endTime!: string;
}
class ScheduleDto {
  @IsInt() @Min(0) @Max(6) dayOfWeek!: number;
  @IsOptional() periods?: PeriodDto[];
}
class BlockDto {
  @IsString() date!: string;
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsOptional() @IsString() reason?: string;
}
@Controller("barber/schedule")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BARBER, Role.ADMIN)
export class SchedulesController {
  constructor(private prisma: PrismaService) {}
  @Get() all(@CurrentUser() u: any) {
    return this.prisma.barberSchedule.findMany({
      where: { barbershopId: u.barbershopId, barberId: u.id },
      include: { periods: true },
      orderBy: { dayOfWeek: "asc" },
    });
  }
  @Post() async save(@CurrentUser() u: any, @Body() d: ScheduleDto) {
    for (const p of d.periods ?? []) {
      if (p.startTime >= p.endTime) throw new Error("Período inválido");
    }
    return this.prisma.$transaction(async (tx) => {
      const s = await tx.barberSchedule.upsert({
        where: {
          barberId_dayOfWeek: { barberId: u.id, dayOfWeek: d.dayOfWeek },
        },
        update: { isActive: true },
        create: {
          barbershopId: u.barbershopId,
          barberId: u.id,
          dayOfWeek: d.dayOfWeek,
        },
      });
      await tx.schedulePeriod.deleteMany({ where: { scheduleId: s.id } });
      if (d.periods?.length)
        await tx.schedulePeriod.createMany({
          data: d.periods.map((p) => ({ ...p, scheduleId: s.id })),
        });
      return tx.barberSchedule.findUnique({
        where: { id: s.id },
        include: { periods: true },
      });
    });
  }
  @Get("/blocks") blocks(@CurrentUser() u: any, @Query("date") date?: string) {
    return this.prisma.scheduleBlock.findMany({
      where: {
        barbershopId: u.barbershopId,
        barberId: u.id,
        ...(date ? { date: new Date(date) } : {}),
      },
    });
  }
  @Post("/blocks") block(@CurrentUser() u: any, @Body() d: BlockDto) {
    if (d.startTime && d.endTime && d.startTime >= d.endTime)
      throw new Error("Bloqueio inválido");
    return this.prisma.scheduleBlock.create({
      data: {
        barbershopId: u.barbershopId,
        barberId: u.id,
        date: new Date(d.date),
        startTime: d.startTime,
        endTime: d.endTime,
        reason: d.reason,
      },
    });
  }
  @Delete("/blocks/:id") del(@CurrentUser() u: any, @Param("id") id: string) {
    return this.prisma.scheduleBlock.deleteMany({
      where: { id, barbershopId: u.barbershopId, barberId: u.id },
    });
  }
}
