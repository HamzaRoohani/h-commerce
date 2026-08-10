'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full bg-border" />;
  }

  return (
    <div>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-border">
        <Image
          src={images[activeIndex]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              className={`relative h-20 w-16 overflow-hidden border ${
                index === activeIndex ? 'border-ink' : 'border-border'
              }`}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
