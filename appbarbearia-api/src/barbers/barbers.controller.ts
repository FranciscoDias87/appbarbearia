import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
@Controller("barbers")
@UseGuards(JwtAuthGuard)
export class BarbersController {
  constructor(private prisma: PrismaService) {}
  @Get() list(@CurrentUser() u: any) {
    return this.prisma.user.findMany({
      where: { barbershopId: u.barbershopId, role: "BARBER", isActive: true },
      select: { id: true, name: true, avatar: true, phone: true },
    });
  }
  @Get(":id") one(@CurrentUser() u: any, @Param("id") id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        barbershopId: u.barbershopId,
        role: "BARBER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        phone: true,
        barberServices: { include: { service: true } },
      },
    });
  }
}
