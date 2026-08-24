import { IsOptional, IsEnum, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class TicketQueryDto {
  @ApiPropertyOptional({ enum: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] })
  @IsOptional()
  @IsEnum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: TicketStatus;

  @ApiPropertyOptional({ example: 'Nguyễn' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}