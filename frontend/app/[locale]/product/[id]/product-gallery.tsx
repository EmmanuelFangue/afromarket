'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { ProductMediaItem } from '../../../lib/types';

interface Props {
  media: ProductMediaItem[];
  title: string;
}

export default function ProductGallery({ media, title }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="aspect-square bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl flex items-center justify-center">
        <Package className="w-20 h-20 text-muted-foreground/30" aria-hidden="true" />
      </div>
    );
  }

  const active = media[activeIndex];

  return (
    <div className="space-y-3" data-testid="product-gallery">
      {/* Main image */}
      <div className="relative aspect-square bg-stone-100 rounded-2xl overflow-hidden group">
        <img
          src={active.url}
          alt={active.altText || title}
          className="w-full h-full object-cover"
        />

        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md disabled:opacity-30 hover:bg-white transition-colors"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.min(media.length - 1, i + 1))}
              disabled={activeIndex === media.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md disabled:opacity-30 hover:bg-white transition-colors"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5 text-foreground" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                index === activeIndex
                  ? 'border-primary shadow-sm scale-105'
                  : 'border-transparent hover:border-stone-300'
              }`}
              data-testid={`thumbnail-${index}`}
              aria-label={`Image ${index + 1}`}
            >
              <img
                src={item.url}
                alt={item.altText || `${title} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
