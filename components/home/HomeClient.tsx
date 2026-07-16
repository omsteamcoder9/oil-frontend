// components/home/HomeClient.tsx
  'use client';

  import { Truck, Shield, Minus, Plus, Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
  import { useRouter } from 'next/navigation';
  import { useRef, useState, useEffect } from 'react';
  import { Category } from '@/types/category';
  import ProductGrid from '@/components/products/ProductGrid';
  import Image from "next/image";
  import { settingsAPI } from '@/lib/settings-api';
  import { getAllProducts } from '@/lib/productService';
  import Link from 'next/link';
  import Carousel from '@/components/home/Carousal';
  import AdSection from '@/components/AdSection';

  interface HomeClientProps {
    categories: Category[];  // All categories - will show only those with products
  }

  // Define slide data with individual image handling
  const heroSlides = [
     {
      id: 2,
      topBadge: "HANDCRAFTED. MADE TO LAST.",
      mainTitle: "Crafted for Style. Built to Last.",
      tagline: "",
      description: "Our premium bags and earrings are handcrafted for elegance, balanced for comfort, and built for a lifetime of use.",
      features: [
        { title: "HANDCRAFTED", sub: "Premium Quality" },
        { title: "ELEGANT & STYLISH", sub: "Timeless Design" },
        { title: "BUILT TO LAST", sub: "Lifetime Durability" }
      ],
      ctaText: "SHOP NOW",
      bgImage: "/images/hero1.png",
      imageSize: { width: 1920, height: 1080 },
      objectPosition: "center center",
      objectFit: "contain",
    },
    {
      id: 1,
      topBadge: "CRAFTED FOR HOME. MADE TO LAST.",
      mainTitle: "PREMIUM KITCHEN",
      tagline: "SHARP. STRONG. RELIABLE.",
      description: "Premium kitchen knives and tools for the modern home chef. Perfect for everyday cooking with precision and ease.",
      features: [
        { title: "SHARP & PRECISE", sub: "STEEL BLADE" },
        { title: "STRONG & DURABLE", sub: "LONG LASTING" },
        { title: "IDEAL FOR KITCHEN,", sub: "HOME & GIFT" },
        { title: "ERGONOMIC", sub: "DESIGN" }
      ],
      ctaText: "SHOP NOW",
      bgImage: "/images/hero.png",
      imageSize: { width: 1920, height: 1060 },
      objectPosition: "center top",
      objectFit: "contain",
    },
   
  ];

  export default function HomeClient({ categories }: HomeClientProps) {
    const router = useRouter();
    const heroRef = useRef(null);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [contactNumber, setContactNumber] = useState('7200074221');
    
    // State for tracking categories with products
    const [categoriesWithProducts, setCategoriesWithProducts] = useState<string[]>([]);
    const [checkingProducts, setCheckingProducts] = useState(true);

    // Fetch contact info on component mount
    useEffect(() => {
      const fetchContactInfo = async () => {
        try {
          const contactInfo = await settingsAPI.getContactInfo();
          setContactNumber(contactInfo.whatsappNumber || contactInfo.contactNumber || '7200074221');
        } catch (error) {
          console.error('Error fetching contact info:', error);
          setContactNumber('7200074221');
        }
      };

      fetchContactInfo();
    }, []);

    // Check which categories have products
    useEffect(() => {
      const checkCategoriesForProducts = async () => {
        try {
          setCheckingProducts(true);
          const categoriesWithProductsList: string[] = [];
          
          for (const category of categories) {
            const response = await getAllProducts({ category: category._id });
            if (response.data && response.data.length > 0) {
              categoriesWithProductsList.push(category._id);
            }
          }
          
          setCategoriesWithProducts(categoriesWithProductsList);
        } catch (error) {
          console.error('Error checking categories for products:', error);
        } finally {
          setCheckingProducts(false);
        }
      };

      if (categories.length > 0) {
        checkCategoriesForProducts();
      }
    }, [categories]);

    // Auto slide change
    useEffect(() => {
      const interval = setInterval(() => {
        nextSlide();
      }, 4000);

      return () => clearInterval(interval);
    }, [currentSlide]);

    const navigateToProducts = () => {
      router.push('/products');
    };

    const nextSlide = () => {
      if (isTransitioning) return;
      
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      
      setTimeout(() => setIsTransitioning(false), 500);
    };

    const prevSlide = () => {
      if (isTransitioning) return;
      
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
      
      setTimeout(() => setIsTransitioning(false), 500);
    };

    const goToSlide = (index: number) => {
      if (isTransitioning || index === currentSlide) return;
      
      setIsTransitioning(true);
      setCurrentSlide(index);
      
      setTimeout(() => setIsTransitioning(false), 500);
    };

const faqItems = [
  {
    question: "What makes your kitchen knives different?",
    answer: "Our kitchen knives are handcrafted from premium quality steel, ensuring exceptional sharpness, balance, and durability for effortless food preparation."
  },
  {
    question: "Are your bags suitable for daily use?",
    answer: "Yes, our premium bags are designed for daily use with high-quality materials and an ergonomic design that makes them both stylish and functional."
  },
  {
    question: "How do I maintain and clean your earrings?",
    answer: "Clean your earrings with a soft cloth after each use, store in a dry place, and avoid contact with harsh chemicals. Our jewelry is designed for easy maintenance."
  },
  {
    question: "What materials are used in your products?",
    answer: "Our kitchen knives use premium high-carbon stainless steel, our bags are crafted from genuine leather and premium vegan materials, and our earrings are made from sterling silver and 18K gold-plated metals for lasting beauty and durability."
  },
  {
    question: "How should I care for my premium products?",
    answer: "For kitchen knives, hand wash and dry immediately after use. For bags, wipe with a soft damp cloth and store in a dust bag. For earrings, clean with a jewelry cloth and store separately to prevent scratches."
  }
];

    const toggleFaq = (index: number) => {
      setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    // Filter categories to only show those with products
    const visibleCategories = categories.filter(
      category => categoriesWithProducts.includes(category._id)
    );

    // Primary color constant
    const primaryColor = '#D97A22';

    return (
      <div className="min-h-screen bg-white overflow-hidden">
        {/* Hero Slider Section */}
        <section
          className="relative h-[500px] xs:h-[600px] sm:h-[700px] flex items-center overflow-hidden bg-white"
          aria-label="Hand Sickle Hero"
        >
          {/* Background Slides */}
          <div className="absolute inset-0 z-0">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${
                  currentSlide === index ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                }`}
              >
                <div className="absolute inset-0 z-10" />
                <div className="absolute inset-0 z-10 bg-black/5 bg-gradient-to-r from-white/80 via-white/20 to-[#D97A22]/10" />
                
                <div className="relative w-full h-full">
                  <Image
                    src={slide.bgImage}
                    alt={slide.mainTitle}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    quality={90}
                    className={`
                      object-cover
                      transition-all duration-700
                      ${slide.id === 1 
                        ? 'object-[95%_center] md:object-center' 
                        : slide.id === 2 
                          ? 'object-[85%_center] md:object-bottom'
                          : 'object-center'
                      }
                    `}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-0.5 xs:h-1 z-30 flex gap-0.5 xs:gap-1">
            {heroSlides.map((_, index) => (
              <div key={index} className="h-full flex-1 bg-black/10 overflow-hidden">
                <div 
                  className={`h-full bg-[#D97A22] transition-all duration-[5000ms] ease-linear ${
                    currentSlide === index ? 'w-full' : 'w-0'
                  }`} 
                />
              </div>
            ))}
          </div>

          {/* Main Content Container */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 md:px-12 lg:px-16">
            <div
              key={currentSlide}
              className="max-w-2xl text-left animate-slide-in"
            >
              {/* Top Badge */}
              <div className="mb-2 xs:mb-3 sm:mb-4 md:mb-6">
                <p className="text-black/60 tracking-[0.2em] uppercase text-[9px] xs:text-[10px] sm:text-xs font-semibold">
                  {heroSlides[currentSlide].topBadge}
                </p>
              </div>

              {/* Main Title */}
              <h1 className="font-serif text-black leading-[1.1] mb-2 xs:mb-3 sm:mb-4">
                {heroSlides[currentSlide].mainTitle === "PREMIUM KITCHEN" ? (
                  <>
                    <span className="block text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-light tracking-tight">
                      Premium
                    </span>
                    <span className="block text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-7xl italic font-extralight text-[#D97A22]">
                      Kitchen
                    </span>
                  </>
                ) : (
                  <span className="block text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight">
                    {heroSlides[currentSlide].mainTitle}
                  </span>
                )}
              </h1>

              {/* Tagline (only for slide 1) */}
              {heroSlides[currentSlide].tagline && (
                <p className="text-black/80 text-base xs:text-lg sm:text-xl md:text-2xl font-medium mb-2 xs:mb-3 sm:mb-4">
                  {heroSlides[currentSlide].tagline}
                </p>
              )}

              {/* Description */}
              <p className="text-black/60 text-xs xs:text-sm sm:text-base mb-4 xs:mb-6 sm:mb-8 max-w-md">
                {heroSlides[currentSlide].description}
              </p>

              {/* Feature Badges Grid with Icons */}
              <div className={`grid gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6 sm:mb-8 ${
                heroSlides[currentSlide].features.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
              }`}>
                {heroSlides[currentSlide].features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-1 xs:gap-2 sm:gap-3">
                    {/* Icon */}
                    <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-full bg-[#D97A22]/10 flex items-center justify-center flex-shrink-0">
                      {feature.title === "SHARP & PRECISE" && (
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                      {feature.title === "STRONG & DURABLE" && (
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      {feature.title === "IDEAL FOR KITCHEN," && (
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      )}
                      {feature.title === "ERGONOMIC" && (
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 5a1 1 0 011 1v3a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h4zM4 3a1 1 0 00-1 1v4a1 1 0 001 1h2M10 5h4a1 1 0 011 1v3a1 1 0 01-1 1h-4M6 11h4M4 15h16M6 15v4a1 1 0 001 1h10a1 1 0 001-1v-4" />
                        </svg>
                      )}
                      {feature.title === "HANDCRAFTED" && (
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                      {feature.title === "ELEGANT & STYLISH" && (
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      {feature.title === "BUILT TO LAST" && (
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#D97A22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    {/* Text */}
                    <div>
                      <p className="font-bold text-black text-[10px] xs:text-xs sm:text-sm">{feature.title}</p>
                      <p className="text-black/50 text-[8px] xs:text-[10px] sm:text-xs">{feature.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={navigateToProducts}
                className="px-4 xs:px-6 sm:px-8 py-1.5 xs:py-2 sm:py-3 bg-[#D97A22] text-white rounded-full font-bold text-xs xs:text-sm sm:text-base hover:bg-[#D97A22]/80 transition-all duration-300 shadow-lg"
              >
                {heroSlides[currentSlide].ctaText}
              </button>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="absolute right-2 xs:right-3 sm:right-4 md:right-8 lg:right-16 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="group relative flex items-center justify-end"
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className={`mr-1 xs:mr-2 sm:mr-3 md:mr-4 text-[6px] xs:text-[8px] sm:text-[9px] md:text-[10px] font-bold transition-all duration-300 ${
                  currentSlide === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                }`}>
                  0{index + 1}
                </span>
                <div className={`w-1 xs:w-1.5 sm:w-2 h-1 xs:h-1.5 sm:h-2 rounded-full border border-slate-900 transition-all duration-500 ${
                  currentSlide === index ? 'bg-slate-900 scale-150' : 'bg-transparent hover:scale-125'
                }`} />
              </button>
            ))}
          </div>

          {/* Prev/Next Buttons */}
          <div className="absolute bottom-3 xs:bottom-4 sm:bottom-6 md:bottom-8 right-2 xs:right-3 sm:right-4 md:right-6 lg:right-20 z-30 flex items-center gap-1">
            <button
              onClick={prevSlide}
              className="p-1.5 xs:p-2 sm:p-3 md:p-4 border border-slate-200 bg-white/50 backdrop-blur-md hover:bg-white transition-all rounded"
              aria-label="Previous slide"
            >
              <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="p-1.5 xs:p-2 sm:p-3 md:p-4 border border-slate-200 bg-white/50 backdrop-blur-md hover:bg-white transition-all rounded"
              aria-label="Next slide"
            >
              <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        {/* Explore Products Section - Shows ALL categories that have products */}
        {!checkingProducts && visibleCategories.length > 0 && (
          <section className="py-6 xs:py-8 sm:py-12 bg-white" aria-label="Explore Our Products">
            <div className="container mx-auto px-1">
              <div className="text-center mb-4 xs:mb-6 sm:mb-8">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-black mb-2 xs:mb-3">
                  Explore Our Premium Collection
                </h2>
                <p className="text-black/60 text-xs xs:text-sm sm:text-base max-w-2xl mx-auto px-2">
                  Discover premium kitchen knives, stylish bags, elegant earrings, and more
                </p>
              </div>

              <div className="space-y-8 xs:space-y-10 sm:space-y-12">
                {visibleCategories.map((category, index) => (
                  <div 
                    key={category._id} 
                    className="animate-fade-in-up" 
                    style={{ 
                      animationDelay: `${index * 300}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="mb-4 xs:mb-5 sm:mb-6 px-2 xs:px-3 sm:px-4">
                      <div className="flex flex-col items-center justify-center text-center mb-3 xs:mb-4">
                        <div>
                          <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-black">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="h-0.5 xs:h-1 w-16 xs:w-20 bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] rounded-full"></div>
                      </div>
                    </div>

                    <ProductGrid 
                      category={category._id} 
                      limit={8} 
                      hideFilters={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Show a message if no categories have products */}
        {!checkingProducts && visibleCategories.length === 0 && (
          <section className="py-6 xs:py-8 sm:py-12 bg-white">
            <div className="container mx-auto px-1 text-center">
              <p className="text-black/50 text-xs xs:text-sm">No products available at the moment. Please check back later.</p>
            </div>
          </section>
        )}
        
        <Carousel displayCategories={categories} />

        {/* Mission Section */}
        <section className="py-12 xs:py-16 sm:py-20 md:py-24 bg-white" aria-label="Our Mission">
          <div className="container mx-auto px-4 xs:px-5 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-8 xs:gap-12 sm:gap-16 md:gap-20 items-center">
              <div className="relative group order-2 lg:order-1">
                <div className="absolute -inset-2 xs:-inset-3 sm:-inset-4 bg-gradient-to-r from-[#D97A22]/10 via-[#D97A22]/10 to-[#D97A22]/10 rounded-2xl xs:rounded-3xl rotate-3 transition-transform group-hover:rotate-1 duration-500" />
                <div className="relative h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-xl xs:rounded-2xl overflow-hidden shadow-2xl border border-[#D97A22]/20">
                  <Image
                    src="/images/home1.jpg"
                    alt="Premium Products Showcase - Kitchen Knives, Bags, and Earrings"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={85}
                    className="object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                    style={{
                      objectPosition: 'center center'
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-6 xs:space-y-8 sm:space-y-10 order-1 lg:order-2">
                <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                  <h2 className="text-3xl xs:text-4xl sm:text-5xl font-serif text-black">Our Vision</h2>
                  <div className="w-12 xs:w-14 sm:w-16 h-1 xs:h-1.5 bg-gradient-to-r from-[#D97A22] via-[#D97A22] to-[#D97A22] rounded-full" />
                </div>
                
                <div className="space-y-4 xs:space-y-5 sm:space-y-6 text-sm xs:text-base sm:text-lg text-black/70 leading-relaxed">
                  <p>
                    We are committed to providing premium quality products including kitchen knives, 
                    stylish bags, elegant earrings, and other lifestyle essentials.
                  </p>
                  <p className="font-light">
                    Our mission is to help customers elevate their daily lives with durable, reliable products that last a lifetime.
                  </p>
                </div>

                <div className="p-5 xs:p-6 sm:p-8 bg-gradient-to-r from-[#D97A22]/5 via-[#D97A22]/5 to-[#D97A22]/5 rounded-xl xs:rounded-2xl border-l-4 xs:border-l-6 sm:border-l-8 border-[#D97A22] italic text-base xs:text-lg sm:text-xl text-black/80 font-serif leading-relaxed shadow-sm">
                  Quality products make every kitchen task easier and every style statement bolder.
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Category Carousel Section */}
        <section className="relative w-full min-h-[350px] xs:min-h-[400px] sm:min-h-[450px] bg-[#4A2C1A] flex items-center overflow-hidden">
          {/* Background Leaves Pattern */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-40 mix-blend-screen">
            <svg width="300" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 200C40 100 160 100 160 0" stroke="#D97A22" strokeWidth="0.5" />
              <path d="M60 200C60 100 180 100 180 0" stroke="#D97A22" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="container mx-auto px-4 xs:px-5 sm:px-6 md:px-12 z-10">
            <div className="grid lg:grid-cols-2 items-center gap-6 xs:gap-8">
              
              {/* Text Content Area */}
              <div className="max-w-xl py-6 xs:py-8 sm:py-10">
                <p className="text-[#F7F2E8] text-xs xs:text-sm font-medium mb-1 xs:mb-2 tracking-wide">
                  Weekly Deals
                </p>
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#F7F2E8] leading-tight mb-2 xs:mb-3 sm:mb-4">
                  Amazing Savings: <span className="text-[#D97A22]">Weekly Lifestyle Must-Haves</span>
                </h1>
                <p className="text-[#F7F2E8]/70 text-xs xs:text-sm sm:text-base mb-4 xs:mb-6 sm:mb-8 max-w-md italic opacity-90">
                  Get the best deals on premium kitchen knives, stylish bags, 
                  elegant earrings, and more.
                </p>
                
                <Link 
                  href="/shop"
                  className="inline-flex items-center justify-center px-6 xs:px-8 sm:px-10 py-2 xs:py-2.5 sm:py-3 bg-[#D97A22] text-[#4A2C1A] rounded-full font-bold text-xs xs:text-sm sm:text-base hover:bg-[#F7F2E8] hover:text-[#4A2C1A] transition-all duration-300 shadow-xl"
                >
                  Shop Now <span className="ml-1 xs:ml-2 text-base xs:text-lg">→</span>
                </Link>
              </div>

              {/* Image Area */}
              <div className="relative flex justify-end items-end h-full">
                <img
                  src="/images/new1.jpg"
                  alt="Premium Products"
                  className="w-auto h-[250px] xs:h-[280px] sm:h-[320px] md:h-[400px] lg:h-[500px] object-contain object-bottom"
                />
              </div>

            </div>
          </div>
        </section>
        
        {/* Why Choose Us Section */}
        <section className="py-12 xs:py-16 sm:py-20 bg-white" aria-label="Why Choose Us">
          <div className="container mx-auto px-4">
            {/* Clean, Centered Header */}
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-black mb-2 xs:mb-3 sm:mb-4 tracking-tight">
                Why Choose Our Products
              </h2>
              <div className="w-16 xs:w-20 h-0.5 xs:h-1 bg-[#D97A22] mx-auto mb-4 xs:mb-5 sm:mb-6 rounded-full"></div>
              <p className="text-black/60 text-sm xs:text-base sm:text-lg max-w-2xl mx-auto px-2">
                Trusted quality products crafted specifically for modern lifestyles
              </p>
            </div>

            {/* Balanced 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 xs:gap-6 sm:gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Truck,
                  title: 'Fast Delivery',
                  desc: 'Quick and safe delivery to your doorstep. We prioritize your convenience with real-time tracking.',
                  highlight: 'Fast Shipping'
                },
                {
                  icon: Shield,
                  title: 'Premium Quality',
                  desc: '100% Authentic handcrafted products made from premium materials for long-lasting durability.',
                  highlight: 'Authentic'
                },
                {
                  icon: Clock,
                  title: 'Latest Collection',
                  desc: 'Stay updated with the newest designs including modern styles and timeless favorites.',
                  highlight: 'New Arrivals'
                },
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="group p-5 xs:p-6 sm:p-8 rounded-2xl xs:rounded-3xl transition-all duration-300 bg-white border border-gray-100 hover:border-[#D97A22]/30 hover:shadow-[0_20px_40px_rgba(217,122,34,0.08)] flex flex-col items-center text-center"
                >
                  {/* Refined Icon Container */}
                  <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mb-4 xs:mb-5 sm:mb-6 flex items-center justify-center rounded-xl xs:rounded-2xl bg-[#D97A22]/5 text-[#D97A22] group-hover:bg-[#D97A22] group-hover:text-white transition-all duration-500 shadow-sm">
                    <feature.icon size={20} strokeWidth={1.5} className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7" />
                  </div>

                  <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-black mb-2 xs:mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-black/60 leading-relaxed mb-4 xs:mb-5 sm:mb-6 text-xs xs:text-sm sm:text-base">
                    {feature.desc}
                  </p>

                  {/* Simple, Professional Badge */}
                  <div className="mt-auto">
                    <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#D97A22] bg-[#D97A22]/10 px-3 xs:px-4 py-1 xs:py-1.5 rounded-full border border-[#D97A22]/10">
                      {feature.highlight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad Section - Added here */}
        <AdSection />

        {/* FAQ Section */}
        <section className="py-8 xs:py-10 sm:py-12 bg-white border-t border-[#D97A22]/20" aria-label="Frequently Asked Questions">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 xs:mb-8 sm:mb-10">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-black mb-2 xs:mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-black/60 text-xs xs:text-sm sm:text-base max-w-2xl mx-auto">
                Find answers to common questions about our premium products
              </p>
            </div>

            <div className="max-w-3xl mx-auto" itemScope itemType="https://schema.org/FAQPage">
              {faqItems.map((faq, index) => (
                <div 
                  key={index} 
                  className="mb-3 xs:mb-4 border border-[#D97A22]/20 rounded-lg xs:rounded-xl overflow-hidden transition-all duration-300 hover:border-[#D97A22]/30 hover:shadow-lg bg-white"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <button
                    className="w-full px-4 xs:px-5 sm:px-6 py-3 xs:py-4 text-left flex justify-between items-center bg-white hover:bg-gradient-to-r hover:from-[#D97A22]/5 hover:via-[#D97A22]/5 hover:to-[#D97A22]/5 transition-colors duration-300"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="font-semibold text-black text-sm xs:text-base sm:text-lg" itemProp="name">
                      {faq.question}
                    </span>
                    <span className="text-[#D97A22]">
                      {openFaqIndex === index ? (
                        <Minus className="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300" />
                      ) : (
                        <Plus className="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300" />
                      )}
                    </span>
                  </button>
                  <div 
                    id={`faq-answer-${index}`}
                    className={`px-4 xs:px-5 sm:px-6 overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'py-3 xs:py-4 max-h-96' : 'max-h-0 py-0'}`}
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <div itemProp="text">
                      <p className="text-black/60 leading-relaxed text-xs xs:text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* FAQ Schema Script for SEO */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": faqItems.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": faq.answer
                    }
                  }))
                })
              }}
            />
          </div>
        </section>
        
        <style jsx global>{`
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .animate-slide-in {
            animation: slide-in 0.6s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }