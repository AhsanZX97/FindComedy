interface GoingButtonProps {
  goingCount: number
  isGoing: boolean
  onToggle: () => void
  isLoggedIn: boolean
  onAuthRequired: () => void
}

export default function GoingButton({
  goingCount,
  isGoing,
  onToggle,
  isLoggedIn,
  onAuthRequired,
}: GoingButtonProps) {
  function handleClick() {
    if (!isLoggedIn) {
      onAuthRequired()
      return
    }
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
        isGoing
          ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
          : 'bg-zinc-900 ring-1 ring-zinc-700 text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      {isGoing ? '✓ Going' : "I'm going"}
      {goingCount > 0 && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-normal ${
            isGoing ? 'bg-amber-600 text-amber-100' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {goingCount}
        </span>
      )}
    </button>
  )
}
