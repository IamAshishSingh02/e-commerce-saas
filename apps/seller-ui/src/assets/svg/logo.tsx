export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* outer square */}
      <rect
        x="1"
        y="1"
        width="20"
        height="20"
        rx="10"
        stroke="#1F2937"
        strokeWidth="2"
        fill="#0B0F19"
      />

      {/* grid dots */}
      {[
        [14, 14],
        [20, 14],
        [26, 14],
        [14, 20],
        [20, 20],
        [26, 20],
        [14, 26],
        [20, 26],
        [26, 26],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill="white" />
      ))}
    </svg>
  )
}