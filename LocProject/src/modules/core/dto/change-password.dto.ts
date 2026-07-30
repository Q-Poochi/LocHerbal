import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(1, { message: 'Mật khẩu hiện tại không được để trống' })
    currentPassword: string;

    @IsString()
    @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
    newPassword: string;
}
