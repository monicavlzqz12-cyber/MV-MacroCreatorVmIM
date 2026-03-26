'use client'

import { useMemo } from 'react'

interface DataPoint {
  label: string
  value: number
}

interface RevenueChartProps {
  data: DataPoint[]
  symbol: string
}

export function RevenueChart({ data, symbol }: RevenueChartProps) {
  const { points, max, gridLines } = useMemo(() => {
    const vals = data.map((d) => d.value)
    const maxVal = Math.max(...vals, 1)
    // Round up to a nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)))
    const rounded = Math.ceil(maxVal / magnitude) * magnitude
    const lines = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(rounded * t))

    const W = 600
    const H = 180
    const PAD_L = 56
    const PAD_R = 16
    const PAD_T = 12
    const PAD_B = 32
    const plotW = W - PAD_L - PAD_R
    const plotH = H - PAD_T - PAD_B

    const pts = data.map((d, i) => ({
      x: PAD_L + (i / Math.max(data.length - 1, 1)) * plotW,
      y: PAD_T + plotH - (d.value / rounded) * plotH,
      value: d.value,
      label: d.label,
    }))

    return { points: pts, max: rounded, gridLines: lines, W, H, PAD_L, PAD_R, PAD_T, PAD_B, plotW, plotH }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
        No revenue data yet
      </div>
    )
  }

  const { W, H, PAD_L, PAD_T, PAD_B, plotH } = points.length > 0
    ? { W: 600, H: 180, PAD_L: 56, PAD_T: 12, PAD_B: 32, plotH: 180 - 12 - 32 }
    : { W: 600, H: 180, PAD_L: 56, PAD_T: 12, PAD_B: 32, plotH: 136 }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1]!.x} ${PAD_T + plotH} L ${points[0]!.x} ${PAD_T + plotH} Z`
    : ''

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Revenue over time"
    >
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((val, i) => {
        const y = PAD_T + plotH - (val / max) * plotH
        return (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={y}
              x2={W - 16}
              y2={y}
              stroke="hsl(220 13% 91%)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="9"
              fill="hsl(215 16% 47%)"
            >
              {val >= 1000 ? `${symbol}${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `${symbol}${val}`}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#revGrad)" />}

      {/* Line */}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="hsl(221 83% 53%)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Points + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="hsl(221 83% 53%)" />
          <text
            x={p.x}
            y={PAD_T + plotH + PAD_B - 6}
            textAnchor="middle"
            fontSize="9"
            fill="hsl(215 16% 47%)"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
