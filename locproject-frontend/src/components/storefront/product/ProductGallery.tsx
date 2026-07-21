import GalleryThumbnails from './GalleryThumbnails';

interface ProductGalleryProps {
    images: { url: string; alt: string }[];
    categoryName: string;
}

export default function ProductGallery({ images, categoryName }: ProductGalleryProps) {
    return <GalleryThumbnails images={images} />;
}