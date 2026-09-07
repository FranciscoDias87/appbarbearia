import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
export class RegisterDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() phone?: string;
}
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
export class RefreshDto {
  @IsString() refreshToken!: string;
}
export class ChangePasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}
