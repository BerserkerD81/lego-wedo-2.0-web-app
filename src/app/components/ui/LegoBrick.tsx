export const BRICK_COLORS = {
  yellow: { fill: '#FCD34D', dark: '#D97706' },
  blue:   { fill: '#60A5FA', dark: '#1D4ED8' },
  red:    { fill: '#F87171', dark: '#B91C1C' },
  green:  { fill: '#4ADE80', dark: '#15803D' },
  purple: { fill: '#C084FC', dark: '#7E22CE' },
  cyan:   { fill: '#67E8F9', dark: '#0E7490' },
  pink:   { fill: '#F472B6', dark: '#BE185D' },
} as const

export type BrickColor = keyof typeof BRICK_COLORS

export function LegoBrick({ color = 'yellow', className = '' }: { color?: BrickColor; className?: string }) {
  const { fill, dark } = BRICK_COLORS[color]
  return (
    <svg viewBox="0 0 64 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      {/* Body depth */}
      <rect x="2" y="23" width="60" height="23" rx="6" fill={dark}/>
      {/* Main body */}
      <rect x="0" y="18" width="60" height="24" rx="6" fill={fill}/>
      {/* Top highlight */}
      <rect x="0" y="18" width="60" height="8" rx="6" fill="rgba(255,255,255,0.18)"/>

      {/* Left stud — cylinder side */}
      <rect x="9" y="10" width="16" height="11" fill={dark}/>
      {/* Left stud — top ellipse */}
      <ellipse cx="17" cy="10" rx="8" ry="5" fill={fill}/>
      {/* Left stud — highlight arc */}
      <ellipse cx="15" cy="8.5" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.28)"/>
      {/* Left stud — hollow center */}
      <circle cx="17" cy="10" r="2.8" fill={dark}/>

      {/* Right stud — cylinder side */}
      <rect x="35" y="10" width="16" height="11" fill={dark}/>
      {/* Right stud — top ellipse */}
      <ellipse cx="43" cy="10" rx="8" ry="5" fill={fill}/>
      {/* Right stud — highlight arc */}
      <ellipse cx="41" cy="8.5" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.28)"/>
      {/* Right stud — hollow center */}
      <circle cx="43" cy="10" r="2.8" fill={dark}/>
    </svg>
  )
}
