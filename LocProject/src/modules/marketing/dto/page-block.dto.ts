import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PageBlockType {
  HERO = 'hero',
  TEXT = 'text',
  IMAGE_TEXT = 'image-text',
  STATS = 'stats',
  TEAM = 'team',
  TIMELINE = 'timeline',
}

export const PAGE_BLOCK_TYPES = Object.values(PageBlockType);

/**
 * Content mặc định theo từng type — dùng khi admin tạo block mới.
 */
export const DEFAULT_BLOCK_CONTENT: Record<string, unknown> = {
  [PageBlockType.HERO]: { title: '', subtitle: '', backgroundImageUrl: '', ctaText: '', ctaLink: '' },
  [PageBlockType.TEXT]: { heading: '', body: '' },
  [PageBlockType.IMAGE_TEXT]: { imageUrl: '', imagePosition: 'left', heading: '', body: '' },
  [PageBlockType.STATS]: { items: [] },
  [PageBlockType.TEAM]: { members: [] },
  [PageBlockType.TIMELINE]: { milestones: [] },
};

export class CreatePageBlockDto {
  @IsEnum(PageBlockType)
  type: PageBlockType;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}

export class UpdatePageBlockDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ReorderPageBlockItemDto {
  @IsString()
  id: string;

  @IsInt()
  order: number;
}

export class ReorderPageBlocksDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderPageBlockItemDto)
  items: ReorderPageBlockItemDto[];
}