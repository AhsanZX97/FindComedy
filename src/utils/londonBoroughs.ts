export const LONDON_BOROUGHS = [
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley',
  'Camden', 'City of London', 'Croydon', 'Ealing', 'Enfield',
  'Greenwich', 'Hackney', 'Hammersmith and Fulham', 'Haringey', 'Harrow',
  'Havering', 'Hillingdon', 'Hounslow', 'Islington', 'Kensington and Chelsea',
  'Kingston upon Thames', 'Lambeth', 'Lewisham', 'Merton', 'Newham',
  'Redbridge', 'Richmond upon Thames', 'Southwark', 'Sutton', 'Tower Hamlets',
  'Waltham Forest', 'Wandsworth', 'Westminster',
] as const

export type LondonBorough = typeof LONDON_BOROUGHS[number]

// Neighbourhoods and districts → their official London borough
const AREA_TO_BOROUGH: Record<string, LondonBorough> = {
  // Barking and Dagenham
  'Barking': 'Barking and Dagenham',
  'Dagenham': 'Barking and Dagenham',
  // Barnet
  'Barnet': 'Barnet',
  'Finchley': 'Barnet',
  'Golders Green': 'Barnet',
  'Hendon': 'Barnet',
  'Whetstone': 'Barnet',
  'East Barnet': 'Barnet',
  // Bexley
  'Bexley': 'Bexley',
  'Bexleyheath': 'Bexley',
  'Sidcup': 'Bexley',
  'Erith': 'Bexley',
  // Brent
  'Brent': 'Brent',
  'Wembley': 'Brent',
  'Harlesden': 'Brent',
  'Willesden': 'Brent',
  'Neasden': 'Brent',
  'Kilburn': 'Brent',
  // Bromley
  'Bromley': 'Bromley',
  'Beckenham': 'Bromley',
  'Orpington': 'Bromley',
  'Penge': 'Bromley',
  // Camden
  'Camden': 'Camden',
  'Kentish Town': 'Camden',
  'Chalk Farm': 'Camden',
  'Belsize Park': 'Camden',
  'Hampstead': 'Camden',
  'Holborn': 'Camden',
  'Bloomsbury': 'Camden',
  "King's Cross": 'Camden',
  'Kings Cross': 'Camden',
  'Swiss Cottage': 'Camden',
  'Gospel Oak': 'Camden',
  'Fitzrovia': 'Camden',
  'Primrose Hill': 'Camden',
  'West Hampstead': 'Camden',
  // City of London
  'City of London': 'City of London',
  'The City': 'City of London',
  // Croydon
  'Croydon': 'Croydon',
  'South Croydon': 'Croydon',
  'Thornton Heath': 'Croydon',
  // Ealing
  'Ealing': 'Ealing',
  'Acton': 'Ealing',
  'Southall': 'Ealing',
  'Hanwell': 'Ealing',
  // Enfield
  'Enfield': 'Enfield',
  'Edmonton': 'Enfield',
  // Greenwich
  'Greenwich': 'Greenwich',
  'Woolwich': 'Greenwich',
  'Eltham': 'Greenwich',
  'Charlton': 'Greenwich',
  'Plumstead': 'Greenwich',
  'Abbey Wood': 'Greenwich',
  // Hackney
  'Hackney': 'Hackney',
  'Dalston': 'Hackney',
  'Stoke Newington': 'Hackney',
  'Shoreditch': 'Hackney',
  'Homerton': 'Hackney',
  'Clapton': 'Hackney',
  'Haggerston': 'Hackney',
  'London Fields': 'Hackney',
  'De Beauvoir Town': 'Hackney',
  // Hammersmith and Fulham
  'Hammersmith': 'Hammersmith and Fulham',
  'Fulham': 'Hammersmith and Fulham',
  "Shepherd's Bush": 'Hammersmith and Fulham',
  'Shepherds Bush': 'Hammersmith and Fulham',
  'Parsons Green': 'Hammersmith and Fulham',
  'Barons Court': 'Hammersmith and Fulham',
  // Haringey
  'Haringey': 'Haringey',
  'Tottenham': 'Haringey',
  'Wood Green': 'Haringey',
  'Hornsey': 'Haringey',
  'Muswell Hill': 'Haringey',
  'Crouch End': 'Haringey',
  'Highgate': 'Haringey',
  'Stroud Green': 'Haringey',
  // Harrow
  'Harrow': 'Harrow',
  'Pinner': 'Harrow',
  'Stanmore': 'Harrow',
  // Havering
  'Havering': 'Havering',
  'Romford': 'Havering',
  'Hornchurch': 'Havering',
  // Hillingdon
  'Hillingdon': 'Hillingdon',
  'Uxbridge': 'Hillingdon',
  'Hayes': 'Hillingdon',
  // Hounslow
  'Hounslow': 'Hounslow',
  'Chiswick': 'Hounslow',
  'Brentford': 'Hounslow',
  'Isleworth': 'Hounslow',
  'Feltham': 'Hounslow',
  // Islington
  'Islington': 'Islington',
  'Angel': 'Islington',
  'Highbury': 'Islington',
  'Canonbury': 'Islington',
  'Clerkenwell': 'Islington',
  'Finsbury': 'Islington',
  'Barnsbury': 'Islington',
  'Exmouth Market': 'Islington',
  // Kensington and Chelsea
  'Kensington': 'Kensington and Chelsea',
  'Chelsea': 'Kensington and Chelsea',
  "Earl's Court": 'Kensington and Chelsea',
  'Earls Court': 'Kensington and Chelsea',
  'Notting Hill': 'Kensington and Chelsea',
  'Ladbroke Grove': 'Kensington and Chelsea',
  'South Kensington': 'Kensington and Chelsea',
  'North Kensington': 'Kensington and Chelsea',
  // Kingston upon Thames
  'Kingston upon Thames': 'Kingston upon Thames',
  'Kingston': 'Kingston upon Thames',
  'Surbiton': 'Kingston upon Thames',
  'New Malden': 'Kingston upon Thames',
  // Lambeth
  'Lambeth': 'Lambeth',
  'Brixton': 'Lambeth',
  'Clapham': 'Lambeth',
  'Streatham': 'Lambeth',
  'Stockwell': 'Lambeth',
  'Kennington': 'Lambeth',
  'Vauxhall': 'Lambeth',
  'West Norwood': 'Lambeth',
  'Herne Hill': 'Lambeth',
  'Tulse Hill': 'Lambeth',
  'West Dulwich': 'Lambeth',
  "Waterloo": 'Lambeth',
  // Lewisham
  'Lewisham': 'Lewisham',
  'Deptford': 'Lewisham',
  'New Cross': 'Lewisham',
  'Catford': 'Lewisham',
  'Forest Hill': 'Lewisham',
  'Blackheath': 'Lewisham',
  'Brockley': 'Lewisham',
  'Honor Oak': 'Lewisham',
  'Sydenham': 'Lewisham',
  // Merton
  'Merton': 'Merton',
  'Wimbledon': 'Merton',
  'Mitcham': 'Merton',
  'Morden': 'Merton',
  // Newham
  'Newham': 'Newham',
  'Stratford': 'Newham',
  'West Ham': 'Newham',
  'East Ham': 'Newham',
  'Plaistow': 'Newham',
  'Forest Gate': 'Newham',
  // Redbridge
  'Redbridge': 'Redbridge',
  'Ilford': 'Redbridge',
  // Richmond upon Thames
  'Richmond upon Thames': 'Richmond upon Thames',
  'Richmond': 'Richmond upon Thames',
  'Twickenham': 'Richmond upon Thames',
  'Teddington': 'Richmond upon Thames',
  // Southwark
  'Southwark': 'Southwark',
  'Camberwell': 'Southwark',
  'Peckham': 'Southwark',
  'Borough': 'Southwark',
  'Bermondsey': 'Southwark',
  'Elephant and Castle': 'Southwark',
  'Elephant Park': 'Southwark',
  'Nunhead': 'Southwark',
  'East Dulwich': 'Southwark',
  'Dulwich': 'Southwark',
  'Old Kent Road': 'Southwark',
  'London Bridge': 'Southwark',
  // Sutton
  'Sutton': 'Sutton',
  'Carshalton': 'Sutton',
  // Tower Hamlets
  'Tower Hamlets': 'Tower Hamlets',
  'Whitechapel': 'Tower Hamlets',
  'Mile End': 'Tower Hamlets',
  'Bow': 'Tower Hamlets',
  'Poplar': 'Tower Hamlets',
  'Stepney': 'Tower Hamlets',
  'Wapping': 'Tower Hamlets',
  'Limehouse': 'Tower Hamlets',
  'Bethnal Green': 'Tower Hamlets',
  'Canary Wharf': 'Tower Hamlets',
  'Shadwell': 'Tower Hamlets',
  'Spitalfields': 'Tower Hamlets',
  // Waltham Forest
  'Waltham Forest': 'Waltham Forest',
  'Walthamstow': 'Waltham Forest',
  'Leyton': 'Waltham Forest',
  'Leytonstone': 'Waltham Forest',
  'Chingford': 'Waltham Forest',
  // Wandsworth
  'Wandsworth': 'Wandsworth',
  'Battersea': 'Wandsworth',
  'Tooting': 'Wandsworth',
  'Balham': 'Wandsworth',
  'Putney': 'Wandsworth',
  'Clapham South': 'Wandsworth',
  'Earlsfield': 'Wandsworth',
  'Southfields': 'Wandsworth',
  // Westminster
  'Westminster': 'Westminster',
  'Soho': 'Westminster',
  'Mayfair': 'Westminster',
  'Paddington': 'Westminster',
  'Marylebone': 'Westminster',
  'Pimlico': 'Westminster',
  'Victoria': 'Westminster',
  'Covent Garden': 'Westminster',
  'St James': 'Westminster',
  "St James's": 'Westminster',
  'Strand': 'Westminster',
  'Bayswater': 'Westminster',
  'Little Venice': 'Westminster',
}

/** Map any London neighbourhood or district name to its official borough. Returns null if unrecognised. */
export function normalizeToBorough(area: string): LondonBorough | null {
  if (!area) return null
  const direct = AREA_TO_BOROUGH[area]
  if (direct) return direct
  const lower = area.toLowerCase()
  for (const [key, val] of Object.entries(AREA_TO_BOROUGH)) {
    if (key.toLowerCase() === lower) return val
  }
  // Already a borough name
  if ((LONDON_BOROUGHS as readonly string[]).includes(area)) return area as LondonBorough
  return null
}

/** Strip Nominatim's "London Borough of X" / "Royal Borough of X" prefix to get a clean borough name. */
export function parseBoroughFromNominatim(raw: string): LondonBorough | null {
  const cleaned = raw
    .replace(/^London Borough of /i, '')
    .replace(/^Royal Borough of /i, '')
    .trim()
  if ((LONDON_BOROUGHS as readonly string[]).includes(cleaned)) return cleaned as LondonBorough
  return null
}
