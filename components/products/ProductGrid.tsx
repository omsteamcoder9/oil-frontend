'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { getAllProducts, PRICE_RANGES } from '@/lib/productService';
import { fetchActiveCategories } from '@/lib/categoryService';
import ProductCard from '../ui/ProductCard';
import SortDropdown from './SortDropdown';
import FilterDropdown from './FilterDropdown';

interface ProductGridProps {
  category?: string;
  search?: string;
  limit?: number;
  hideFilters?: boolean;
}

// Define the filter state interface
interface FilterState {
  category: string;
  priceRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
}

// Define the query parameters interface
interface QueryParams {
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Define category option type for FilterDropdown
interface CategoryOption {
  value: string;
  label: string;
}

// Define price range option type for FilterDropdown
interface PriceRangeOption {
  value: string;
  label: string;
}

export default function ProductGrid({ category, search, limit, hideFilters = false }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const mobileFiltersRef = useRef<HTMLDivElement>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  
  // Determine if this is the home page (hideFilters is true and limit is not specified)
  const isHomePage = hideFilters && limit === undefined;
  
  // Filter state with proper typing
  const [filters, setFilters] = useState<FilterState>({
    category: category || '',
    priceRange: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: search || ''
  });

  // Check if desktop on mount and on resize
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // 1024px is the lg breakpoint
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Sticky filter bar effect - only on desktop and if filters are visible
  useEffect(() => {
    if (hideFilters || !isDesktop) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );

    if (stickySentinelRef.current) {
      observer.observe(stickySentinelRef.current);
    }

    return () => {
      if (stickySentinelRef.current) {
        observer.unobserve(stickySentinelRef.current);
      }
    };
  }, [hideFilters, isDesktop]);

  // Close mobile filters when clicking outside - only if filters are visible
  useEffect(() => {
    if (hideFilters) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileFiltersRef.current && !mobileFiltersRef.current.contains(event.target as Node)) {
        setIsMobileFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hideFilters]);

  // Wrap loadFilteredProducts in useCallback to memoize it
  const loadFilteredProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      let productsData;

      console.log('🔄 Current filters:', filters);
      console.log('📦 Loading products with category:', filters.category);
      
      const hasPriceFilter = filters.priceRange;
      
      // Use properly typed query parameters
      const queryParams: QueryParams = {};
      
      // Only add category to query if it's not empty
      if (filters.category) {
        queryParams.category = filters.category;
        console.log('🎯 Filtering by category:', filters.category);
      } else {
        console.log('🎯 Showing ALL products (no category filter)');
      }
      
      if (filters.search) queryParams.search = filters.search;
      if (filters.sortBy) queryParams.sortBy = filters.sortBy;
      if (filters.sortOrder) queryParams.sortOrder = filters.sortOrder;
      
      console.log('🚀 Sending to API:', queryParams);
      
      const response = await getAllProducts(queryParams);
      productsData = response.data;
      
      console.log('📦 API Response count:', productsData?.length);

      // Apply price filtering on frontend
      if (hasPriceFilter && productsData) {
        console.log('💰 Applying price filter on frontend:', filters.priceRange);
        const filtered = productsData.filter(product => {
          const price = product.basePrice;
          switch (filters.priceRange) {
            case '100-200':
              return price >= 100 && price <= 200;
            case '200-300':
              return price >= 200 && price <= 300;
            case '300-400':
              return price >= 300 && price <= 400;
            case '400-500':
              return price >= 400 && price <= 500;
            case '500-600':
              return price >= 500 && price <= 600;
            case 'above-600':
              return price > 600;
            default:
              return true;
          }
        });
        console.log('💰 After price filtering:', filtered.length);
        productsData = filtered;
      }

      // APPLY LIMIT
      const finalLimit = isHomePage ? 8 : limit;
      if (finalLimit && productsData) {
        console.log(`🎯 Applying limit: ${finalLimit} products`);
        productsData = productsData.slice(0, finalLimit);
      }

