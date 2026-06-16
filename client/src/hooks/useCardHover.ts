import { useState } from 'react'

export function useCardHover() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const getHoverProps = (id: string) => ({
    onMouseEnter: () => setHoveredCard(id),
    onMouseLeave: () => setHoveredCard(null),
  })

  const getHoverStyle = (id: string, color: string) => ({
    transform: hoveredCard === id ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
    backdropFilter: hoveredCard === id ? 'blur(12px)' : 'blur(0px)',
    boxShadow: hoveredCard === id ? `0 8px 32px ${color}40, inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  })

  return { hoveredCard, getHoverProps, getHoverStyle }
}
