import {
    IsEmail,
    IsISO8601,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateConsultationLeadDto {
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    fullName!: string;

    @IsString()
    @Matches(/^[0-9+\-\s]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
    phone!: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    note?: string;

    @IsOptional()
    @IsUUID()
    productId?: string;

    @IsISO8601()
    preferredDate!: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):00$/, { message: 'Khung giờ phải có dạng HH:00' })
    preferredTime!: string;
}

export class UpdateLeadStatusDto {
    @IsString()
    status!: string;
}

export class AssignLeadDto {
    @IsUUID()
    assigneeId!: string;
}