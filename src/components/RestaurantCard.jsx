const diamondLabel = (count) => '◆'.repeat(count) + '◇'.repeat(3 - count)
const labelsByLocale = {
  en: {
    person: '/ person',
    unknownCuisine: 'Unknown Cuisine',
  },
  zh: {
    person: '/ 人',
    unknownCuisine: '未知菜系',
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

export default function RestaurantCard({ restaurant, locale }) {
  const labels = labelsByLocale[locale]
  const primaryName = getPrimaryName(restaurant, locale)
  const secondaryName = getSecondaryName(restaurant, locale)
  const cuisine =
    locale === 'zh'
      ? restaurant.cuisine_zh || labels.unknownCuisine
      : restaurant.cuisine || labels.unknownCuisine
  const city = locale === 'zh' ? restaurant.city_zh || restaurant.city : restaurant.city

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 leading-snug">{primaryName}</h3>
          {secondaryName ? <p className="text-sm text-gray-500 mt-0.5">{secondaryName}</p> : null}
        </div>
        <span className="text-amber-500 tracking-wider shrink-0 ml-2" title={`${restaurant.diamonds} diamond`}>
          {diamondLabel(restaurant.diamonds)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
        <span className="bg-gray-50 px-2 py-0.5 rounded">{cuisine}</span>
        <span className="bg-gray-50 px-2 py-0.5 rounded">{city}</span>
      </div>
      <p className="text-sm text-gray-600">
        ¥{restaurant.cost_per_person} {labels.person}
      </p>
    </div>
  )
}
