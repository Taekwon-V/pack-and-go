'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div 
        className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden group cursor-pointer"
        onClick={() => setIsPopupOpen(true)}
      >
        <Image
          src={images[currentIndex]}
          alt={`Destination Image ${currentIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-500 hover:scale-105"
        />
        
        {/* Overlay gradient for text readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-indigo-500 w-4' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
          <button 
            onClick={() => setIsPopupOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-black/50 rounded-full transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4">
            <Image
              src={images[currentIndex]}
              alt={`Popup Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              quality={100}
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                
                <button
                  onClick={handleNext}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
