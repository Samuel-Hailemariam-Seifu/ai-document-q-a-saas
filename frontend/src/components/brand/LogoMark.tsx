import type { ComponentProps } from 'react'

type Props = {
  size?: number
} & Omit<ComponentProps<'svg'>, 'width' | 'height' | 'viewBox' | 'xmlns'>

export function LogoMark({ size = 32, className, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <defs>
        <linearGradient id="documind_g" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#documind_g)" />
      <path
        d="M34.5 13.5c-7.1 2.4-9.6 4.9-12 12-2.4-7.1-4.9-9.6-12-12 7.1-2.4 9.6-4.9 12-12 2.4 7.1 4.9 9.6 12 12Z"
        fill="white"
        opacity="0.95"
        transform="translate(0 18)"
      />
      <path
        d="M49.2 31.6c-4.4 1.5-5.9 3-7.4 7.4-1.5-4.4-3-5.9-7.4-7.4 4.4-1.5 5.9-3 7.4-7.4 1.5 4.4 3 5.9 7.4 7.4Z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  )
}

