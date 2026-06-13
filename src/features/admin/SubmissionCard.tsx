import type { StoredSubmission } from '../../types/comedyNight'

interface SubmissionCardProps {
  sub: StoredSubmission
  className?: string
}

export default function SubmissionCard({ sub, className = '' }: SubmissionCardProps) {
  const d = sub.data

  return (
    <div className={`rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-5 flex flex-col gap-4 transition-all ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{d.name}</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            {d.venueName} · Submitted {new Date(sub.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            sub.status === 'pending'
              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
              : sub.status === 'approved'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
          }`}>
            {sub.status}
          </span>
          {sub.status === 'pending' && (
            <span className="text-xs text-amber-500 font-medium">Review →</span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-zinc-300 line-clamp-3">{d.description}</p>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <dt className="text-gray-400 dark:text-zinc-500">Type</dt><dd className="text-gray-700 dark:text-zinc-300 capitalize">{d.type}</dd>
        <dt className="text-gray-400 dark:text-zinc-500">Schedule</dt><dd className="text-gray-700 dark:text-zinc-300">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.weekday]} {d.startTime}</dd>
        <dt className="text-gray-400 dark:text-zinc-500">Bringer</dt><dd className="text-gray-700 dark:text-zinc-300">{d.bringerRequired ? 'Required' : 'No'}</dd>
        <dt className="text-gray-400 dark:text-zinc-500">Address</dt><dd className="text-gray-700 dark:text-zinc-300 truncate">{d.venueAddress}</dd>
      </dl>

      {sub.submitterNote && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 italic border-l-2 border-amber-400 pl-3">{sub.submitterNote}</p>
      )}
    </div>
  )
}
