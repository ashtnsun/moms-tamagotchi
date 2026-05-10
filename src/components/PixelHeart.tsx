const HEART_PIXELS: [number, number][] = [
  [0,1],[0,2],[0,4],[0,5],
  [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],
  [2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
  [3,1],[3,2],[3,3],[3,4],[3,5],
  [4,2],[4,3],[4,4],
  [5,3],
]

interface Props {
  size?: number
  color?: string
}

export function PixelHeart({ size = 5, color = '#E8394A' }: Props) {
  return (
    <svg
      width={7 * size}
      height={6 * size}
      viewBox={`0 0 ${7 * size} ${6 * size}`}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    >
      {HEART_PIXELS.map(([row, col], i) => (
        <rect key={i} x={col * size} y={row * size} width={size} height={size} fill={color} />
      ))}
    </svg>
  )
}
