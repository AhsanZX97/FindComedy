import { Link } from 'react-router-dom'
import { HOME_SEO_SECTIONS } from '../../utils/homeSeo'

export default function HomeSeoContent() {
  return (
    <section aria-labelledby="findcomedy-guide" className="border-t border-gray-200 dark:border-zinc-800 px-4 py-8">
      <div className="max-w-prose space-y-8">
        <h2 id="findcomedy-guide" className="font-display text-2xl font-bold text-gray-900 dark:text-white text-balance">
          London comedy, without the guesswork
        </h2>
        {HOME_SEO_SECTIONS.map((section) => (
          <div key={section.heading} className="space-y-2">
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white text-balance">{section.heading}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400 text-pretty">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to="/comedy" className="font-medium text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-400 dark:hover:text-amber-300">
            Browse by borough
          </Link>
          <Link to="/guides" className="font-medium text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-400 dark:hover:text-amber-300">
            Read comedy guides
          </Link>
          <Link to="/submit" className="font-medium text-amber-700 hover:text-amber-800 hover:underline dark:text-amber-400 dark:hover:text-amber-300">
            Submit a night
          </Link>
        </div>
      </div>
    </section>
  )
}
