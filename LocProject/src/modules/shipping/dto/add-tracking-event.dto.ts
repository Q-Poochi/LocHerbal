import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddTrackingEventDto {
  @IsString({ message: 'Status phải là chuỗi' })
  @MaxLength(100, { message: 'Status tối đa 100 ký tự' })
  status: string;

  @IsOptional()
  @IsString({ message: 'Description phải là chuỗi' })
  @MaxLength(500, { message: 'Description tối đa 500 ký tự' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'occurredAt phải là chuỗi ISO date' })
  occurredAt?: string;
}