import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma.service";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }
  async validate(payload: { sub: string; barbershopId: string; role: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        barbershopId: payload.barbershopId,
        isActive: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      barbershopId: user.barbershopId,
      role: user.role,
      name: user.name,
      email: user.email,
    };
  }
}
