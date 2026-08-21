'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    if (!isPopupOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPopupOpen(false);
      if (event.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % images.length);
      if (event.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, isPopupOpen]);

  if (!images || images.length === 0) return null;

  const handleNext = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="editorial-carousel">
        <button
          type="button"
          className="editorial-carousel-media editorial-focus block w-full border-0 bg-transparent p-0 text-left"
          onClick={() => setIsPopupOpen(true)}
          aria-label={`여행 사진 ${currentIndex + 1} 크게 보기`}
        >
          <Image
            src={images[currentIndex]}
            alt={`오키나와 여행 사진 ${currentIndex + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, 80vw"
            className="object-cover"
            decoding="async"
          />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="editorial-carousel-control editorial-focus"
              data-direction="previous"
              aria-label="이전 사진"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="editorial-carousel-control editorial-focus"
              data-direction="next"
              aria-label="다음 사진"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="editorial-carousel-dots" aria-label="사진 선택">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="editorial-carousel-dot editorial-focus"
                  data-active={index === currentIndex}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  aria-label={`${index + 1}번째 사진 보기`}
                  aria-pressed={index === currentIndex}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {isPopupOpen && (
        <div className="editorial-lightbox" role="dialog" aria-modal="true" aria-label="여행 사진 크게 보기">
          <button
            type="button"
            onClick={() => setIsPopupOpen(false)}
            className="editorial-lightbox-close editorial-focus"
            aria-label="사진 닫기"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="editorial-lightbox-media">
            <Image
              src={images[currentIndex]}
              alt={`오키나와 여행 사진 ${currentIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              quality={75}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="editorial-lightbox-arrow editorial-focus"
                  data-direction="previous"
                  aria-label="이전 사진"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="editorial-lightbox-arrow editorial-focus"
                  data-direction="next"
                  aria-label="다음 사진"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
            <span className="editorial-lightbox-counter" aria-live="polite">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
