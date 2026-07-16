// components/CartDrawer.tsx
'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useState, useEffect } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to safely get product name
const getProductName = (product: any): string => {
  if (typeof product === 'object' && product !== null) {
    return product.name || 'Unnamed Product';
  }
  return 'Product';
};

// Helper function to safely get product image
const getProductImage = (item: any): string | null => {
  const baseUrl = process.env.NEXT_PUBLIC_IMG_URL ;
  
  const formatImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Remove any leading slashes and 'uploads/' from the image path
    let cleanPath = imagePath;
    
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }
    
    // Remove 'uploads/' if it's at the beginning (after removing leading slash)
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.slice(8); // Remove 'uploads/'
    }
    
    // Now construct the URL - baseUrl already includes '/uploads'
    // So we don't need to add it again
    const fullUrl = `${baseUrl}/${cleanPath}`;
    console.log('🖼️ Constructed image URL:', fullUrl);
    return fullUrl;
  };
  
  let imageUrl = null;
  
  // Try product images array
  if (item.product?.images && item.product.images.length > 0) {
    const firstImage = item.product.images[0];
    if (firstImage.image) {
      imageUrl = formatImageUrl(firstImage.image);
      console.log('📸 Found product image:', firstImage.image);
    }
  }
  
  // Try variant image if selected and no product image found
  if (!imageUrl && item.selectedVariant?.images && item.selectedVariant.images.length > 0) {
    const firstVariantImage = item.selectedVariant.images[0];
    if (firstVariantImage.image) {
      imageUrl = formatImageUrl(firstVariantImage.image);
      console.log('🎨 Found variant image:', firstVariantImage.image);
    }
  }
  
  // Try ogImage
  if (!imageUrl && item.product?.ogImage) {
    imageUrl = formatImageUrl(item.product.ogImage);
    console.log('🖼️ Found ogImage:', item.product.ogImage);
  }
  
  console.log('🔍 Final image URL:', imageUrl);
  return imageUrl;
};

// Helper function to get max stock from variant or product
const getItemMaxStock = (item: any): number => {
  // If variant is selected, use variant stock
  if (item.selectedVariant?.stock !== undefined) {
    return item.selectedVariant.stock;
  }
  // Otherwise use product stock
  if (item.product?.stock !== undefined) {
    return item.product.stock;
  }
  return 999; // Default high number if no stock info
};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, updateCartItem, removeFromCart, clearCart, isGuest } = useCart();
  const router = useRouter();
  const [removingItems, setRemovingItems] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItems(prev => [...prev, itemId]);
    try {
      await removeFromCart(itemId);
    } finally {
      setRemovingItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const itemCount = cart.totalItems || 0;
  const subtotal = cart.totalPrice || 0;
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Cart ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Guest Warning */}
          {isGuest && (
            <div className="bg-[#D97A22]/10 border-b border-[#D97A22]/20 text-[#D97A22] px-4 py-1 text-xs">
              <p>
                🛒 Guest •{' '}
                <Link href="/signup" className="font-semibold underline hover:text-[#D97A22]/80">
                  Sign up to save
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3">
            {!cart.items || cart.items.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-600 mb-4">Your cart is empty</p>
                <button
                  onClick={onClose}
                  className="text-[#D97A22] hover:text-[#D97A22]/80 font-medium transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.slice(0, 4).map((item) => {
                  const imageUrl = getProductImage(item);
                  const productName = getProductName(item.product);
                  const maxStock = getItemMaxStock(item);
                  const isRemoving = removingItems.includes(item._id);
                  const hasImageError = imageErrors[item._id];
                  
                  return (
                    <div key={item._id} className="border-b border-gray-100 pb-3">
                      <div className="flex gap-2.5">
                        {/* Product Image */}
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                          {imageUrl && !hasImageError ? (
                            <Image
                              src={imageUrl}
                              alt={productName}
                              fill
                              sizes="56px"
                              className="object-contain"
                              onError={() => {
                                console.error('❌ Failed to load image:', imageUrl);
                                setImageErrors(prev => ({ ...prev, [item._id]: true }));
                              }}
                              onLoad={() => {
                                console.log('✅ Successfully loaded image:', imageUrl);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-medium text-xs text-gray-900 line-clamp-2 flex-1">
                              {productName}
                            </h3>
                            <button
                              onClick={() => handleRemoveItem(item._id)}
                              disabled={isRemoving}
                              className="text-gray-400 hover:text-red-600 disabled:opacity-50 -mt-1 -mr-1 p-1"
                              aria-label="Remove item"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Variant info */}
                          {item.selectedVariant && (
                            <p className="text-[#D97A22] text-[10px] font-medium mt-0.5">
                              {item.selectedVariant.variantName}
                            </p>
                          )}
                          
                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-gray-900 text-xs font-medium">₹{item.price || 0}</p>
                            
                            <div className="flex items-center border border-gray-200 rounded-md">
                              <button 
                                onClick={() => updateCartItem(item._id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isRemoving}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-[#D97A22] hover:bg-gray-50 disabled:opacity-30 text-sm"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartItem(item._id, item.quantity + 1)}
                                disabled={item.quantity >= maxStock || isRemoving}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-[#D97A22] hover:bg-gray-50 disabled:opacity-30 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show remaining items count if more than 4 */}
                {cart.items.length > 4 && (
                  <div className="text-center py-1">
                    <p className="text-xs text-gray-500">
                      +{cart.items.length - 4} more item{cart.items.length - 4 > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Clear Cart Link */}
                {cart.items.length > 0 && (
                  <div className="text-right pt-1">
                    <button
                      onClick={clearCart}
                      className="text-[10px] text-red-600 hover:text-red-800 font-medium transition-colors"
                    >
                      Clear Cart
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with totals and actions */}
        {cart.items && cart.items.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 shadow-md">
            {/* Order Summary */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="text-gray-900 font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Shipping</span>
                <span className="text-[#D97A22] font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Tax (5%)</span>
                <span className="text-gray-900">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-gray-200 mt-1">
                <span>Total</span>
                <span className="text-gray-900">₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-1.5">
              <button
                onClick={handleCheckout}
                className="w-full py-2.5 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] text-white hover:from-[#c56a1e] hover:via-[#c56a1e] hover:to-[#c56a1e]"
              >
                Proceed to Checkout
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}