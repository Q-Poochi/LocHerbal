export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  seq?: number;
  category: { name: string };
  variants: { id?: string; price: number; compareAtPrice?: number }[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  publishedAt: string;
  author: { fullName: string };
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string;
  dosage?: string;
  contraindications?: string;
  usageTips?: string;
  thumbnailUrl?: string;
  images: { url: string; alt: string }[];
  category: { id: string; name: string; slug: string };
  variants: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  specifications?: { label: string; value: string }[];
  benefits?: string[];
}

export interface ProductReview {
  id: string;
  author: { fullName: string; initials: string };
  rating: number;
  content: string;
  createdAt: string;
}

export interface CartItem {
  id?: string;
  productVariantId: string;
  qty: number;
  priceSnapshot?: number;
  unitPrice?: number;
  productNameSnapshot?: string;
  skuSnapshot?: string;
  variantName?: string;
  thumbnailUrl?: string | null;
  thumbnail?: string | null;
  variant?: {
    product?: {
      thumbnailUrl?: string | null;
      images?: Array<{ url?: string | null } | string | null> | null;
    } | null;
  } | null;
  product?: {
    product?: {
      images?: Array<{ url?: string | null } | string | null> | null;
    } | null;
  } | null;
}