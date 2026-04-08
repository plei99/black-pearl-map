const diamondLabel = (count) => '◆'.repeat(count) + '◇'.repeat(3 - count)
const labelsByLocale = {
  en: {
    person: '/ person',
    unknownCuisine: 'Unknown Cuisine',
    kmAway: 'km away',
    metersAway: 'm away',
  },
  zh: {
    person: '/ 人',
    unknownCuisine: '未知菜系',
    kmAway: '公里',
    metersAway: '米',
  },
}

function getPrimaryName(restaurant, locale) {
  if (locale === 'zh') {
    return restaurant.name_zh || restaurant.name
  }

  return restaurant.name || restaurant.name_zh
}

function getSecondaryName(restaurant, locale) {
  const primary = getPrimaryName(restaurant, locale)
  const secondary = locale === 'zh' ? restaurant.name : restaurant.name_zh

  return secondary && secondary !== primary ? secondary : null
}

function formatDistance(distanceMeters, locale, labels) {
  if (distanceMeters == null) {
    return null
  }

  if (distanceMeters < 1000) {
    const rounded = Math.round(distanceMeters / 10) * 10
    return `${rounded}${labels.metersAway}`
  }

  const rounded = distanceMeters < 10000
    ? (distanceMeters / 1000).toFixed(1)
    : Math.round(distanceMeters / 1000).toString()

  return `${rounded}${labels.kmAway}`
}

export default function RestaurantCard({ restaurant, locale, theme }) {
  const labels = labelsByLocale[locale]
  const primaryName = getPrimaryName(restaurant, locale)
  const secondaryName = getSecondaryName(restaurant, locale)
  const cuisine =
    locale === 'zh'
      ? restaurant.cuisine_zh || labels.unknownCuisine
      : restaurant.cuisine || labels.unknownCuisine
  const city = locale === 'zh' ? restaurant.city_zh || restaurant.city : restaurant.city
  const officialUrl =
    (locale === 'zh' ? restaurant.official_url_zh : restaurant.official_url_en) ||
    restaurant.official_url
  const distanceLabel = formatDistance(restaurant.distance_meters, locale, labels)

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${
      theme === 'dark'
        ? 'border-slate-800 bg-slate-900 shadow-black/20'
        : 'border-gray-100 bg-white shadow-sm'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold leading-snug">
            {officialUrl ? (
              <a
                href={officialUrl}
                target="_blank"
                rel="noreferrer"
                className={`underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current ${
                  theme === 'dark' ? 'text-slate-100 hover:text-amber-300' : 'text-gray-900 hover:text-amber-700'
                }`}
              >
                {primaryName}
              </a>
            ) : (
              <span className={theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}>{primaryName}</span>
            )}
          </h3>
          {secondaryName ? (
            <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
              {secondaryName}
            </p>
          ) : null}
        </div>
        <span className="text-amber-500 tracking-wider shrink-0 ml-2" title={`${restaurant.diamonds} diamond`}>
          {diamondLabel(restaurant.diamonds)}
        </span>
      </div>
      <div className={`flex flex-wrap gap-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-500'}`}>
        {distanceLabel ? (
          <span className={`px-2 py-0.5 rounded ${
            theme === 'dark' ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700'
          }`}>
            {distanceLabel}
          </span>
        ) : null}
        <span className={`px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>{cuisine}</span>
        <span className={`px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>{city}</span>
      </div>
      <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
        ¥{restaurant.cost_per_person} {labels.person}
      </p>
    </div>
  )
}
