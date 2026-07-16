'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useState, useEffect, useRef } from 'react';
import { quickSearchProducts } from '@/lib/productService';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { settingsAPI } from '@/lib/settings-api';
import CartDrawer from '@/components/CartDrawer';

interface Category {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  image: string | null;
  category: string;
  featured: boolean;
}

interface HeaderClientProps {
  initialCategories: Category[];
}

export default function HeaderClient({ initialCategories }: HeaderClientProps) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteNameMain, setSiteNameMain] = useState('');
  const [siteNameTagline, setSiteNameTagline] = useState('');
  
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Dynamic contact information state
  const [contactEmail, setContactEmail] = useState('hello@beautycare.com');
  const [phoneNumbersList, setPhoneNumbersList] = useState<string[]>(['+91 98765 43210']);
  const [phoneIndex, setPhoneIndex] = useState(0);
  const [isLoadingContact, setIsLoadingContact] = useState(true);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
 
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load site settings and contact info
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await settingsAPI.getPublicSettings();
        if (response.success && response.data) {
          const settings = response.data;
          
          // Site name setup
          if (settings.siteName && settings.siteName.trim() !== '') {
            const nameParts = settings.siteName.trim().split(' ');
            
            setSiteNameMain(nameParts[0]);
            
            if (nameParts.length > 1) {
              setSiteNameTagline(nameParts.slice(1).join(' '));
            } else {
              setSiteNameTagline('');
            }
          }
          
          // Set contact email from settings
          if (settings.contactEmail && settings.contactEmail.trim() !== '') {
            setContactEmail(settings.contactEmail);
          }
          
          // Set phone numbers from settings
          const phoneNumbers: string[] = [];
          
          // Add contact number if available
          if (settings.contactNumber && settings.contactNumber.trim() !== '') {
            phoneNumbers.push(settings.contactNumber);
          }
          
          // Add WhatsApp number if available and different from contact number
          if (settings.whatsappNumber && settings.whatsappNumber.trim() !== '' && 
              settings.whatsappNumber !== settings.contactNumber) {
            phoneNumbers.push(settings.whatsappNumber);
          }
          
          // Add call number if available and different from others
          if (settings.callNumber && settings.callNumber.trim() !== '' && 
              settings.callNumber !== settings.contactNumber && 
              settings.callNumber !== settings.whatsappNumber) {
            phoneNumbers.push(settings.callNumber);
          }
          
          // If we have phone numbers from settings, use them
          if (phoneNumbers.length > 0) {
            setPhoneNumbersList(phoneNumbers);
          }
          // Otherwise keep the default phone number
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
      } finally {
        setIsLoadingContact(false);
      }
    };

    loadSiteSettings();
  }, []);

  // Phone number carousel effect
  useEffect(() => {
    if (phoneNumbersList.length <= 1) return;
    
    const interval = setInterval(() => {
      setPhoneIndex((prev) => (prev + 1) % phoneNumbersList.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phoneNumbersList.length]);

  const getLogoLines = () => {
    if (!siteNameMain || siteNameMain.trim() === '') {
      return { first: '', second: '' };
    }
    
    if (siteNameMain && siteNameTagline) {
      return { 
        first: siteNameMain, 
        second: siteNameTagline 
      };
    }
    
    const nameParts = siteNameMain.trim().split(' ');
    if (nameParts.length > 1) {
      return { 
        first: nameParts[0], 
        second: nameParts.slice(1).join(' ') 
      };
    }
    
    return { 
      first: nameParts[0], 
      second: '' 
    };
  };

  const { first: logoFirstLine, second: logoSecondLine } = getLogoLines();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsFooterVisible(true);
      } else {
        setIsFooterVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await quickSearchProducts(searchQuery, 5);
        if (response.success) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearchClick = () => {
    setShowSearch(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleProductClick = (product: SearchProduct) => {
    router.push(`/products/${product.slug}`);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const firstTwoCategories = initialCategories.slice(0, 2);
  const remainingCategories = initialCategories.slice(2);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
      
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(event.target as Node)) {
        setShowShopDropdown(false);
      }
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
          setSearchResults([]);
        }
        if (showShopDropdown) {
          setShowShopDropdown(false);
        }
        if (isCartOpen) {
          setIsCartOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showSearch, showShopDropdown, isMobileMenuOpen, isCartOpen]);

  const getCartItemCount = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const cartItemsCount = getCartItemCount();

  return (
    <>

      <div className="xl:sticky xl:top-0 z-40">
   
        <header className="bg-[#4A2C1A] text-[#F7F2E8] font-['Gelasio']">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between h-20 sm:h-24 md:h-28 lg:h-18">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="xl:hidden p-2 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 hover:bg-[#F7F2E8]/10 rounded-xl cursor-pointer"
                  aria-label="Toggle mobile menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <Link href="/" className="flex items-center group cursor-pointer">
                  <div className="relative w-15 h-15 -ml-2 sm:w-16 sm:h-16 md:w-20 md:h-0 lg:w-20 lg:h-20  transition-transform duration-200 group-hover:scale-105 mt-1 mr-2">
                    <Image
                      src="/images/logo.png"
                      alt={siteNameMain || 'Logo'}
                      fill
                      priority
                      className="object-contain"
                
                    />
                  </div>
                  
                  {logoFirstLine && (
                    <div className="flex flex-col justify-center ml-1.5 sm:ml-2">
                      <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-serif font-gray-600 tracking-tighter leading-none text-[#F7F2E8] drop-shadow-md">
                        {logoFirstLine}
                      </span>
                      
                      {logoSecondLine && (
                        <div className="flex items-center mt-0.5 ml-2 sm:ml-5">
                          <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm font-sans font-bold uppercase tracking-wider text-[#D97A22]">
                            {logoSecondLine}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              </div>

              <nav className="hidden xl:flex items-center space-x-5 2xl:space-x-8">
                <Link 
                  href="/" 
                  className="text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 font-medium px-4 py-2.5 rounded-xl hover:bg-[#F7F2E8]/10 border-b-2 border-transparent hover:border-[#D97A22]/50 text-sm 2xl:text-base cursor-pointer"
                >
                  Home
                </Link>
                
                {firstTwoCategories.map((category) => (
                  <Link 
                    key={category._id}
                    href={`/products?category=${category.slug}`}
                    className="text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 font-medium px-4 py-2.5 rounded-xl hover:bg-[#F7F2E8]/10 border-b-2 border-transparent hover:border-[#D97A22]/50 text-sm 2xl:text-base cursor-pointer"
                  >
                    {category.name}
                  </Link>
                ))}
                
                {remainingCategories.length > 0 && (
                  <div ref={shopDropdownRef} className="relative">
                    <button
                      onClick={() => setShowShopDropdown(!showShopDropdown)}
                      className="flex items-center space-x-1 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 font-medium px-4 py-2.5 rounded-xl hover:bg-[#F7F2E8]/10 border-b-2 border-transparent hover:border-[#D97A22]/50 text-sm 2xl:text-base cursor-pointer"
                    >
                      <span>Products</span>
                      <svg
                        className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 ${showShopDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                  {showShopDropdown && (
  <div className="absolute top-full left-0 mt-2 w-52 bg-[#4A2C1A] rounded-xl shadow-2xl py-2 z-50 border border-[#D97A22]/30">
    <div className="px-4 py-2.5 border-b border-[#D97A22]/30">
      <p className="text-[#D97A22] font-bold text-sm tracking-wide">Shop Categories</p>
    </div>
    
    {remainingCategories.map((category) => (
      <Link
        key={category._id}
        href={`/products?category=${category.slug}`}
        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-[#F7F2E8] hover:bg-[#F97A22]/10 hover:text-[#D97A22] transition-all duration-300 cursor-pointer"
        onClick={() => setShowShopDropdown(false)}
      >
        <svg className="w-4 h-4 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span>{category.name}</span>
      </Link>
    ))}
    
    <Link
      href="/products"
      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-[#F7F2E8] hover:bg-[#F97A22]/10 hover:text-[#D97A22] transition-all duration-300 cursor-pointer border-t border-[#D97A22]/30 mt-1"
      onClick={() => setShowShopDropdown(false)}
    >
      <svg className="w-4 h-4 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="font-medium">View All Products</span>
    </Link>
  </div>
)}
                  </div>
                )}
                
                <Link 
                  href="/about" 
                  className="text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 font-medium px-4 py-2.5 rounded-xl hover:bg-[#F7F2E8]/10 border-b-2 border-transparent hover:border-[#D97A22]/50 text-sm 2xl:text-base cursor-pointer"
                >
                  About
                </Link>
                
                <Link 
                  href="/contact" 
                  className="text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 font-medium px-4 py-2.5 rounded-xl hover:bg-[#F7F2E8]/10 border-b-2 border-transparent hover:border-[#D97A22]/50 text-sm 2xl:text-base cursor-pointer"
                >
                  Contact
                </Link>
              </nav>

        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 justify-end">
  <div ref={searchContainerRef} className="relative flex items-center">
    {showSearch ? (
      <div className="fixed inset-0 xl:relative xl:inset-auto z-50 flex items-center justify-center xl:block">
        <div className="xl:hidden fixed inset-0 bg-[#4A2C1A] pt-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex items-center bg-[#F7F2E8]/10 backdrop-blur-sm rounded-xl px-4 py-2 mt-10 border border-[#D97A22]/30">
                <svg className="w-5 h-5 text-[#F7F2E8] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories..."
                  className="flex-1 bg-transparent text-[#F7F2E8] focus:outline-none text-base placeholder-[#F7F2E8]/60 w-full"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ml-2 p-1 text-[#F7F2E8]/70 hover:text-[#F7F2E8] rounded-full hover:bg-[#F7F2E8]/10"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                onClick={handleSearchSubmit}
                className="p-3 bg-[#F7F2E8]/10 backdrop-blur-sm hover:bg-[#F7F2E8]/20 text-[#F7F2E8] rounded-xl transition-all duration-300 flex items-center justify-center mt-10 border border-[#D97A22]/30 hover:scale-105 hover:shadow-lg"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-3 text-[#F7F2E8]/70 hover:text-[#F7F2E8] hover:bg-[#F7F2E8]/10 rounded-xl transition-all duration-300 mt-10 border border-[#D97A22]/30"
                aria-label="Close search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(searchResults.length > 0 || isSearching) && (
              <div className="bg-[#4A2C1A] border border-[#D97A22]/30 rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-[#F7F2E8]">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D97A22] mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-2">
                      <p className="text-xs text-[#F7F2E8]/70 font-medium px-2 py-1 border-b border-[#D97A22]/30">Search Results</p>
                      {searchResults.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center p-2 hover:bg-[#F7F2E8]/10 rounded-xl cursor-pointer transition-colors"
                          onClick={() => handleProductClick(product)}
                        >
                          <div className="w-12 h-12 bg-[#F7F2E8]/10 rounded-xl flex-shrink-0 overflow-hidden border border-[#D97A22]/30 relative">
                            {product.image ? (
                              <Image
                                src={`${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`}
                                className="w-full h-full object-cover"
                                alt={product.name}
                                fill
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#F7F2E8]/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#F7F2E8]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F7F2E8] truncate">{product.name}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#D97A22]">{product.category}</p>
                              <p className="text-[#F7F2E8] font-medium text-sm">₹{product.basePrice}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="border-t border-[#D97A22]/30 p-3 bg-[#F7F2E8]/5 hover:bg-[#F7F2E8]/10 cursor-pointer text-center rounded-b-xl transition-all duration-300"
                      onClick={handleViewAllResults}
                    >
                      <p className="text-sm font-medium text-[#F7F2E8] hover:text-[#D97A22]">
                        View all results for &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="hidden xl:block absolute top-0 xl:relative w-full max-w-[90vw] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:w-80 2xl:w-96 mx-auto xl:mx-0">
          <div className="bg-[#F7F2E8]/10 backdrop-blur-sm rounded-xl shadow-xl border border-[#D97A22]/30 p-2 xl:p-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-[#F7F2E8]/5 rounded-lg px-3 py-1.5 border border-[#D97A22]/30">
                <svg className="w-4 h-4 text-[#F7F2E8]/70 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories..."
                  className="flex-1 bg-transparent text-[#F7F2E8] focus:outline-none text-sm md:text-base placeholder-[#F7F2E8]/60 w-full min-w-0"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ml-1 p-0.5 text-[#F7F2E8]/70 hover:text-[#F7F2E8] rounded-full hover:bg-[#F7F2E8]/10"
                    aria-label="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            
              <button
                type="submit"
                className="p-2 bg-[#F7F2E8]/10 hover:bg-[#F7F2E8]/20 text-[#F7F2E8] rounded-lg transition-all duration-300 flex items-center justify-center border border-[#D97A22]/30 hover:scale-105 hover:shadow-lg"
                aria-label="Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {(searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#4A2C1A] border border-[#D97A22]/30 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-[#F7F2E8]">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D97A22] mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-2">
                      <p className="text-xs text-[#F7F2E8]/70 font-medium px-2 py-1 border-b border-[#D97A22]/30">Search Results</p>
                      {searchResults.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center p-2 hover:bg-[#F7F2E8]/10 rounded-xl cursor-pointer transition-colors"
                          onClick={() => handleProductClick(product)}
                        >
                          <div className="w-10 h-10 bg-[#F7F2E8]/10 rounded-lg flex-shrink-0 overflow-hidden border border-[#D97A22]/30 relative">
                            {product.image ? (
                              <Image
                                src={`${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`}
                                className="w-full h-full object-cover"
                                alt={product.name}
                                fill
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#F7F2E8]/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-[#F7F2E8]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F7F2E8] truncate">{product.name}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#D97A22]">{product.category}</p>
                              <p className="text-[#F7F2E8] font-medium text-sm">₹{product.basePrice}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="border-t border-[#D97A22]/30 p-3 bg-[#F7F2E8]/5 hover:bg-[#F7F2E8]/10 cursor-pointer text-center rounded-b-xl transition-all duration-300"
                      onClick={handleViewAllResults}
                    >
                      <p className="text-sm font-medium text-[#F7F2E8] hover:text-[#D97A22]">
                        View all results for &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ) : (
      <button 
        onClick={handleSearchClick}
        className="p-2 text-[#F7F2E8] hover:text-[#D97A22] hover:bg-[#F7F2E8]/10 transition-all duration-300 rounded-xl cursor-pointer"
        aria-label="Open search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    )}
  </div>
  
  {/* Cart button - HIDDEN when search is active */}
  {!showSearch && (
    <button
      onClick={handleOpenCart}
      className="relative p-2 bg-[#F7F2E8]/10 backdrop-blur-sm hover:bg-[#F7F2E8]/20 text-[#F7F2E8] rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#D97A22]/20 group cursor-pointer border border-[#D97A22]/30"
      aria-label="Open cart"
    >
      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {cartItemsCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#D97A22] to-[#D97A22] text-[#4A2C1A] text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg border border-[#D97A22]/30 animate-pulse">
          {cartItemsCount > 9 ? '9+' : cartItemsCount}
        </span>
      )}
    </button>
  )}
  
  {/* Profile section - HIDDEN when search is active */}
  {!showSearch && (
    <div className="flex items-center">
      {user ? (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-1 sm:space-x-2 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 hover:bg-[#F7F2E8]/10 rounded-xl p-2 cursor-pointer"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-gradient-to-br from-[#D97A22] to-[#D97A22] rounded-full flex items-center justify-center text-[#4A2C1A] font-bold text-xs md:text-sm shadow-lg border border-[#D97A22]/30">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden lg:block text-[#F7F2E8] font-medium text-sm">
              {user.name || user.email?.split('@')[0]}
            </span>
            <svg
              className={`hidden lg:block w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-4 w-52 bg-[#4A2C1A] rounded-xl shadow-2xl py-2 z-50 border border-[#D97A22]/30">
              <div className="px-4 py-2.5 border-b border-[#D97A22]/30">
                <p className="text-[#D97A22] font-bold text-sm truncate tracking-wide">{user.name || user.email}</p>
                <p className="text-[#F7F2E8]/70 text-xs">Welcome back!</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-4 py-2.5 text-sm text-[#F7F2E8] hover:bg-[#F7F2E8]/10 hover:text-[#D97A22] cursor-pointer transition-all duration-300"
                onClick={() => setShowDropdown(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 0118 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full text-left px-4 py-2.5 text-sm text-[#F7F2E8] hover:bg-[#F7F2E8]/10 hover:text-[#D97A22] transition-all duration-300 rounded-b-xl cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link
            href="/signup"
            className="bg-[#F7F2E8]/10 backdrop-blur-sm text-[#F7F2E8] px-3 py-2 rounded-xl hover:bg-[#F7F2E8]/20 transition-all duration-300 font-medium shadow hover:shadow-lg hover:scale-105 hover:shadow-[#D97A22]/20 text-xs sm:text-sm blackspace-nowrap cursor-pointer min-w-[55px] sm:min-w-[60px] text-center border border-[#D97A22]/30"
          >
            Sign Up
          </Link>
        </div>
      )}
    </div>
  )}
</div>
            </div>

            {isMobileMenuOpen && (
              <div ref={mobileMenuRef} className="xl:hidden fixed inset-0 z-50">
                <div 
                  className="absolute inset-0 bg-[#4A2C1A]/40 backdrop-blur-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                
<div className="absolute top-0 left-0 h-full w-72 bg-[#4A2C1A] border-r border-[#D97A22]/30 shadow-2xl">                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-5 border-b border-[#D97A22]/30">
                      <Link 
                        href="/" 
                        className="flex items-center space-x-2 group cursor-pointer"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="relative w-20 h-20 sm:w-20 sm:h-20">
                          <Image
                            src="/images/logo.png"
                            alt={siteNameMain || 'Logo'}
                            fill
                            className="object-contain"
                            
                          />
                        </div>
                        
                        {logoFirstLine && (
                          <div className="flex flex-col justify-center">
                            <span className="text-base font-serif font-gray-600 tracking-tighter leading-none text-[#F7F2E8]">
                              {logoFirstLine}
                            </span>
                            {logoSecondLine && (
                              <div className="flex items-center mt-0.5">
                                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#D97A22]">
                                  {logoSecondLine}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </Link>
                      
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-[#F7F2E8] hover:text-[#D97A22] hover:bg-[#F7F2E8]/10 transition-all duration-300 rounded-xl cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <nav className="flex-1 p-5 overflow-y-auto">
                      <div className="space-y-1.5">
                        <Link 
                          href="/" 
                          className="flex items-center space-x-3 text-[#F7F2E8] hover:text-[#D97A22] hover:bg-[#F7F2E8]/10 transition-all duration-300 font-medium p-3 rounded-xl border border-transparent hover:border-[#D97A22]/30 text-sm cursor-pointer"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span>Home</span>
                        </Link>
                        
                        {initialCategories.map((category) => (
                          <Link
                            key={category._id}
                            href={`/products?category=${category.slug}`}
                            className="flex items-center space-x-3 text-[#F7F2E8] hover:text-[#D97A22] hover:bg-[#F7F2E8]/10 transition-all duration-300 font-medium p-3 rounded-xl border border-transparent hover:border-[#D97A22]/30 text-sm cursor-pointer ml-3"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>{category.name}</span>
                          </Link>
                        ))}
                        
                        <Link 
                          href="/about" 
                          className="flex items-center space-x-3 text-[#F7F2E8] hover:text-[#D97A22] hover:bg-[#F7F2E8]/10 transition-all duration-300 font-medium p-3 rounded-xl border border-transparent hover:border-[#D97A22]/30 text-sm cursor-pointer"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>About</span>
                        </Link>
                        
                        <Link 
                          href="/contact" 
                          className="flex items-center space-x-3 text-[#F7F2E8] hover:text-[#D97A22] hover:bg-[#F7F2E8]/10 transition-all duration-300 font-medium p-3 rounded-xl border border-transparent hover:border-[#D97A22]/30 text-sm cursor-pointer"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Contact</span>
                        </Link>
                      </div>
                    </nav>

                    <div className="p-5 border-t border-[#D97A22]/30">
                      {user ? (
                        <div className="flex items-center space-x-3 p-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#D97A22] to-[#D97A22] rounded-full flex items-center justify-center text-[#4A2C1A] font-bold text-sm border border-[#D97A22]/30">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-[#F7F2E8] font-medium text-sm truncate">{user.name || user.email}</p>
                            <p className="text-[#D97A22] text-xs">View Profile</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Link
                            href="/login"
                            className="flex-1 text-center bg-[#F7F2E8]/10 text-[#F7F2E8] py-2 rounded-xl hover:bg-[#F7F2E8]/20 transition-all duration-300 text-sm font-medium border border-[#D97A22]/30"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Login
                          </Link>
                          <Link
                            href="/signup"
                            className="flex-1 text-center bg-[#F7F2E8]/10 text-[#F7F2E8] py-2 rounded-xl hover:bg-[#F7F2E8]/20 transition-all duration-300 text-sm font-medium border border-[#D97A22]/30"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Sign Up
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
      </div>
<div className={`
  fixed bottom-0 left-0 right-0 bg-[#4A2C1A] border-t border-[#D97A22]/30 shadow-2xl z-40
  transition-transform duration-300 ease-in-out
  ${isFooterVisible ? 'translate-y-0' : 'translate-y-full'}
  xl:hidden
`}>
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="flex flex-col items-center justify-center flex-1 p-2 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 cursor-pointer min-w-0 rounded-xl hover:bg-[#F7F2E8]/10"
              onClick={() => setIsFooterVisible(false)}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[11px] font-medium truncate w-full text-center">Home</span>
            </Link>

            <button 
              onClick={handleSearchClick}
              className="flex flex-col items-center justify-center flex-1 p-2 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 cursor-pointer min-w-0 rounded-xl hover:bg-[#F7F2E8]/10"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-[11px] font-medium truncate w-full text-center">Search</span>
            </button>

            <Link 
              href="/products" 
              className="flex flex-col items-center justify-center flex-1 p-2 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 cursor-pointer min-w-0 rounded-xl hover:bg-[#F7F2E8]/10"
              onClick={() => setIsFooterVisible(false)}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-[11px] font-medium truncate w-full text-center">Products</span>
            </Link>

            <button
              onClick={handleOpenCart}
              className="flex flex-col items-center justify-center flex-1 p-2 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 relative cursor-pointer min-w-0 rounded-xl hover:bg-[#F7F2E8]/10"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-4 bg-gradient-to-r from-[#D97A22] to-[#D97A22] text-[#4A2C1A] text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-lg border border-[#D97A22]/30">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
              <span className="text-[11px] font-medium truncate w-full text-center">Cart</span>
            </button>

            {user ? (
              <Link 
                href="/profile" 
                className="flex flex-col items-center justify-center flex-1 p-2 text-[#F7F2E8] hover:text-[#D97A22] transition-all duration-300 cursor-pointer min-w-0 rounded-xl hover:bg-[#F7F2E8]/10"
                onClick={() => setIsFooterVisible(false)}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-[#D97A22] to-[#D97A22] rounded-full flex items-center justify-center text-[#4A2C1A] font-bold text-[10px] mb-1 shadow-lg border border-[#D97A22]/30">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">Account</span>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 p-2 min-w-0">
                <div className="flex flex-col items-center">
                  <div className="flex space-x-1">
                    <Link
                      href="/signup"
                      className="px-2 py-1.5 bg-[#F7F2E8]/10 text-[#F7F2E8] text-[10px] font-medium rounded-xl hover:bg-[#F7F2E8]/20 transition-all duration-300 text-center cursor-pointer border border-[#D97A22]/30"
                      onClick={() => setIsFooterVisible(false)}
                    >
                      Signup
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={handleCloseCart} 
      />
    </>
  );
}