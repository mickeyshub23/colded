export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  optionValues?: string[];
  price: number;
  compareAtPrice?: number;
  sku?: string;
  inventoryQuantity: number;
  barcode?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  collectionId: string | null;
  name: string;
  handle: string;
  description: string;
  vendor: string;
  type: string;
  sku: string;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  inventoryQuantity: number;
  inventoryPolicy: 'deny' | 'allow';
  featuredImageUrl: string | null;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  collectionId: string | null;
  name: string;
  handle: string;
  description: string;
  vendor: string;
  type: string;
  sku: string;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  inventoryQuantity: number;
  inventoryPolicy: 'deny' | 'allow';
  featuredImageUrl: string | null;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
}

export interface Collection {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionInput {
  name: string;
  handle: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  published: boolean;
}

export interface AdminUser {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
}
