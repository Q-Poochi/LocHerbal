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
  dosage: string;
  contraindications: string;
  thumbnailUrl?: string;
  images: { url: string; alt: string }[];
  category: { id: string; name: string; slug: string };
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  specifications?: { label: string; value: string }[];
  benefits?: string[];
  usageTips: string;
}

export interface ProductReview {
  id: string;
  author: { fullName: string; initials: string };
  rating: number;
  content: string;
  createdAt: string;
}