import { IsNotEmpty, IsString, IsIn, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '0912345678', description: 'Số điện thoại Việt Nam' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^0[3-9]\d{8}$/, { message: 'Số điện thoại không đúng định dạng Việt Nam' })
  phone: string;

  @ApiProperty({ example: 'login', enum: ['login', 'register'], description: 'Mục đích sử dụng OTP' })
  @IsNotEmpty({ message: 'Mục đích sử dụng không được để trống' })
  @IsIn(['login', 'register'], { message: 'Mục đích sử dụng phải là login hoặc register' })
  purpose: 'login' | 'register';
}

export class VerifyOtpDto {
  @ApiProperty({ example: '0912345678', description: 'Số điện thoại Việt Nam' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^0[3-9]\d{8}$/, { message: 'Số điện thoại không đúng định dạng Việt Nam' })
  phone: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP 6 số' })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm 6 chữ số' })
  code: string;

  @ApiProperty({ example: 'login', enum: ['login', 'register'], description: 'Mục đích sử dụng OTP' })
  @IsNotEmpty({ message: 'Mục đích sử dụng không được để trống' })
  @IsIn(['login', 'register'], { message: 'Mục đích sử dụng phải là login hoặc register' })
  purpose: 'login' | 'register';
}
