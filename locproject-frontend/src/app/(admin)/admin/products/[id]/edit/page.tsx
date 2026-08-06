import ProductForm from '@/components/admin/products/ProductForm';

interface EditProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    await params;
    return <ProductForm />;
}