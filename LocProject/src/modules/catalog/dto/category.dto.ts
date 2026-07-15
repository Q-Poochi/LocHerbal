import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug: string;

  @IsOptional()
  @IsUUID('4', { message: 'parentId phải là UUID hợp lệ' })
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID('4', { message: 'parentId phải là UUID hợp lệ' })
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
