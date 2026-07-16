import { Product, ProductVariant } from './product';

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
  selectedVariant?: ProductVariant; // ✅ Ensure this exists
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
   variantId?: string; 
  // ✅ REMOVED: color parameter
}

export interface UpdateCartItemData {
  quantity: number;
  // ✅ REMOVED: color parameter
}

// ✅ ADDED: For guest cart (when user is not logged in)
export interface GuestCartItem {
  product: Product;
  quantity: number;
  price: number;
  // ✅ REMOVED: selectedColor field
}

export interface GuestCart {
  items: GuestCartItem[];
  totalPrice: number;
  totalItems: number;
}