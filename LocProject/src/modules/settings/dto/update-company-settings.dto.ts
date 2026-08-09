import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateCompanySettingsDto {
    @IsString()
    @IsOptional()
    companyName?: string;

    @IsString()
    @IsOptional()
    tagline?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    about?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    hotline?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    workingHours?: string;

    @IsString()
    @IsOptional()
    facebookUrl?: string;

    @IsString()
    @IsOptional()
    youtubeUrl?: string;

    @IsString()
    @IsOptional()
    zaloUrl?: string;

    @IsString()
    @IsOptional()
    websiteUrl?: string;

    @IsString()
    @IsOptional()
    taxCode?: string;

    @IsString()
    @IsOptional()
    businessLicense?: string;
}