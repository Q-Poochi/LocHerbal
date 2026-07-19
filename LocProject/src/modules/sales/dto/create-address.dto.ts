import { IsNotEmpty, IsString, IsOptional, IsBoolean, MinLength, Matches } from 'class-validator';

export class CreateAddressDto {
    @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
    @IsString()
    @MinLength(2, { message: 'Tên người nhận tối thiểu 2 ký tự' })
    recipientName: string;

    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @IsString()
    @Matches(/^(03|05|07|08|09)[0-9]{8}$/, { message: 'Số điện thoại không hợp lệ (VD: 0909123456)' })
    phone: string;

    @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
    @IsString()
    addressLine: string;

    @IsOptional()
    @IsString()
    ward?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsNotEmpty({ message: 'Tỉnh/thành phố không được để trống' })
    @IsString()
    province: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}