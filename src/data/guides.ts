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
  {
    slug: 'cheap-free-open-mics-camden',
    city: 'Camden',
    areaSlug: 'camden',
    title: 'Cheap Comedy and Open Mics in Camden',
    hook: 'A £6 comedy-and-drink deal, plus Camden open mics with current booking details.',
    metaTitle: 'Cheap Comedy and Open Mics in Camden, London | FindComedy',
    metaDescription:
      'Cheap comedy and open mics in Camden, London, including a £6 comedy-and-drink deal, performer booking details and the current venue information.',
    publishedDate: '2026-09-01',
    intro:
      'Camden has a low-cost midweek stand-up option and several open mics for people who want to watch or book a short set. Prices can change quickly at pub venues, so the listings without a current ticket price are marked clearly.',
    venues: [
      {
        nightId: 'comedy-in-your-eye-the-camden-eye',
        editorialNote:
          'The Tuesday new-act and new-material show sits alongside the regular comedy programme. It works for an audience after a midweek show, while performers can use the booking link for the new-material night.',
        priceNote: '£6 entry and drink deal',
        image: {
          url: '/guides/comedy-in-your-eye-camden.jpg',
          credit: 'Comedy in Your Eye',
          creditUrl: 'https://www.instagram.com/comedyinyoureye/',
        },
      },
      {
        nightId: 'funny-fix-163-royal-college-st',
        editorialNote:
          'Funny Fix runs a biweekly Monday open mic at the Prince Albert. The bill is a useful option for an audience who wants a local pub night, and performers can ask for a place by direct message.',
        priceNote: 'Price not currently published',
        caveat:
          'The latest public flyer did not state an entry price, so check the Instagram page before travelling or arranging a spot.',
        image: {
          url: '/guides/funny-fix-camden.jpg',
          credit: 'Funny Fix',
          creditUrl: 'https://www.instagram.com/funnyfix1/',
        },
      },
      {
        nightId: 'hot-comedy-chalk-farm',
        editorialNote:
          'Hot Comedy has a Tuesday new-act slot at Hot Toddy\'s on Camden High Street. It gives newer and experienced acts a place to try material, while audience members can catch a smaller room than the usual weekend circuit.',
        priceNote: 'Price not currently published',
        caveat:
          'The venue promotes several comedy formats during the week, so check the current listing for the Tuesday open mic and its entry price before you go.',
        image: {
          url: '/guides/hot-comedy-camden.jpg',
          credit: "Hot Toddy's - Camden",
          creditUrl: 'https://www.instagram.com/hottoddyscamden/',
        },
      },
    ],
    closingNote: 'The Camden borough page has the full list of comedy nights, including other open mics and ticketed shows.',
  },
]

export function listGuides(): GuideArticle[] {
  return [...guides].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
}

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return guides.find((g) => g.slug === slug)
}
