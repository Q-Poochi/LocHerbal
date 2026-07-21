import Image from 'next/image';
import Link from 'next/link';

interface RelatedProduct {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string;
    categoryName: string;
    price: number;
    compareAtPrice?: number;
}

const MOCK_RELATED: RelatedProduct[] = [
    {
        id: 'rp1',
        name: 'Cao Hồng Sâm LocHerbal Nguyên Chất',
        slug: 'cao-hong-sam-locherbal-nguyen-chat',
        thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaNdKG9TWx9PyZ-vrlohFpeaQlRn2oUXcYtwWzO9EU1LzXZtF14eyu-B3cA4K05egjoZaFdbcDOyTm_mpn7lCSrz2wQ5megbKyE2LmKboToT4PqKYI4r-W_zOh3AzWgpataLymWpMzlIpJyzmT-_ES6e0QBnL_JQKqmuRGUC2VGdM2FHvJqErVD7hLYuItEq5RqgPhpCzaSCZVP0ScfsT-87sv-BJ3bEKeHNDCTiYkkHQYVsomTg',
        categoryName: 'Bồi bổ sức khỏe',
        price: 550000,
        compareAtPrice: 650000,
    },
    {
        id: 'rp2',
        name: 'Trà Thảo Mộc An Thần Ngủ Ngon',
        slug: 'tra-thao-moc-an-than-ngu-ngon',
        thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-eKSTcn4PNv7NVZuy78Rm5HQT_EqxC4IPSM6kbMINaE7rXxawv2LPwg6mAWblI6NWs0AIaQI4nVxx7PknpxzKenXuOMBMnFhc41Wf7WP7dZHlAToa84kPxY--HL7T6h3YVQ26p0FaQNqSAoeNFUNuyJb6j_EbFYoz31N1CnlI_7eVyHpcwN-Ie0Y6GXldnFFRSHelkoxh-dcDvL0obgDyfi3Kt4QpnpUdE9ANnZ_e9KvYk2GWxA',
        categoryName: 'Trà Thảo Mộc',
        price: 180000,
    },
    {
        id: 'rp3',
        name: 'Viên Uống Giải Độc Gan Cà Gai Leo',
        slug: 'vien-uong-giai-doc-gan-ca-gai-leo',
        thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsgfBipoel139l_OpyRdIOIv4BpRykIe1_Lv3MEajHfNeXfe33-pDjTURM7GUe6ijCWM3LxmkFWjrjJZKkUxy5vWSQw0ZKw-f9GloseeY9tF5gxgLN-but1ZKTPgfrk4QN7aj0dbJWyBHhGxytJ5oX4keYZ9L7WPamV_gm8cOiIXIOlu4pe-vZxGwKwt7UoLHYuhK4fH2CCvFHNJzcqq5T2Zj8xKg9TICf8MSxj6BFG2gzYdo0Zg',
        categoryName: 'Giải độc gan',
        price: 320000,
        compareAtPrice: 400000,
    },
    {
        id: 'rp4',
        name: 'Set Quà Tặng Sức Khỏe Hoàng Gia',
        slug: 'set-qua-tang-suc-khoe-hoang-gia',
        thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoEakOt9AVcL5h7-I6bLGkbzp_hbXWE_m3C8aAebH-XXN4Iv-aamD8ZGSiiEOOJV2dr9pBiO-cR3FhMqobeA-q9zFJrXfdEs9O2AAZlYdaYwIyUrBO50d37yV1g_CvdIETYyjMlMkOkNnc9euM1VRQALvmTPBC5cahZyQBvtdBwMhutm_-z49ESWRMCqxq9tY93-4WKkpoK51zRFAsALzNfJi_CJAfVB2qaw7RbQeK2fXQsZlBhg',
        categoryName: 'Combo Quà Tặng',
        price: 1250000,
    },
];

function formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
}

export default function RelatedProducts() {
    return (
        <section className="mb-16">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Sản phẩm liên quan</h2>
                    <p className="text-on-surface-variant">Có thể bạn cũng quan tâm đến các loại thảo dược khác</p>
                </div>
                <Link href="/products" className="text-primary font-bold flex items-center gap-1 hover:underline">
                    Xem tất cả
                    <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_RELATED.map((product) => (
                    <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="bg-surface-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant/30 hover:-translate-y-1 transition-all block group"
                    >
                        <div className="aspect-square relative overflow-hidden">
                            <Image
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                src={product.thumbnailUrl}
                                alt={product.name}
                                fill
                            />
                            <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-outline hover:text-error transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">favorite</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            <p className="text-caption text-outline font-bold uppercase tracking-tighter">{product.categoryName}</p>
                            <h3 className="font-bold text-primary line-clamp-2 min-h-[48px]">{product.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-primary font-bold">{formatPrice(product.price)}</span>
                                {product.compareAtPrice && (
                                    <span className="text-caption text-outline line-through">{formatPrice(product.compareAtPrice)}</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}