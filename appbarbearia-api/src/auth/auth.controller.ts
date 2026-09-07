import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { LoginDto, RefreshDto, RegisterDto } from "./dto";
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post("register") register(@Body() d: RegisterDto) {
    return this.auth.register(d);
  }
  @Post("login") login(@Body() d: LoginDto) {
    return this.auth.login(d);
  }
  @Post("refresh") refresh(@Body() d: RefreshDto) {
    return this.auth.refresh(d.refreshToken);
  }
  @Get("me") @UseGuards(JwtAuthGuard) me(@CurrentUser() u: any) {
    return this.auth.me(u.id, u.barbershopId);
  }
  @Post("logout") @UseGuards(JwtAuthGuard) logout() {
    return { success: true };
  }
}
