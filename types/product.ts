// types/product.ts - UPDATED WITH WEIGHT SUPPORT
export interface ProductImage {
  image: string;
  _id: string;
}

export interface ProductColor {
  name: string;
  code?: string; // hex color code: #FFFFFF
  stock: number;
  _id?: string;
}

export interface ProductVariant {
  variantName: string;
  variantSlug?: string;
  price: number;
  originalPrice?: number; // For variant-specific offers
  description?: string;
  // ✅ ADDED: Weight fields
  weight?: number;
  weightUnit?: 'gram' | 'kg' | 'ml' | 'liter' | 'piece';
  stock: number;
  images: ProductImage[];
  sku?: string;
  isDefault: boolean;
  status: 'active' | 'inactive' | 'out-of-stock';
  discountPercentage?: number; // Variant-specific discount
  features?: string[];
  _id?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
  _id?: string;
}

export interface Product {
  _id: string;
  sNo: number;
  name: string;
  slug: string;
  // ✅ UPDATED: Base price instead of price
  basePrice: number;
  
  // ✅ OFFER FIELDS - ADDED FOR PRODUCT-LEVEL OFFERS
  originalPrice?: number;
  discountPercentage?: number;
  hasOffer?: boolean;
  
  description: string;
  category: string | {
    _id: string;
    name: string;
    slug: string;
    description?: string;
  };
  rating: number;
  images: ProductImage[];
  seller: string;
  stock: number;
  numberOfReviews: number;
  
  // ✅ KEEP: Color variants
  colors?: ProductColor[];
  
  // ✅ ADDED: Product variants (combo packs) with weight support
  variants?: ProductVariant[];
  
  // ✅ ADDED: Specifications
  specifications?: ProductSpecification[];
  
  // ✅ ADDED: Key Features
  keyFeatures?: string[];
  
  metaTitle?: string;
  metaDescription?: string;
  // In CreateProductData and UpdateProductData:
metaKeywords?: string[] | string;  // ✅ Array OR comma-separated string
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  status: 'active' | 'inactive' | 'out-of-stock';
  featured: boolean;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  ratings?: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  success: boolean;
  count: number;
  data: Product[];
}

export interface RawApiResponse {
  success: boolean;
  count: number;
  data?: Product[];
  products?: Product[];
  message?: string;
}

export interface FilterOptions {
  category?: string;
  priceRange?: string;
  categories?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  // ✅ KEEP: Color filtering
  colors?: string[];
  featured?: boolean;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // ✅ ADDED: Offer-specific filters
  minDiscount?: number;
  maxDiscount?: number;
  hasOffer?: boolean;
}

export interface PriceRange {
  range: string;
  count: number;
  minPrice: number;
  maxPrice: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilteredProductsResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationInfo;
}

export interface FeaturedProductsResponse {
  success: boolean;
  count: number;
  data: Product[];
}

export interface PriceRangesResponse {
  success: boolean;
  data: PriceRange[];
}

// ✅ UPDATED: Product creation/update interfaces
export interface CreateProductData {
  name: string;
  // ✅ UPDATED: basePrice instead of price
  basePrice: number;
  
  // ✅ OFFER FIELDS
  originalPrice?: number;
  discountPercentage?: number;
  hasOffer?: boolean;
  
  description: string;
  category: string;
  seller: string;
  stock?: number;
  
  // ✅ KEEP: Color variants
  colors?: ProductColor[];
  
  // ✅ ADDED: Product variants with weight support
  variants?: ProductVariant[];
  
  specifications?: ProductSpecification[];
  keyFeatures?: string[];
  images?: File[];
  slug?: string;
  rating?: number;
  numberOfReviews?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: File | string;
  status?: 'active' | 'inactive' | 'out-of-stock';
  featured?: boolean;
  tags?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  _id: string;
}

// ✅ KEEP: Color filter option for frontend
export interface ColorFilterOption {
  name: string;
  code: string;
  count: number;
}

// ✅ ADDED: Product detail response
export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

// ✅ UPDATED: Cart product interface with selected variant
export interface CartProduct extends Omit<Product, 'colors' | 'variants'> {
  selectedColor?: ProductColor;
  selectedVariant?: ProductVariant; // Support for variant selection
  quantity: number;
}

// ✅ ADDED: API response for single product
export interface SingleProductResponse {
  success: boolean;
  data: Product;
}

// ✅ ADDED: Product creation response
export interface CreateProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

// ✅ ADDED: Offer calculation helper interface
export interface ProductOfferInfo {
  hasOffer: boolean;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  discountAmount: number;
}

// ✅ ADDED: Weight unit options
export type WeightUnit = 'gram' | 'kg' | 'ml' | 'liter' | 'piece';

// ✅ ADDED: Weight helper functions
export function formatWeight(weight: number, unit: WeightUnit): string {
  if (unit === 'gram' && weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} kg`;
  } else if (unit === 'ml' && weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} liter`;
  }
  return `${weight} ${unit}`;
}

// ✅ ADDED: Offer products response
export interface OfferProductsResponse {
  success: boolean;
  data: Product[];
  count: number;
}