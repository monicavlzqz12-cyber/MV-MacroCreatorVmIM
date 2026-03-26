'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ProductImageData } from '@store-builder/types'

interface ProductImageGalleryProps {
  images: ProductImageData[]
  productName: string
  layout: string
}

export function ProductImageGallery({ images, productName, layout }: ProductImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No image available</p>
        </div>
      </div>
    )
  }

  const activeImage = images[activeIdx]!

  if (layout === 'stacked') {
    return (
      <div className="space-y-3">
        {images.map((img, idx) => (
          <div key={img.id} className="aspect-square relative rounded-xl overflow-hidden bg-gray-50">
            <Image
              src={img.url}
              alt={img.alt ?? `${productName} image ${idx + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'carousel') {
    return (
      <div className="space-y-3">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
          <Image
            src={activeImage.url}
            alt={activeImage.alt ?? productName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{ backgroundColor: idx === activeIdx ? 'var(--store-primary)' : '#D1D5DB' }}
                    aria-label={`Image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (layout === 'thumbnails') {
    return (
      <div className="flex gap-4">
        {/* Vertical thumbnails */}
        <div className="flex flex-col gap-2 w-16 flex-shrink-0">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(idx)}
              className="relative aspect-square rounded-md overflow-hidden border-2 transition-colors"
              style={{
                borderColor: idx === activeIdx ? 'var(--store-primary)' : 'transparent',
              }}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${productName} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
        {/* Main image */}
        <div className="flex-1 aspect-square relative rounded-xl overflow-hidden bg-gray-50">
          <Image
            src={activeImage.url}
            alt={activeImage.alt ?? productName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 90vw, 45vw"
            priority
          />
        </div>
      </div>
    )
  }

  // Default: gallery (main image + thumbnail strip below)
  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
        <Image
          src={activeImage.url}
          alt={activeImage.alt ?? productName}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(idx)}
              className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
              style={{
                borderColor: idx === activeIdx ? 'var(--store-primary)' : 'var(--store-border)',
              }}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${productName} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
