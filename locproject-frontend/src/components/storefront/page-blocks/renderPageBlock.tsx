import HeroBlock from './HeroBlock';
import TextBlock from './TextBlock';
import ImageTextBlock from './ImageTextBlock';
import StatsBlock from './StatsBlock';
import TeamBlock from './TeamBlock';
import TimelineBlock from './TimelineBlock';
import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

export function renderPageBlock(block: AdminPageBlock, key: string) {
    switch (block.type) {
        case 'hero':
            return <HeroBlock key={key} block={block} />;
        case 'text':
            return <TextBlock key={key} block={block} />;
        case 'image-text':
            return <ImageTextBlock key={key} block={block} />;
        case 'stats':
            return <StatsBlock key={key} block={block} />;
        case 'team':
            return <TeamBlock key={key} block={block} />;
        case 'timeline':
            return <TimelineBlock key={key} block={block} />;
        default:
            return null;
    }
}