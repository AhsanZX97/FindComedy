interface CalendarIconProps {
  className?: string
}

export default function CalendarIcon({ className = 'h-3.5 w-3.5 shrink-0' }: CalendarIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1.5" />
      <path d="M2.25 6.25h11.5M5.25 1.75v2M10.75 1.75v2" />
    </svg>
  )
}
