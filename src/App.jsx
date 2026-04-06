import { useState, useMemo } from 'react'
import restaurants from './data/black-pearl-official-restaurants-geocoded.json'
import RestaurantCard from './components/RestaurantCard'
import FilterBar from './components/FilterBar'
import RestaurantMap from './components/MapPlaceholder'

const defaultFilters = { city: '', cuisine: '', diamonds: 0, maxCost: 0 }
const localeLabels = {
  en: {
    title: 'Black Pearl Map',
    subtitle: '黑珍珠餐厅地图',
    noResults: 'No restaurants match your filters.',
  },
  zh: {
    title: '黑珍珠餐厅地图',
    subtitle: 'Black Pearl Map',
    noResults: '没有符合筛选条件的餐厅。',
  },
}

export default function App() {
  const [filters, setFilters] = useState(defaultFilters)
  const [locale, setLocale] = useState('zh')
  const labels = localeLabels[locale]

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (filters.city && r.city !== filters.city) return false
      if (filters.cuisine && (r.cuisine || '(Unknown)') !== filters.cuisine) return false
      if (filters.diamonds && r.diamonds !== filters.diamonds) return false
      if (filters.maxCost && r.cost_per_person > filters.maxCost) return false
      return true
    })
  }, [filters])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            {labels.title}
            <span className="text-sm font-normal text-gray-400 ml-2">{labels.subtitle}</span>
          </h1>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setLocale('zh')}
              className={`rounded-md px-3 py-1.5 text-sm ${
                locale === 'zh' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`rounded-md px-3 py-1.5 text-sm ${
                locale === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto pb-8">
        <FilterBar filters={filters} onChange={setFilters} locale={locale} />

        {/* Map */}
        <div className="px-4 mb-4">
          <RestaurantMap restaurants={filtered} locale={locale} />
        </div>

        {/* Restaurant list */}
        <div className="px-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{labels.noResults}</p>
          ) : (
            filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} locale={locale} />)
          )}
        </div>
      </main>
    </div>
  )
}
