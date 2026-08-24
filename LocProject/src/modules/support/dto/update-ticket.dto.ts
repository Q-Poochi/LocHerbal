import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] })
  @IsOptional()
  @IsEnum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: TicketStatus;

  @ApiPropertyOptional({ example: 'uuid-of-admin-user' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}