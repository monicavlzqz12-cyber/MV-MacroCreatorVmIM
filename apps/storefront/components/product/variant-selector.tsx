'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ProductVariantData, StoreConfigData } from '@store-builder/types'
import { cn } from '@/lib/utils'

interface OptionGroup {
  id: string
  name: string
  type: string
  options: Array<{
    id: string
    label: string
    value: string
    colorHex?: string
    imageUrl?: string
  }>
}

interface VariantSelectorProps {
  optionGroups: OptionGroup[]
  variants: ProductVariantData[]
  config: StoreConfigData | null
  onVariantChange?: (variant: ProductVariantData | null) => void
}

type SelectedOptions = Record<string, string> // groupId → optionId

export function VariantSelector({ optionGroups, variants, config, onVariantChange }: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(() => {
    // Pre-select defaults
    const defaults: SelectedOptions = {}
    const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0]
    if (defaultVariant) {
      for (const opt of defaultVariant.options) {
        defaults[opt.groupId] = opt.optionId
      }
    }
    return defaults
  })

  // Find matching variant from selected options
  const matchingVariant = variants.find((v) => {
    if (v.options.length !== Object.keys(selectedOptions).length) return false
    return v.options.every((opt) => selectedOptions[opt.groupId] === opt.optionId)
  }) ?? null

  useEffect(() => {
    onVariantChange?.(matchingVariant)
  }, [matchingVariant, onVariantChange])

  const handleOptionSelect = useCallback((groupId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [groupId]: optionId }))
  }, [])

  const isOptionAvailable = useCallback(
    (groupId: string, optionId: string): boolean => {
      // Build hypothetical selection
      const hypothetical = { ...selectedOptions, [groupId]: optionId }
      // Check if any active variant matches all selected options
      return variants.some((v) => {
        if (!v.isActive) return false
        return v.options.every((opt) => {
          const hypoVal = hypothetical[opt.groupId]
          return !hypoVal || hypoVal === opt.optionId
        })
      })
    },
    [selectedOptions, variants],
  )

  const isOptionOutOfStock = useCallback(
    (groupId: string, optionId: string): boolean => {
      const hypothetical = { ...selectedOptions, [groupId]: optionId }
      const matchedVariant = variants.find((v) => {
        if (!v.isActive) return false
        return (
          v.options.length === Object.keys(hypothetical).length &&
          v.options.every((opt) => hypothetical[opt.groupId] === opt.optionId)
        )
      })
      if (!matchedVariant) return false
      return matchedVariant.inventoryCount !== undefined && matchedVariant.inventoryCount !== null && matchedVariant.inventoryCount <= 0
    },
    [selectedOptions, variants],
  )

  return (
    <div className="space-y-5">
      {optionGroups.map((group) => {
        const selectedId = selectedOptions[group.id]
        const isColor = group.type === 'color'
        const isImage = group.type === 'image'

        return (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-2.5">
              <p className="text-sm font-semibold" style={{ color: 'var(--store-text)' }}>
                {group.name}
              </p>
              {selectedId && (
                <p className="text-sm" style={{ color: 'var(--store-text-muted)' }}>
                  {group.options.find((o) => o.id === selectedId)?.label}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = selectedId === option.id
                const isAvailable = isOptionAvailable(group.id, option.id)
                const isOOS = isOptionOutOfStock(group.id, option.id)

                if (isColor) {
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(group.id, option.id)}
                      disabled={!isAvailable}
                      title={option.label}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all duration-150 relative',
                        isSelected ? 'ring-2 ring-offset-2 scale-110' : 'border-gray-200 hover:scale-105',
                        !isAvailable && 'opacity-40 cursor-not-allowed',
                      )}
                      style={{
                        backgroundColor: option.colorHex ?? '#888888',
                        borderColor: isSelected ? 'var(--store-primary)' : undefined,
                        '--tw-ring-color': 'var(--store-primary)',
                      } as React.CSSProperties}
                    >
                      {/* OOS diagonal strike */}
                      {isOOS && (
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, transparent 45%, white 45%, white 55%, transparent 55%)' }} />
                        </div>
                      )}
                    </button>
                  )
                }

                if (isImage && option.imageUrl) {
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(group.id, option.id)}
                      disabled={!isAvailable}
                      title={option.label}
                      className={cn(
                        'w-12 h-12 rounded-md border-2 overflow-hidden transition-all duration-150',
                        isSelected ? 'ring-2 ring-offset-1' : 'border-gray-200 hover:border-gray-400',
                        !isAvailable && 'opacity-40 cursor-not-allowed',
                      )}
                      style={{
                        borderColor: isSelected ? 'var(--store-primary)' : undefined,
                        '--tw-ring-color': 'var(--store-primary)',
                      } as React.CSSProperties}
                    >
                      <img
                        src={option.imageUrl}
                        alt={option.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                }

                // Default: text button
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(group.id, option.id)}
                    disabled={!isAvailable}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-150',
                      isSelected
                        ? 'border-[var(--store-primary)] text-white'
                        : 'border-gray-200 hover:border-gray-400',
                      !isAvailable && 'opacity-40 cursor-not-allowed line-through',
                    )}
                    style={{
                      backgroundColor: isSelected ? 'var(--store-primary)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--store-text)',
                    }}
                  >
                    {option.label}
                    {isOOS && !isSelected && (
                      <span className="ml-1 text-xs opacity-60">(OOS)</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Matching variant info */}
      {matchingVariant && (
        <div className="text-xs text-gray-500">
          {matchingVariant.sku && <span>SKU: {matchingVariant.sku}</span>}
        </div>
      )}
    </div>
  )
}
