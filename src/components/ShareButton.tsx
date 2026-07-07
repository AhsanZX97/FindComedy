import { useEffect, useState } from 'react'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      // Clipboard unavailable (permissions / insecure context) — nothing to copy to
    }
  }

  return (
    <button
      onClick={() => void handleCopy()}
      className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium"
      aria-label="Copy link to this page"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
