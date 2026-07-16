'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Young_Serif } from 'next/font/google';

const youngSerif = Young_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface AdSectionProps {
  images?: string[];
  titles?: string[];
  descriptions?: string[];
}

const AdSection: React.FC<AdSectionProps> = ({ 
  images,
titles = [
  'Premium Kitchen Knife Set',
  'Handcrafted Leather Tote Bag',
  'Elegant Sterling Silver Earrings',
  'Professional Chef Knife',
  'Stylish Crossbody Bag',
  'Minimalist Gold Hoop Earrings',
  'Complete Knife Block Set'
],

descriptions = [
  'Professional-grade stainless steel kitchen knife set with ergonomic wooden handles. Perfect for everyday cooking with precision and ease.',
  'Genuine full-grain leather tote bag handcrafted by skilled artisans. Spacious, durable, and perfect for daily use or travel.',
  'Beautiful sterling silver earrings with cubic zirconia stones. Elegant design that complements any outfit for any occasion.',
  'High-carbon stainless steel chef knife with exceptional sharpness and balance. Ideal for precise cuts and professional cooking.',
  'Versatile crossbody bag made from premium vegan leather. Lightweight, stylish, and perfect for everyday errands or evening out.',
  'Timeless 18K gold-plated hoop earrings with secure locking backs. Hypoallergenic and comfortable for all-day wear.',
  'Complete 6-piece knife block set includes chef knife, bread knife, carving knife, and paring knives. Perfect for any kitchen.'
]
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const defaultImages = [
    '/images/p1.png',
    '/images/p2.png',
    '/images/p3.png ',
    '/images/p4.png',
    '/images/p5.png',
    '/images/p6.png',
    '/images/p7.png',
  ];


  const imageList = images && images.length === 5 ? images : defaultImages;

  const centerCard = useCallback((index: number) => {
    if (!trackRef.current) return;
    
    const card = trackRef.current.children[index] as HTMLElement;
    if (!card) return;
    
    const axis = isMobile ? 'top' : 'left';
    const size = isMobile ? 'clientHeight' : 'clientWidth';
    const start = isMobile ? card.offsetTop : card.offsetLeft;
    const parent = trackRef.current.parentElement;
    
    if (parent) {
      parent.scrollTo({
        [axis]: start - (parent[size] / 2 - card[size] / 2),
        behavior: 'smooth'
      });
    }
  }, [isMobile]);

  const activate = useCallback((index: number, shouldScroll: boolean = true) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
    if (shouldScroll) centerCard(index);
  }, [currentIndex, centerCard]);

  const go = useCallback((step: number) => {
    const totalCards = imageList.length;
    const newIndex = Math.min(Math.max(currentIndex + step, 0), totalCards - 1);
    activate(newIndex, true);
  }, [currentIndex, activate, imageList.length]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width:767px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) go(1);
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) go(-1);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [go]);

  useEffect(() => {
    if (!trackRef.current) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const threshold = 60;
      
      if (isMobile ? Math.abs(deltaY) > threshold : Math.abs(deltaX) > threshold) {
        go((isMobile ? deltaY : deltaX) > 0 ? -1 : 1);
      }
    };
    
    const track = trackRef.current;
    track.addEventListener('touchstart', handleTouchStart);
    track.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      track.removeEventListener('touchstart', handleTouchStart);
      track.removeEventListener('touchend', handleTouchEnd);
    };
  }, [go, isMobile]);

  useEffect(() => {
    centerCard(currentIndex);
  }, [currentIndex, centerCard, isMobile]);

  useEffect(() => {
    centerCard(0);
  }, [centerCard]);

  return (
    <section className="w-full px-5 bg-white font-sans">
      {/* Header Section */}
      <div className="w-full pt-[70px] pb-10">
        <h2 className={`${youngSerif.className} text-center text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#4A2C1A] mb-3 xs:mb-4 sm:mb-6 leading-tight`}>
          <span style={{ color: '#D97A22' }}>Discover Our Premium</span>{' '}
          <span style={{ color: '#4A2C1A' }}>Collection of Lifestyle Essentials</span>
        </h2>
      </div>

      {/* Slider Section */}
      <div className="w-full overflow-hidden">
        <div 
          ref={trackRef}
          className="flex gap-5 items-start justify-center scroll-smooth pb-10 overflow-x-auto hide-scrollbar md:flex-row flex-col"
          style={{ scrollSnapType: isMobile ? 'y mandatory' : 'x mandatory' }}
        >
          {imageList.map((image, idx) => (
            <article
              key={idx}
              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                isMobile ? 'w-full min-h-[80px]' : 'flex-[0_0_5rem]'
              } ${currentIndex === idx ? (isMobile ? 'min-h-[300px]' : 'flex-[0_0_30rem] -translate-y-1.5 shadow-2xl') : ''}`}
              style={{ 
                height: isMobile ? 'auto' : '26rem',
                scrollSnapAlign: 'start'
              }}
              onMouseEnter={() => {
                if (window.matchMedia('(hover:hover)').matches) activate(idx, true);
              }}
              onClick={() => activate(idx, true)}
            >
              {/* Background Image */}
              <img
                src={image}
                alt={titles[idx]}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:brightness-90 group-hover:scale-105"
              />
              
              {/* Content Overlay */}
              <div className={`absolute inset-0 flex flex-col justify-center items-center gap-2 z-10 ${
                currentIndex === idx ? 'md:flex-row md:items-center md:p-5 md:gap-4' : ''
              }`}>
         
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

                {/* Content */}
                <div className={`absolute inset-0 flex flex-col justify-end p-4 ${
                  !isMobile && currentIndex === idx ? 'justify-center items-center text-center' : ''
                }`}>
                  <h3
                    className={`${youngSerif.className} text-white font-bold drop-shadow-md ${
                      currentIndex === idx
                        ? isMobile ? 'text-2xl mb-2' : 'text-3xl mb-3'
                        : isMobile ? 'text-xl' : 'text-base [writing-mode:vertical-rl] rotate-180'
                    }`}
                  >
                    {titles[idx]}
                  </h3>

                  {currentIndex === idx && (
                    <p className="text-white/80 text-sm leading-relaxed mt-2 max-w-xs">
                      {descriptions[idx]}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      <div className={`flex gap-2 justify-center py-5 ${isMobile ? 'hidden' : ''}`}>
        {imageList.map((_, idx) => (
          <button
            key={idx}
            onClick={() => activate(idx, true)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentIndex === idx 
                ? 'bg-[#D97A22] scale-125' 
                : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default AdSection;