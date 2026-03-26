import * as React from 'react'
import { cn } from '../utils'

export interface SpinnerProps extends React.SVGAttributes<SVGElement> {
  size?: number
}

function Spinner({ className, size = 24, ...props }: SpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('animate-spin', className)}
      aria-label="Loading"
      role="status"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        className="opacity-25"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export { Spinner }
