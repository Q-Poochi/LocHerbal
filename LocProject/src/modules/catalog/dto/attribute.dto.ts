import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional, IsJSON } from 'class-validator';
import { AttributeDataType } from '@prisma/client';

export class CreateAttributeDefinitionDto {
  @IsNotEmpty({ message: 'Key thuộc tính không được để trống' })
  @IsString()
  key: string;

  @IsNotEmpty({ message: 'Label không được để trống' })
  @IsString()
  label: string;

  @IsNotEmpty({ message: 'Kiểu dữ liệu không được để trống' })
  @IsEnum(AttributeDataType, { message: 'Kiểu dữ liệu không hợp lệ' })
  dataType: AttributeDataType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  options?: any; // Lưu Json (ví dụ danh sách các giá trị lựa chọn cho kiểu SELECT)
}
