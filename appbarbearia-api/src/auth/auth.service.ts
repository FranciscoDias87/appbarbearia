import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma.service";
import * as argon2 from "argon2";
import { LoginDto, RegisterDto } from "./dto";
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  private tokens(user: any) {
    const payload = {
      sub: user.id,
      barbershopId: user.barbershopId,
      role: user.role,
    };
    return {
      accessToken: this.jwt.sign(payload, {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN", "15m"),
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN", "7d"),
      }),
    };
  }
  async register(dto: RegisterDto) {
    const shop = await this.prisma.barbershop.findFirst({
      where: { isActive: true },
    });
    if (!shop) throw new UnauthorizedException("Barbearia não configurada");
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({
      where: { barbershopId_email: { barbershopId: shop.id, email } },
    });
    if (exists) throw new ConflictException("E-mail já cadastrado");
    const user = await this.prisma.user.create({
      data: {
        barbershopId: shop.id,
        name: dto.name,
        email,
        phone: dto.phone,
        passwordHash: await argon2.hash(dto.password),
      },
    });
    return { user: this.safe(user), ...this.tokens(user) };
  }
  async login(dto: LoginDto) {
    const shop = await this.prisma.barbershop.findFirst({
      where: { isActive: true },
    });
    const user = shop
      ? await this.prisma.user.findUnique({
          where: {
            barbershopId_email: {
              barbershopId: shop.id,
              email: dto.email.toLowerCase(),
            },
          },
        })
      : null;
    if (
      !user?.passwordHash ||
      !(await argon2.verify(user.passwordHash, dto.password))
    )
      throw new UnauthorizedException("Credenciais inválidas");
    return { user: this.safe(user), ...this.tokens(user) };
  }
  safe(user: any) {
    const { passwordHash, googleId, ...safe } = user;
    return safe;
  }
  async me(id: string, barbershopId: string) {
    const u = await this.prisma.user.findFirst({ where: { id, barbershopId } });
    if (!u) throw new UnauthorizedException();
    return this.safe(u);
  }
  async refresh(token: string) {
    try {
      const p = this.jwt.verify(token, {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
      });
      const u = await this.prisma.user.findFirst({
        where: { id: p.sub, barbershopId: p.barbershopId, isActive: true },
      });
      if (!u) throw new UnauthorizedException();
      return this.tokens(u);
    } catch {
      throw new UnauthorizedException("Refresh token inválido");
    }
  }
}
