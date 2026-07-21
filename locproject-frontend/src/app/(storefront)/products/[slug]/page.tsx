import Navbar from '../../../../components/storefront/layout/Navbar';
import Footer from '../../../../components/storefront/layout/Footer';
import ProductDetail from '../../../../components/storefront/product/ProductDetail';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    return (
        <>
            <Navbar />
            <ProductDetail slug={slug} />
            <Footer />
        </>
    );
}
