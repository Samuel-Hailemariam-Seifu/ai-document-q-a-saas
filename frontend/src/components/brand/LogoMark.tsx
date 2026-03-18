import type { ComponentProps } from 'react'

type Props = {
  size?: number
  variant?: 'default' | 'light'
} & Omit<ComponentProps<'svg'>, 'width' | 'height' | 'viewBox' | 'xmlns'>

export function LogoMark({ size = 32, variant = 'default', className, ...rest }: Props) {
  const fillOpacity = variant === 'light' ? 0.85 : 1
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <defs>
        <linearGradient
          id="documind-premium-g"
          x1="4"
          y1="4"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1d4ed8" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      {/* Document: rounded rectangle */}
      <rect
        x="6"
        y="6"
        width="22"
        height="28"
        rx="6"
        fill="url(#documind-premium-g)"
        fillOpacity={fillOpacity}
      />
      {/* Text lines */}
      <rect x="11" y="14" width="10" height="1.5" rx="0.75" fill="white" fillOpacity="0.95" />
      <rect x="11" y="18" width="13" height="1.5" rx="0.75" fill="white" fillOpacity="0.8" />
      <rect x="11" y="22" width="8" height="1.5" rx="0.75" fill="white" fillOpacity="0.65" />
      {/* Mind / AI spark */}
      <circle cx="28" cy="12" r="5" fill="white" />
      <circle cx="28" cy="12" r="2.5" fill="url(#documind-premium-g)" />
    </svg>
  )
}
