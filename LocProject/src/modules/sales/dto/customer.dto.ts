import { IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateCustomerAddressDto {
    @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
    @IsString()
    @MaxLength(255, { message: 'Tên người nhận tối đa 255 ký tự' })
    recipientName: string;

    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @IsString()
    @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
    phone: string;

    @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
    @IsString()
    addressLine: string;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Phường/xã tối đa 100 ký tự' })
    ward?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Quận/huyện tối đa 100 ký tự' })
    district?: string;

    @IsNotEmpty({ message: 'Tỉnh/thành phố không được để trống' })
    @IsString()
    @MaxLength(100, { message: 'Tỉnh/thành phố tối đa 100 ký tự' })
    province: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}