      console.log('✅ Final products:', productsData?.length);
      setProducts(productsData || []);
    } catch (err) {
      console.error('❌ Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters, limit, isHomePage]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load categories
        const categoriesData = await fetchActiveCategories();
        setCategories(categoriesData);

        // Load products based on filters
        await loadFilteredProducts();
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [loadFilteredProducts]);

  // Update filters when category prop changes
  useEffect(() => {
    console.log('🔄 Category prop changed:', category);
    setFilters(prev => ({
      ...prev,
      category: category || ''
    }));
  }, [category]);

  // Update filters when search prop changes
  useEffect(() => {
    if (search !== undefined) {
      setFilters(prev => ({
        ...prev,
        search: search || ''
      }));
    }
  }, [search]);

  // Reload products when filters change
  useEffect(() => {
    console.log('🔄 Filters changed, reloading products:', filters);
    if (categories.length > 0) {
      loadFilteredProducts();
    }
  }, [filters, categories.length, loadFilteredProducts]);

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }));
  };

  const handleCategoryChange = (value: string | string[]) => {
    // Handle both single value and array (for multi-select compatibility)
    const categoryValue = Array.isArray(value) ? value[0] || '' : value;
    setFilters(prev => ({
      ...prev,
      category: categoryValue
    }));
  };

  const handlePriceRangeChange = (value: string | string[]) => {
    // Handle both single value and array (for multi-select compatibility)
    const priceValue = Array.isArray(value) ? value[0] || '' : value;
    setFilters(prev => ({
      ...prev,
      priceRange: priceValue
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      priceRange: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: ''
    });
  };

  // Count active filters for badge - only if filters are visible
  const activeFilterCount = hideFilters ? 0 : [
    filters.category ? 1 : 0,
    filters.priceRange ? 1 : 0,
    filters.search ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  // Prepare category options for FilterDropdown
  const categoryOptions: CategoryOption[] = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat._id, label: cat.name }))
  ];

  // Prepare price range options for FilterDropdown
  const priceRangeOptions: PriceRangeOption[] = [
    { value: '', label: 'All Prices' },
    ...PRICE_RANGES
  ];

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center py-8 sm:py-12 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#D97A22]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12 px-4 font-sans">
        <p className="text-red-600 text-base sm:text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 sm:mt-4 bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] text-white px-4 sm:px-6 py-2 rounded-lg hover:from-[#c56a1e] hover:via-[#c56a1e] hover:to-[#c56a1e] transition-all duration-200 text-sm sm:text-base font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Sentinel for sticky detection */}
      {!hideFilters && isDesktop && <div ref={stickySentinelRef} className="h-0" />}
      
      {/* Container */}
      <div className="mx-2 xs:mx-4 sm:mx-6 md:mx-8 lg:mx-8 xl:mx-12 2xl:mx-16">
        
        {/* ONLY SHOW FILTERS IF hideFilters IS FALSE */}
        {!hideFilters && (
          <>
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-[#D97A22]/25 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-white text-[#D97A22] rounded-full px-2 py-0.5 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Filter Overlay */}
            {isMobileFiltersOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
                <div ref={mobileFiltersRef} className="absolute right-0 top-0 h-full w-80 bg-[#f2f2f2] p-6 overflow-y-auto shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    <button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-6">
                    {/* Categories */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                      <div className="space-y-2">
                        {categoryOptions.map((option) => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="category-mobile"
                              checked={filters.category === option.value}
                              onChange={() => handleCategoryChange(option.value)}
                              className="text-[#D97A22] focus:ring-[#D97A22]"
                            />
                            <span className="ml-2 text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                      <div className="space-y-2">
                        {priceRangeOptions.map((option) => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="price-mobile"
                              checked={filters.priceRange === option.value}
                              onChange={() => handlePriceRangeChange(option.value)}
                              className="text-[#D97A22] focus:ring-[#D97A22]"
                            />
                            <span className="ml-2 text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <button
                      onClick={clearAllFilters}
                      className="w-full py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:border-gray-500 hover:text-gray-900 transition-all duration-200 cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Filters - Filter Bar */}
            <div 
              ref={filterBarRef}
              className={`
                hidden lg:block bg-white border-b border-gray-200 py-4 transition-all duration-300
                ${isSticky ? 'fixed top-0 left-0 right-0 z-40 bg-white shadow-md' : 'relative'}
              `}
              style={{
                top: isSticky ? '0' : 'auto',
              }}
            >
              <div className="max-w-[1400px] mx-auto px-4 lg:px-8 xl:px-12 2xl:px-16">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left side - Category and Price Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Category Dropdown */}
                    <FilterDropdown<string>
                      title="Category"
                      value={filters.category}
                      options={categoryOptions}
                      onSelect={handleCategoryChange}
                    />

                    {/* Price Range Dropdown */}
                    <FilterDropdown<string>
                      title="Price"
                      value={filters.priceRange}
                      options={priceRangeOptions}
                      onSelect={handlePriceRangeChange}
                    />

                    {/* Active Filters Count */}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-gray-500 hover:text-[#D97A22] transition-colors flex items-center gap-1"
                      >
                        <span>Clear all</span>
                        <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                          {activeFilterCount}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Right side - Sort Dropdown */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
                    <SortDropdown
                      sortBy={filters.sortBy}
                      sortOrder={filters.sortOrder}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer for sticky filter bar */}
            {isSticky && isDesktop && (
              <div className="hidden lg:block" style={{ height: '68px' }}></div>
            )}
          </>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-8 sm:py-12 font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Try adjusting your filters to see more results.
              </p>
              <button 
                onClick={clearAllFilters}
                className="bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] text-white px-6 py-2 rounded-lg font-medium hover:from-[#c56a1e] hover:via-[#c56a1e] hover:to-[#c56a1e] transition-all duration-200 text-sm shadow-lg hover:shadow-[#D97A22]/25"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}