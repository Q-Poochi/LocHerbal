import { IsString, IsOptional, IsEmail, IsPhoneNumber, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @ApiPropertyOptional({ example: 'nguyenvana@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ example: 'Khiếu nại về đơn hàng' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'Đơn hàng bị thiếu sản phẩm...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({ example: 'ORD-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  orderId?: string;
}