interface FavouriteButtonProps {
  isFavourited: boolean
  onToggle: () => void
  isLoggedIn: boolean
  onAuthRequired: () => void
  size?: 'small' | 'large'
}

export default function FavouriteButton({
  isFavourited,
  onToggle,
  isLoggedIn,
  onAuthRequired,
  size = 'small',
}: FavouriteButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      onAuthRequired()
      return
    }
    onToggle()
  }

  const label = isFavourited ? 'Remove from favourites' : 'Add to favourites'
  const sizeClass = size === 'large' ? 'p-2 text-xl' : 'p-1.5 text-base'

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`rounded-lg transition-colors ${sizeClass} ${
        isFavourited
          ? 'text-amber-500 hover:text-amber-600'
          : 'text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400'
      }`}
    >
      {isFavourited ? '♥' : '♡'}
    </button>
  )
}
