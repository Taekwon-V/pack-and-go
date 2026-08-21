'use client';

import { useState } from 'react';
import Image from 'next/image';

interface EditorialImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

const FALLBACK_IMAGE = '/gallery/1.jpg';

export default function EditorialImage({
  src,
  alt,
  className = '',
  sizes = '100vw',
  priority = false,
}: EditorialImageProps) {
  const [imageSrc, setImageSrc] = useState(src);

  if (src.startsWith('/')) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={priority}
        loading={priority ? undefined : 'lazy'}
        decoding="async"
        className={className}
      />
    );
  }

  // External cover URLs remain native images so user-provided URLs do not require a remote allowlist.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE);
      }}
      style={{ backgroundImage: `url(${FALLBACK_IMAGE})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
      className={className}
    />
  );
}
