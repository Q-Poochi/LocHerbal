import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt({ message: 'Rating phải là số nguyên' })
  @Min(1, { message: 'Rating tối thiểu 1' })
  @Max(5, { message: 'Rating tối đa 5' })
  rating: number;

  @IsOptional()
  @IsString({ message: 'Comment phải là chuỗi' })
  @MaxLength(1000, { message: 'Comment tối đa 1000 ký tự' })
  comment?: string;
}

export class UpdateReviewDto {
  @IsInt({ message: 'Rating phải là số nguyên' })
  @Min(1, { message: 'Rating tối thiểu 1' })
  @Max(5, { message: 'Rating tối đa 5' })
  rating: number;

  @IsOptional()
  @IsString({ message: 'Comment phải là chuỗi' })
  @MaxLength(1000, { message: 'Comment tối đa 1000 ký tự' })
  comment?: string;
}