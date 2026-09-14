import type { GuideArticle } from '../types/guide'

const guides: GuideArticle[] = [
  {
    slug: 'cheap-comedy-open-mics-westminster',
    city: 'Westminster',
    areaSlug: 'westminster',
    title: 'Cheap Comedy and Open Mics in Westminster',
    hook: 'A free Covent Garden open mic, £5 new material in Fitzrovia and a £12 gong show near Leicester Square.',
    metaTitle: 'Cheap Comedy and Open Mics in Westminster, London | FindComedy',
    metaDescription:
      'Cheap comedy and open mics in Westminster, London, with current prices, schedules and performer booking details for three central London shows.',
    publishedDate: '2026-09-14',
    intro:
      'Westminster has comedy for three different kinds of Monday or Thursday night out. Virtue Comedy is free in Covent Garden, Fool & Co. starts at £5 in Fitzrovia, and King Gong puts new acts in front of a judging crowd at The Comedy Store from £12.',
    venues: [
      {
        nightId: 'virtue-comedy-the-north-star',
        editorialNote:
          'A free new-act and new-material night at The Long Acre in Covent Garden. Audience members can watch without buying a ticket, while performers apply through GigGag and bring a guest for their spot.',
        priceNote: 'Free entry',
        caveat:
          'Dates are advertised individually, so check the latest Instagram or GigGag listing before travelling.',
        image: {
          url: '/guides/virtue-comedy-westminster.jpg',
          credit: 'Virtue Comedy',
          creditUrl: 'https://www.instagram.com/virtuecomedy/',
        },
      },
      {
        nightId: 'fool-co-60762c83',
        editorialNote:
          'Fool & Co. gives new comics a place to learn and experienced acts a room for fresh material. Doors open at 7pm for a 7.30pm start at The Albany. New performers can apply for a bringer five or one of the limited non-bringer spots.',
        priceNote: 'From £5',
        image: {
          url: '/guides/fool-and-co-westminster.jpg',
          credit: 'Fool & Co.',
          creditUrl: 'https://www.instagram.com/foolandcomedy/',
        },
      },
      {
        nightId: 'king-gong',
        editorialNote:
          'Thirty new comics try to last five minutes at The Comedy Store while three audience judges decide who gets gonged off. It runs on the last Monday of the month, and performers register by email for a spot.',
        priceNote: 'From £12',
        caveat: 'King Gong is strictly 18+, and advance booking is sensible for this ticketed club show.',
        image: {
          url: '/guides/king-gong-westminster-square.png',
          credit: 'The Comedy Store London',
          creditUrl: 'https://london.thecomedystore.co.uk/event/king-gong',
        },
      },
    ],
    closingNote:
      'The Westminster borough page has the full list of comedy nights, including other open mics around Soho and the West End.',
  },
  {
    slug: 'free-comedy-open-mics-islington',
    city: 'Islington',
    areaSlug: 'islington',
    title: 'Free Comedy and Open Mics in Islington',
    hook: 'Three free comedy nights, from a basement in Exmouth Market to a Sunday open mic at North Nineteen.',
    metaTitle: 'Free Comedy and Open Mics in Islington, London | FindComedy',
    metaDescription:
      'Free comedy in Islington at Coin Laundry, the Artillery Arms and North Nineteen, with audience booking advice and open-mic details for performers.',
    publishedDate: '2026-09-08',
    intro:
      'A comedy night in Islington can cost nothing to watch. Slap and Giggle takes over the basement at Coin Laundry, Too Far brings stand-up to the Artillery Arms, and The OM runs a Sunday open mic at North Nineteen. All three offer free entry, with a guest required for performers booking a bringer spot.',
    venues: [
      {
        nightId: 'slap-and-giggle-coin-laundry',
        editorialNote:
          'Reserve a free seat or table for stand-up in the basement at Coin Laundry. The bill mixes newer acts with experienced comics, and the audience clap-off gives one act a prize. Performers apply through the sign-up form and bring a guest for an open-mic spot.',
        priceNote: 'Free (reserve a seat or table)',
        caveat:
          'Slap and Giggle runs at several London venues. Choose the Coin Laundry event when booking and check its date before travelling.',
        image: {
          url: '/guides/slap-and-giggle-islington.jpg',
          credit: 'Slap and Giggle',
          creditUrl: 'https://www.slapandgiggle.com/events',
        },
      },
      {
        nightId: 'too-far-102-bunhill-row',
        editorialNote:
          'A Monday pub show with free entry for the audience. Doors open at 7.15pm, giving you time to settle in before the comedy. Acts book through the monthly form advertised in the Too Far newsletter and bring a guest.',
        priceNote: 'Free entry',
        image: {
          url: '/guides/too-far-islington.jpg',
          credit: 'Too Far Comedy',
          creditUrl: 'https://www.instagram.com/toofarcomedy/',
        },
      },
      {
        nightId: 'the-om-194-sussex-way',
        editorialNote:
          'The OM welcomes first-time comics and acts developing longer sets at North Nineteen. It runs on the first and third Sundays of the month, with free entry for anyone watching. Performers apply through the form linked on Instagram and bring a guest.',
        priceNote: 'Free entry',
        caveat:
          'Check the latest Instagram announcement for the start time before setting off, as advertised times differ between listings.',
        image: {
          url: '/guides/the-om-islington.jpg',
          credit: 'The OM',
          creditUrl: 'https://www.instagram.com/theomcomedyclub/',
        },
      },
    ],
    closingNote:
      'The Islington borough page has more comedy nights, including other open mics and options for acts who cannot bring a guest.',
  },
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
