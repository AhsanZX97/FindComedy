import { useState, useEffect, useCallback } from 'react'
import {
  getReviewsForNight,
  getUserReviewForNight,
  upsertReview,
  deleteReview,
} from '../../services/reviewsService'
import { isSupabaseConfigured } from '../../services/supabase'
import type { Review, VibeTag } from '../../types/comedyNight'
import { ALL_VIBE_TAGS, VIBE_TAG_LABELS } from '../../types/comedyNight'

type FormState = 'idle' | 'open' | 'submitting' | 'error'

interface ReviewsSectionProps {
  nightId: string
  userId: string | null
  displayName: string
  onAuthRequired: () => void
}

function TagPill({ tag, count, selected, onClick }: {
  tag: VibeTag
  count?: number
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={!onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors
        ${selected
          ? 'bg-amber-500 text-zinc-950'
          : onClick
            ? 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700 hover:ring-amber-500 hover:text-amber-300'
            : 'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700 cursor-default'
        }`}
    >
      {VIBE_TAG_LABELS[tag]}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] px-1 rounded-full ${selected ? 'bg-amber-700 text-amber-100' : 'bg-zinc-700 text-zinc-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

export default function ReviewsSection({
  nightId,
  userId,
  displayName,
  onAuthRequired,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [formState, setFormState] = useState<FormState>('idle')
  const [selectedTags, setSelectedTags] = useState<Set<VibeTag>>(new Set())
  const [note, setNote] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    const all = await getReviewsForNight(nightId)
    setReviews(all)
    if (userId) {
      const mine = await getUserReviewForNight(userId, nightId)
      setUserReview(mine)
      if (mine) {
        setSelectedTags(new Set(mine.tags))
        setNote(mine.note ?? '')
      }
    }
  }, [nightId, userId])

  useEffect(() => { void load() }, [load])

  const tagCounts = reviews.reduce<Record<string, number>>((acc, r) => {
    for (const tag of r.tags) acc[tag] = (acc[tag] ?? 0) + 1
    return acc
  }, {})

  const topTags = ALL_VIBE_TAGS
    .filter((t) => tagCounts[t])
    .sort((a, b) => (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0))

  function toggleTag(tag: VibeTag) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  function openForm() {
    if (!userId) { onAuthRequired(); return }
    setFormState('open')
  }

  function cancelForm() {
    setFormState('idle')
    if (userReview) {
      setSelectedTags(new Set(userReview.tags))
      setNote(userReview.note ?? '')
    } else {
      setSelectedTags(new Set())
      setNote('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || selectedTags.size === 0) return
    setFormState('submitting')
    try {
      await upsertReview(userId, nightId, displayName, [...selectedTags], note || undefined)
      await load()
      setFormState('idle')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setFormState('error')
    }
  }

  async function handleDelete() {
    if (!userId) return
    try {
      await deleteReview(userId, nightId)
      setUserReview(null)
      setSelectedTags(new Set())
      setNote('')
      await load()
      setFormState('idle')
    } catch {
      /* swallow — the review stays visible */
    }
  }

  if (!isSupabaseConfigured) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Vibes</h2>

      {/* Aggregate tags */}
      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topTags.map((tag) => (
            <TagPill key={tag} tag={tag} count={tagCounts[tag]} />
          ))}
        </div>
      )}

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div className="flex flex-col gap-2">
          {reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{r.displayName ?? 'Anonymous'}</span>
                <span className="text-xs text-zinc-600">
                  {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">
                    {VIBE_TAG_LABELS[tag]}
                  </span>
                ))}
              </div>
              {r.note && <p className="text-sm text-zinc-300">{r.note}</p>}
            </div>
          ))}
        </div>
      )}

      {/* CTA / form */}
      {formState === 'idle' && (
        <div className="flex items-center gap-3">
          <button
            onClick={openForm}
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            {userReview ? 'Edit your review' : '+ Leave a vibe check'}
          </button>
          {userReview && (
            <button
              onClick={handleDelete}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Remove review
            </button>
          )}
        </div>
      )}

      {(formState === 'open' || formState === 'submitting' || formState === 'error') && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {userReview ? 'Update your vibe check' : 'Your vibe check'}
          </p>

          <div className="flex flex-wrap gap-2">
            {ALL_VIBE_TAGS.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                selected={selectedTags.has(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Anything else worth knowing…"
              className="w-full rounded-lg bg-zinc-800 ring-1 ring-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-amber-500 resize-none"
            />
          </div>

          {formState === 'error' && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedTags.size === 0 || formState === 'submitting'}
              className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {formState === 'submitting' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 && formState === 'idle' && (
        <p className="text-sm text-zinc-600">No reviews yet. Be the first!</p>
      )}
    </section>
  )
}
