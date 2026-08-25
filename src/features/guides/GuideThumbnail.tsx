import MicIcon from './MicIcon'

export interface GuideThumbnailProps {
  imageUrl?: string
  alt: string
  className: string
  iconClassName?: string
  /** 'contain' for a padded logo/badge image; 'cover' for a real venue photo that should fill the frame. */
  fit?: 'cover' | 'contain'
  credit?: { label: string; url: string }
}

/** A night's own photo/logo when it has one, otherwise a plain branded placeholder — no stock imagery. */
export default function GuideThumbnail({ imageUrl, alt, className, iconClassName, fit = 'cover', credit }: GuideThumbnailProps) {
  if (imageUrl) {
    return (
      <div className={`${className} relative overflow-hidden bg-gray-100 dark:bg-zinc-800`}>
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          className={`h-full w-full ${fit === 'contain' ? 'object-contain p-4' : 'object-cover object-top'}`}
        />
        {credit && (
          <a
            href={credit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white hover:bg-black/80 transition-colors"
          >
            {credit.label}
          </a>
        )}
      </div>
    )
  }
  return (
    <div className={`${className} flex items-center justify-center bg-amber-100 dark:bg-amber-900/30`}>
      <MicIcon className={iconClassName ?? 'h-8 w-8 text-amber-500 dark:text-amber-400'} />
    </div>
  )
}
