import { IsNotEmpty, IsString, IsUUID, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
  @IsNotEmpty({ message: 'SKU không được để trống' })
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty({ message: 'Giá không được để trống' })
  @IsNumber({}, { message: 'Giá phải là số' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá so sánh phải là số' })
  compareAtPrice?: number;

  @IsOptional()
  optionValues?: any;
}

export class CreateProductDto {
  @IsNotEmpty({ message: 'categoryId không được để trống' })
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId: string;

  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpsertProductAttributeValueDto {
  @IsNotEmpty({ message: 'attributeId không được để trống' })
  @IsUUID('4', { message: 'attributeId phải là UUID hợp lệ' })
  attributeId: string;

  @IsNotEmpty({ message: 'Giá trị không được để trống' })
  @IsString()
  value: string;
}
