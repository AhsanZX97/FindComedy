import type { GuideArticle } from '../types/guide'

const guides: GuideArticle[] = [
  {
    slug: 'best-cheap-comedy-clubs-hackney',
    city: 'Hackney',
    areaSlug: 'hackney',
    title: 'Best Cheap Comedy Clubs in Hackney',
    hook: 'Three cheap comedy nights actually running in Hackney right now. Free or pay-what-you-want, no ticket needed.',
    metaTitle: 'Best Cheap Comedy Clubs in Hackney, London | FindComedy',
    metaDescription:
      "Cheap and free comedy nights in Hackney, London, with prices, schedules and what to expect at three of the borough's most popular shows.",
    publishedDate: '2026-08-25',
    intro:
      "Hackney's comedy scene runs out of pub back rooms more than proper clubs, and entry is usually free or pay-what-you-want. These three are some of the most popular shows, with what they cost and how to get in.",
    venues: [
      {
        nightId: 'comedy-incorporated-off-the-cuff',
        editorialNote:
          'Runs four nights a week across the city. Tuesday is the Hackney leg. Reserve a free seat online and watch, or bring a guest to get booked a spot yourself. Wheelchair accessible.',
        priceNote: 'Free (reserve a seat)',
        image: {
          url: '/guides/comedy-incorporated.jpg',
          credit: 'Comedy Incorporated',
          creditUrl: 'https://www.instagram.com/comedyincorporated/',
        },
      },
      {
        nightId: 'misfit-comedy-night-shoreditch-balls',
        editorialNote:
          "Stand-up, clowning, sketch and music in one weird, wide-ranging bill, good for an audience that wants more than straight stand-up. Acts bring a guest, though longer sets don't need to.",
        priceNote: 'Pay-what-you-want',
        caveat:
          'Small pub shows like this can move or pause with little notice, so check their Instagram on the day before you head down.',
        image: {
          url: '/guides/misfit-comedy-night.jpg',
          credit: 'Misfit Comedy Night',
          creditUrl: 'https://www.instagram.com/misfitcomedynight/',
        },
      },
      {
        nightId: 'comedy-at-the-hum-86-stoke-newington-h',
        editorialNote:
          'A new-material night, so entry is free for the audience while acts bring a guest to earn their spot instead of paying a fee. Good for watching a set take shape. Fortnightly Thursdays in Stoke Newington.',
        priceNote: 'Free (bringer/new-material night)',
        image: {
          url: '/guides/comedy-at-the-hum.jpg',
          credit: 'Comedy at The Hum',
          creditUrl: 'https://www.instagram.com/comedyatthehum/',
        },
      },
    ],
    closingNote: 'Every comedy night listed in Hackney is on the borough page, not just these three.',
  },
]

export function listGuides(): GuideArticle[] {
  return guides
}

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return guides.find((g) => g.slug === slug)
}
