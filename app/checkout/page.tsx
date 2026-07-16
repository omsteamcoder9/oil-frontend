'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  createRazorpayOrder, 
  verifyPayment, 
  createGuestOrder, 
  createUserOrder 
} from '@/lib/payment-api';

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): RazorpayInstance;
    };
  }
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void> | void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    orderId: string;
    address: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayErrorResponse) => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface PublicSettings {
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  cashOnDeliveryEnabled: boolean;
  contactNumber: string;
  contactEmail: string;
  companyAddress: string;
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  footerText: string;
  footerLinks: Array<{name: string; url: string}>;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  maintenanceMode: boolean;
  metaKeywords: string[];
  googleAnalyticsId: string;
  updatedAt: Date;
}

export default function CheckoutPage() {
  const { cart, clearCart, setBuyNowMode } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNowParam = searchParams.get('buyNow');

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<{
    razorpayEnabled: boolean; 
    razorpayKeyId: string;
    cashOnDeliveryEnabled: boolean
  }>({
    razorpayEnabled: false,
    razorpayKeyId: '',
    cashOnDeliveryEnabled: true
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  const [buyNowOrder, setBuyNowOrder] = useState<any>(null);
  const [isBuyNowMode, setIsBuyNowMode] = useState(false);
  const [checkingBuyNow, setCheckingBuyNow] = useState(true);

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user, formData.email]);

  useEffect(() => {
    if (isBuyNowParam === 'true') {
      const storedOrder = sessionStorage.getItem('buyNowOrder');
      console.log('🔍🔍🔍 DEBUG: storedOrder from sessionStorage:', storedOrder);
      if (storedOrder) {
        try {
          const order = JSON.parse(storedOrder);
          console.log('🔍🔍🔍 DEBUG: Parsed buyNowOrder:', order);
          setBuyNowOrder(order);
          setIsBuyNowMode(true);
          if (setBuyNowMode) {
            setBuyNowMode(true);
          }
        } catch (e) {
          console.error('Error parsing buyNowOrder:', e);
        }
      } else {
        console.log('🔍🔍🔍 DEBUG: No storedOrder found in sessionStorage');
      }
    }
    setCheckingBuyNow(false);
  }, [isBuyNowParam, setBuyNowMode]);

  useEffect(() => {
    if (checkingBuyNow) return;
    if (!isBuyNowMode && cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart.items.length, router, isBuyNowMode, checkingBuyNow]);

  useEffect(() => {
    if (user && !token) {
      setAuthError('Authentication token is missing. Please log in again.');
    } else {
      setAuthError('');
    }
  }, [user, token]);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setSettingsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      const response = await fetch(`${API_URL}/settings/public`);
      const data = await response.json();
      
      if (data.success) {
        const settings: PublicSettings = data.data;
        setPaymentSettings({
          razorpayEnabled: settings.razorpayEnabled,
          razorpayKeyId: settings.razorpayKeyId || '',
          cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAuthError = () => {
    setAuthError('Your session has expired. Please log in again.');
  };

  const getDisplayItems = () => {
    if (isBuyNowMode && buyNowOrder) {
      return buyNowOrder.items;
    }
    return cart.items;
  };

  const getSubtotal = () => {
    if (isBuyNowMode && buyNowOrder) {
      return buyNowOrder.totalAmount;
    }
    return cart.totalPrice || 0;
  };

  const getItemCount = () => {
    if (isBuyNowMode && buyNowOrder) {
      return buyNowOrder.items.length;
    }
    return cart.totalItems || 0;
  };

  const handleRazorpayPayment = async (): Promise<void> => {
    console.log('🚨🚨🚨 INSIDE handleRazorpayPayment - BEFORE ANYTHING ELSE 🚨🚨🚨');
    console.log('isBuyNowMode:', isBuyNowMode);
    console.log('buyNowOrder:', buyNowOrder);
    console.log('cart.items:', cart.items);
    console.log('getDisplayItems():', getDisplayItems());
    try {
      setPaymentLoading(true);
      setAuthError('');

      if (!paymentSettings.razorpayEnabled) {
        alert('Razorpay payment is currently disabled. Please use manual payment.');
        setPaymentLoading(false);
        return;
      }

      if (!paymentSettings.razorpayKeyId) {
        alert('Razorpay configuration is incomplete. Please contact the store administrator.');
        setPaymentLoading(false);
        return;
      }

      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.phone || !formData.address || !formData.city || 
          !formData.state || !formData.pincode) {
        alert('Please fill all the required fields');
        setPaymentLoading(false);
        return;
      }

      if (user && !token) {
        handleAuthError();
        setPaymentLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setPaymentLoading(false);
        return;
      }

      let orderId: string;
      let finalAmount: number;
      const displayItems = getDisplayItems();

      try {
        const shippingAddress = {
          fullName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.pincode,
          country: formData.country
        };

        if (user && token) {
          if (!token) {
            handleAuthError();
            setPaymentLoading(false);
            return;
          }

          const orderData: any = {
            products: displayItems.map((item: any) => ({
              product: item.product._id,
              variantId: item.selectedVariant?._id,
              variantName: item.selectedVariant?.variantName,
              price: item.price,
              quantity: item.quantity,
              weight: item.weight || item.selectedVariant?.weight || 0,        // ✅ Include weight
              weightUnit: item.weightUnit || item.selectedVariant?.weightUnit || 'gram' // ✅ Include weight unit
            })),
            shippingAddress: shippingAddress,
            paymentMethod: 'razorpay' as const
          };

          if (isBuyNowMode) {
            orderData.skipCartClear = true;
          }

          console.log('Creating user order with data:', orderData);
          const orderResult = await createUserOrder(orderData, token);
          orderId = orderResult.orderId;
          finalAmount = orderResult.finalAmount;
        } else {
          const orderData: any = {
            products: displayItems.map((item: any) => ({
              product: item.product._id,
              variantId: item.selectedVariant?._id,
              variantName: item.selectedVariant?.variantName,
              price: item.price,
              quantity: item.quantity,
              weight: item.weight || item.selectedVariant?.weight || 0,        // ✅ Include weight
              weightUnit: item.weightUnit || item.selectedVariant?.weightUnit || 'gram' // ✅ Include weight unit
            })),
            shippingAddress: shippingAddress,
            guestUser: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              phone: formData.phone
            },
            paymentMethod: 'razorpay' as const
          };

          if (isBuyNowMode) {
            orderData.skipCartClear = true;
          }

          console.log('Creating guest order with data:', orderData);
          const orderResult = await createGuestOrder(orderData);
          orderId = orderResult.orderId;
          finalAmount = orderResult.finalAmount;
        }

        console.log('Database order created with ID:', orderId, 'Final amount:', finalAmount);

        const razorpayOrder = await createRazorpayOrder(orderId);

        if (!razorpayOrder || !razorpayOrder.id || !razorpayOrder.amount) {
          console.error('Invalid Razorpay order:', razorpayOrder);
          throw new Error('Invalid Razorpay order response - missing required fields');
        }

        console.log('Razorpay order created:', razorpayOrder);

        const razorpayKey = paymentSettings.razorpayKeyId;

        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: 'Beauty Care',
          description: 'Order Payment',
          image: '/logo2.png',
          order_id: razorpayOrder.id,
          handler: async function (response: RazorpayResponse) {
            try {
              console.log('Razorpay payment response:', response);
              
              const verificationData = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              };

              console.log('Verifying payment with data:', verificationData);
              const verificationResult = await verifyPayment(verificationData);

              if (verificationResult.success) {
                console.log('Payment verified successfully');
                
                if (isBuyNowMode) {
                  sessionStorage.removeItem('buyNowOrder');
                } else {
                  clearCart();
                }
                
                if (user && token) {
                  console.log('Redirecting logged-in user to profile page with orderId:', orderId);
                  window.location.href = `/profile?orderSuccess=true&orderId=${orderId}`;
                } else {
                  console.log('Redirecting guest user to order success page with orderId:', orderId);
                  window.location.href = `/order-success?orderId=${orderId}`;
                }
              } else {
                console.error('Payment verification failed');
                alert('Payment verification failed. Please contact support.');
                setPaymentLoading(false);
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              alert('Payment processing failed. Please contact support.');
              setPaymentLoading(false);
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            orderId: orderId,
            address: formData.address,
          },
          theme: {
            color: '#D97A22',
          },
          modal: {
            ondismiss: function() {
              setPaymentLoading(false);
              alert('Payment cancelled. You can try again.');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function (response: RazorpayErrorResponse) {
          console.error('Payment failed:', response.error);
          alert(`Payment failed: ${response.error.description}`);
          setPaymentLoading(false);
        });

        razorpay.open();

      } catch (orderError: unknown) {
        console.error('Order creation error:', orderError);
        
        const errorMessage = orderError instanceof Error ? orderError.message : 'Unknown error occurred';
        
        if (errorMessage.includes('token') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
          handleAuthError();
        } else {
          alert(errorMessage || 'Failed to create order. Please try again.');
        }
        setPaymentLoading(false);
      }
      
    } catch (error: unknown) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed. Please try again.';
      alert(errorMessage);
      setPaymentLoading(false);
    }
  };

  const handleCashOnDelivery = async (): Promise<void> => {
    try {
      setLoading(true);
      setAuthError('');

      if (!paymentSettings.cashOnDeliveryEnabled) {
        alert('manual payment is currently disabled. Please use Razorpay payment.');
        setLoading(false);
        return;
      }

      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.phone || !formData.address || !formData.city || 
          !formData.state || !formData.pincode) {
        alert('Please fill all the required fields');
        setLoading(false);
        return;
      }

      if (user && !token) {
        handleAuthError();
        setLoading(false);
        return;
      }

      const shippingAddress = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.pincode,
        country: formData.country
      };

      let orderId: string;
      const displayItems = getDisplayItems();
      
      if (user && token) {
        if (!token) {
          handleAuthError();
          setLoading(false);
          return;
        }

        const orderData: any = {
          products: displayItems.map((item: any) => ({
            product: item.product._id,
            variantId: item.selectedVariant?._id,
            variantName: item.selectedVariant?.variantName,
            price: item.price,
            quantity: item.quantity,
            weight: item.weight || item.selectedVariant?.weight || 0,        // ✅ Include weight
            weightUnit: item.weightUnit || item.selectedVariant?.weightUnit || 'gram' // ✅ Include weight unit
          })),
          shippingAddress: shippingAddress,
          paymentMethod: 'cod' as const
        };

        if (isBuyNowMode) {
          orderData.skipCartClear = true;
        }

        console.log('Creating COD user order:', orderData);
        const orderResult = await createUserOrder(orderData, token);
        orderId = orderResult.orderId;
      } else {
        const orderData: any = {
          products: displayItems.map((item: any) => ({
            product: item.product._id,
            variantId: item.selectedVariant?._id,
            variantName: item.selectedVariant?.variantName,
            price: item.price,
            quantity: item.quantity,
            weight: item.weight || item.selectedVariant?.weight || 0,        // ✅ Include weight
            weightUnit: item.weightUnit || item.selectedVariant?.weightUnit || 'gram' // ✅ Include weight unit
          })),
          shippingAddress: shippingAddress,
          guestUser: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone
          },
          paymentMethod: 'cod' as const
        };

        if (isBuyNowMode) {
          orderData.skipCartClear = true;
        }

        console.log('Creating COD guest order:', orderData);
        const orderResult = await createGuestOrder(orderData);
        orderId = orderResult.orderId;
      }

      if (isBuyNowMode) {
        sessionStorage.removeItem('buyNowOrder');
      } else {
        clearCart();
      }
      
      console.log('COD order created successfully');
      window.location.href = `/order-success?orderId=${orderId}`;
      
    } catch (error: unknown) {
      console.error('COD order error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Order creation failed. Please try again.';
      
      if (errorMessage.includes('token') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        handleAuthError();
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading || checkingBuyNow) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97A22] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const displayItems = getDisplayItems();
  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const tax = subtotal * 0.05;
  const shippingFee = 0;
  const total = subtotal + tax + shippingFee;

  if (displayItems.length === 0 && !settingsLoading && !checkingBuyNow) {
    router.push('/cart');
    return null;
  }

  const isAnyPaymentMethodAvailable = paymentSettings.razorpayEnabled || paymentSettings.cashOnDeliveryEnabled;

  if (!isAnyPaymentMethodAvailable) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Payment Methods Available</h2>
            <p className="text-gray-600 mb-4">All payment methods are currently disabled. Please contact the store administrator.</p>
            <button
              onClick={() => router.push('/cart')}
              className="px-6 py-3 bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] text-white font-medium rounded-lg hover:from-[#c56a1e] hover:via-[#c56a1e] hover:to-[#c56a1e] transition-all duration-200"
            >
              Return to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
          {!user && !isBuyNowMode && (
            <div className="bg-gradient-to-r from-[#D97A22]/10 via-[#D97A22]/10 to-[#D97A22]/10 border border-[#D97A22]/20 text-[#D97A22] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
              <p>
                🛒 Shopping as Guest •{' '}
                <Link href="/signup" className="font-semibold underline hover:text-[#D97A22] transition-colors duration-200">
                  Create account for faster checkout
                </Link>
              </p>
            </div>
          )}
          {isBuyNowMode && (
            <div className="bg-gradient-to-r from-[#D97A22]/10 via-[#D97A22]/10 to-[#D97A22]/10 border border-[#D97A22]/20 text-[#D97A22] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
              <p>
                ⚡ Buy Now Mode • Checking out this item only
              </p>
            </div>
          )}
        </div>

        {authError && (
          <div className="mb-4 sm:mb-6 bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm sm:text-base">{authError}</span>
            </div>
            <div className="mt-2">
              <Link href="/login" className="text-red-600 underline font-semibold hover:text-red-700 transition-colors duration-200 text-sm sm:text-base">
                Click here to log in again
              </Link>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 border border-gray-300">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              {user ? 'Shipping Information' : 'Guest Checkout'}
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                  placeholder="Enter your complete address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                    placeholder="PIN Code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D97A22] focus:border-[#D97A22] transition-all duration-200"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 border border-gray-300">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {displayItems.map((item: any) => {
                  const itemWeight = item.weight || item.selectedVariant?.weight || 0;
                  const itemWeightUnit = item.weightUnit || item.selectedVariant?.weightUnit || 'gram';
                  const weightDisplay = itemWeight > 0 ? `${itemWeight} ${itemWeightUnit}` : '';
                  
                  return (
                    <div key={item.product._id} className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        {item.selectedVariant && (
                          <p className="text-xs text-[#D97A22] font-medium">📦 Pack: {item.selectedVariant.variantName}</p>
                        )}
                        {weightDisplay && (
                          <p className="text-xs text-gray-500">⚖️ Weight: {weightDisplay}</p>
                        )}
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm sm:text-base">₹{((item.price || 0) * item.quantity).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Shipping</span>
                  <span className="text-[#D97A22]">FREE</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Tax (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span className="text-gray-800">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 border border-gray-300">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="space-y-4">
                {paymentSettings.razorpayEnabled && (
                  <button
                    onClick={handleRazorpayPayment}
                    disabled={paymentLoading || loading || !!authError || !paymentSettings.razorpayKeyId}
                    className="w-full bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] text-white py-3 rounded-lg hover:from-[#c56a1e] hover:via-[#c56a1e] hover:to-[#c56a1e] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-[#D97A22]/25 cursor-pointer text-sm sm:text-base"
                  >
                    {!paymentSettings.razorpayKeyId ? (
                      'Razorpay Configuration Required'
                    ) : paymentLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `Pay ₹${total.toFixed(2)}`
                    )}
                  </button>
                )}

                {paymentSettings.cashOnDeliveryEnabled && (
                  <button
                    onClick={handleCashOnDelivery}
                    disabled={loading || paymentLoading || !!authError}
                    className="w-full border border-[#D97A22] text-[#D97A22] py-3 rounded-lg hover:bg-gradient-to-r hover:from-[#D97A22] hover:via-[#D97A22] hover:to-[#D97A22] hover:text-white transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:shadow-lg text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-[#D97A22] mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Cash On Delivery'
                    )}
                  </button>
                )}

                {!paymentSettings.razorpayEnabled && !paymentSettings.cashOnDeliveryEnabled && (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-700">No payment methods are currently available. Please contact support.</p>
                  </div>
                )}
              </div>

              {paymentSettings.razorpayEnabled && !paymentSettings.razorpayKeyId && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xs sm:text-sm text-yellow-700">
                      Razorpay is enabled but not fully configured. Admin needs to add Razorpay Key ID in settings.
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-gradient-to-r from-[#D97A22]/10 via-[#D97A22]/10 to-[#D97A22]/10 rounded-lg border border-[#D97A22]/20">
                {user ? (
                  <div className="flex items-center space-x-2 text-[#D97A22]">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs sm:text-sm">Logged in as {user.name}</span>
                    {!token && (
                      <span className="text-xs text-red-600">(Token missing!)</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-[#D97A22]">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs sm:text-sm">Checking out as guest</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}