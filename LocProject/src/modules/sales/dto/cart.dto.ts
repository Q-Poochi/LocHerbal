import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
    @IsNotEmpty({ message: 'productVariantId không được để trống' })
    @IsString()
    productVariantId: string;

    @IsNotEmpty({ message: 'Số lượng không được để trống' })
    @IsInt({ message: 'Số lượng phải là số nguyên' })
    @Min(1, { message: 'Số lượng tối thiểu là 1' })
    qty: number;
}

export class UpdateCartItemDto {
    @IsNotEmpty({ message: 'Số lượng không được để trống' })
    @IsInt({ message: 'Số lượng phải là số nguyên' })
    @Min(1, { message: 'Số lượng tối thiểu là 1' })
    qty: number;
}

export class CreateCartDto {
    @IsOptional()
    @IsString()
    sessionId?: string;
}