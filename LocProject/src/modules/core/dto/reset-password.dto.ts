import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token không hợp lệ' })
  token: string;

  @IsString({ message: 'Mật khẩu mới không hợp lệ' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu mới quá dài' })
  newPassword: string;
}