import { APIProvider } from '@vis.gl/react-google-maps'
import { useEffect, useMemo, useState } from 'react'
import restaurants from './data/black-pearl-official-restaurants-geocoded.json'
import RestaurantCard from './components/RestaurantCard'
import FilterBar from './components/FilterBar'
import RestaurantMap from './components/MapPlaceholder'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const defaultFilters = { city: '', cuisine: '', diamonds: 0, maxCost: 0 }
const getSystemTheme = () => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const localeLabels = {
  en: {
    title: 'Black Pearl Map',
    subtitle: '黑珍珠餐厅地图',
    noResults: 'No restaurants match your filters.',
    lightTheme: 'Light',
    darkTheme: 'Dark',
  },
  zh: {
    title: '黑珍珠餐厅地图',
    subtitle: 'Black Pearl Map',
    noResults: '没有符合筛选条件的餐厅。',
    lightTheme: '浅色',
    darkTheme: '深色',
  },
}

const toRadians = (degrees) => (degrees * Math.PI) / 180

const getDistanceMeters = (from, to) => {
  const earthRadiusMeters = 6371000
  const latDelta = toRadians(to.lat - from.lat)
  const lngDelta = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a = Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMeters * c
}

export default function App() {
  const [filters, setFilters] = useState(defaultFilters)
  const [locale, setLocale] = useState('zh')
  const [theme, setTheme] = useState(getSystemTheme)
  const [origin, setOrigin] = useState(null)
  const labels = localeLabels[locale]

  useEffect(() => {
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const filtered = useMemo(() => {
    const filteredRestaurants = restaurants.filter((r) => {
      if (filters.city && r.city !== filters.city) return false
      if (filters.cuisine && (r.cuisine || '(Unknown)') !== filters.cuisine) return false
      if (filters.diamonds && r.diamonds !== filters.diamonds) return false
      if (filters.maxCost && r.cost_per_person > filters.maxCost) return false
      return true
    })

    if (!origin?.location) {
      return filteredRestaurants
    }

    return [...filteredRestaurants]
      .map((restaurant) => ({
        ...restaurant,
        distance_meters: restaurant.location ? getDistanceMeters(origin.location, restaurant.location) : null,
      }))
      .sort((a, b) => {
        if (a.distance_meters == null) return 1
        if (b.distance_meters == null) return -1
        return a.distance_meters - b.distance_meters
      })
  }, [filters, origin])

  const content = (
    <div className={`h-dvh flex flex-col overflow-hidden ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`shrink-0 border-b ${
        theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
            {labels.title}
            <span className={`text-sm font-normal ml-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
              {labels.subtitle}
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded-lg p-1 ${
              theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
            }`}>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  theme === 'light'
                    ? theme === 'dark'
                      ? 'bg-slate-700 text-slate-100 shadow-sm'
                      : 'bg-white text-gray-900 shadow-sm'
                    : theme === 'dark'
                      ? 'text-slate-400'
                      : 'text-gray-500'
                }`}
              >
                {labels.lightTheme}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-100 shadow-sm'
                    : theme === 'dark'
                      ? 'text-slate-400'
                      : 'text-gray-500'
                }`}
              >
                {labels.darkTheme}
              </button>
            </div>
            <div className={`flex items-center gap-1 rounded-lg p-1 ${
              theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
            }`}>
              <button
                type="button"
                onClick={() => setLocale('zh')}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  locale === 'zh'
                    ? theme === 'dark'
                      ? 'bg-slate-700 text-slate-100 shadow-sm'
                      : 'bg-white text-gray-900 shadow-sm'
                    : theme === 'dark'
                      ? 'text-slate-400'
                      : 'text-gray-500'
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  locale === 'en'
                    ? theme === 'dark'
                      ? 'bg-slate-700 text-slate-100 shadow-sm'
                      : 'bg-white text-gray-900 shadow-sm'
                    : theme === 'dark'
                      ? 'text-slate-400'
                      : 'text-gray-500'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full flex-1 min-h-0 flex flex-col">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          locale={locale}
          theme={theme}
          origin={origin}
          onOriginChange={setOrigin}
          mapsEnabled={Boolean(API_KEY)}
        />

        {/* Map */}
        <div className="px-4 mb-4 shrink-0">
          <RestaurantMap restaurants={filtered} locale={locale} theme={theme} origin={origin} />
        </div>

        {/* Restaurant list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
          {filtered.length === 0 ? (
            <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
              {labels.noResults}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} locale={locale} theme={theme} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )

  return API_KEY ? <APIProvider apiKey={API_KEY}>{content}</APIProvider> : content
}
