import restaurants from '../data/black-pearl-official-restaurants-geocoded.json'

const diamondOptions = [0, 1, 2, 3]
const labelsByLocale = {
  en: {
    allCities: 'All Cities',
    allCuisines: 'All Cuisines',
    unknownCuisine: 'Unknown Cuisine',
    maxCostPlaceholder: 'Max ¥/person',
    diamondLabel: (count) => `${'◆'.repeat(count)} (${count})`,
    allDiamonds: 'All Diamonds',
  },
  zh: {
    allCities: '全部城市',
    allCuisines: '全部菜系',
    unknownCuisine: '未知菜系',
    maxCostPlaceholder: '人均最高 ¥',
    diamondLabel: (count) => `${count}钻`,
    allDiamonds: '全部钻级',
  },
}

function getCityOptions(locale) {
  const options = new Map()

  for (const restaurant of restaurants) {
    if (!restaurant.city || options.has(restaurant.city)) {
      continue
    }

    options.set(restaurant.city, {
      value: restaurant.city,
      label: locale === 'zh' ? restaurant.city_zh || restaurant.city : restaurant.city,
    })
  }

  return [...options.values()].sort((a, b) =>
    a.label.localeCompare(b.label, locale === 'zh' ? 'zh' : 'en')
  )
}

function getCuisineOptions(locale) {
  const options = new Map()

  for (const restaurant of restaurants) {
    const value = restaurant.cuisine || '(Unknown)'
    if (options.has(value)) {
      continue
    }

    options.set(value, {
      value,
      label:
        locale === 'zh'
          ? restaurant.cuisine_zh || labelsByLocale.zh.unknownCuisine
          : restaurant.cuisine || labelsByLocale.en.unknownCuisine,
    })
  }

  return [...options.values()].sort((a, b) => {
    if (a.value === '(Unknown)') return 1
    if (b.value === '(Unknown)') return -1
    return a.label.localeCompare(b.label, locale === 'zh' ? 'zh' : 'en')
  })
}

export default function FilterBar({ filters, onChange, locale }) {
  const labels = labelsByLocale[locale]
  const cities = getCityOptions(locale)
  const cuisines = getCuisineOptions(locale)

  return (
    <div className="flex flex-wrap gap-3 px-4 py-3">
      {/* City filter */}
      <select
        value={filters.city}
        onChange={(e) => onChange({ ...filters, city: e.target.value })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
      >
        <option value="">{labels.allCities}</option>
        {cities.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {/* Cuisine filter */}
      <select
        value={filters.cuisine}
        onChange={(e) => onChange({ ...filters, cuisine: e.target.value })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
      >
        <option value="">{labels.allCuisines}</option>
        {cuisines.map((cuisine) => (
          <option key={cuisine.value} value={cuisine.value}>
            {cuisine.label}
          </option>
        ))}
      </select>

      {/* Diamond filter */}
      <select
        value={filters.diamonds}
        onChange={(e) => onChange({ ...filters, diamonds: Number(e.target.value) })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
      >
        <option value={0}>{labels.allDiamonds}</option>
        {diamondOptions.slice(1).map((d) => (
          <option key={d} value={d}>{labels.diamondLabel(d)}</option>
        ))}
      </select>

      {/* Max cost filter */}
      <input
        type="number"
        placeholder={labels.maxCostPlaceholder}
        value={filters.maxCost || ''}
        onChange={(e) => onChange({ ...filters, maxCost: e.target.value ? Number(e.target.value) : 0 })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white w-32"
      />
    </div>
  )
}
