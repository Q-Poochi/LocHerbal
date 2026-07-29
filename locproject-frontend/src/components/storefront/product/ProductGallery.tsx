import GalleryThumbnails from './GalleryThumbnails';

interface ProductGalleryProps {
    images: { url: string; alt: string }[];
    categoryName: string;
    thumbnailUrl?: string;
}

export default function ProductGallery({ images, thumbnailUrl }: ProductGalleryProps) {
    return <GalleryThumbnails images={images} fallbackUrl={thumbnailUrl} />;
}