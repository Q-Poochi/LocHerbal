import ProductForm from '@/components/admin/products/ProductForm';

interface EditProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const { id } = await params;
    return <ProductForm />;
}