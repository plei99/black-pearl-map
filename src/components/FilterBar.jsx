import { useEffect, useRef } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
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
    searchPlaceholder: 'Search a location',
    clearLocation: 'Clear',
    locationUnavailable: 'Location search requires Google Maps',
    sortedFrom: 'Sorted from',
  },
  zh: {
    allCities: '全部城市',
    allCuisines: '全部菜系',
    unknownCuisine: '未知菜系',
    maxCostPlaceholder: '人均最高 ¥',
    diamondLabel: (count) => `${count}钻`,
    allDiamonds: '全部钻级',
    searchPlaceholder: '搜索地点',
    clearLocation: '清除',
    locationUnavailable: '地点搜索需要 Google Maps',
    sortedFrom: '按此地点距离排序',
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

function OriginSearch({ locale, theme, origin, onOriginChange }) {
  const labels = labelsByLocale[locale]
  const places = useMapsLibrary('places')
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    if (!places || !inputRef.current || autocompleteRef.current) {
      return
    }

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const location = place.geometry?.location

      if (!location) {
        return
      }

      onOriginChange({
        name: place.name || place.formatted_address || '',
        address: place.formatted_address || '',
        location: {
          lat: location.lat(),
          lng: location.lng(),
        },
      })
    })

    autocompleteRef.current = autocomplete
  }, [onOriginChange, places])

  useEffect(() => {
    if (!inputRef.current) {
      return
    }

    inputRef.current.value = origin?.address || origin?.name || ''
  }, [origin])

  return (
    <div className="w-full flex flex-wrap gap-3">
      <input
        ref={inputRef}
        type="text"
        placeholder={labels.searchPlaceholder}
        className={`flex-1 min-w-[220px] rounded-lg border px-3 py-2 text-sm ${
          theme === 'dark'
            ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500'
            : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
        }`}
      />
      {origin ? (
        <button
          type="button"
          onClick={() => {
            onOriginChange(null)
            if (inputRef.current) {
              inputRef.current.value = ''
            }
          }}
          className={`rounded-lg border px-3 py-2 text-sm ${
            theme === 'dark'
              ? 'border-slate-700 bg-slate-900 text-slate-200'
              : 'border-gray-200 bg-white text-gray-700'
          }`}
        >
          {labels.clearLocation}
        </button>
      ) : null}
    </div>
  )
}

export default function FilterBar({ filters, onChange, locale, theme, origin, onOriginChange, mapsEnabled }) {
  const labels = labelsByLocale[locale]
  const cities = getCityOptions(locale)
  const cuisines = getCuisineOptions(locale)
  const controlClass = `rounded-lg border px-3 py-2 text-sm ${
    theme === 'dark'
      ? 'border-slate-700 bg-slate-900 text-slate-100'
      : 'border-gray-200 bg-white text-gray-900'
  }`

  return (
    <div className="flex flex-wrap gap-3 px-4 py-3">
      {mapsEnabled ? (
        <OriginSearch locale={locale} theme={theme} origin={origin} onOriginChange={onOriginChange} />
      ) : (
        <input
          type="text"
          placeholder={labels.locationUnavailable}
          disabled
          className={`w-full rounded-lg border px-3 py-2 text-sm ${
            theme === 'dark'
              ? 'border-slate-800 bg-slate-900 text-slate-500'
              : 'border-gray-200 bg-gray-100 text-gray-400'
          }`}
        />
      )}
      {origin ? (
        <p className={`w-full text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
          {labels.sortedFrom}: {origin.address || origin.name}
        </p>
      ) : null}
      {/* City filter */}
      <select
        value={filters.city}
        onChange={(e) => onChange({ ...filters, city: e.target.value })}
        className={controlClass}
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
        className={controlClass}
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
        className={controlClass}
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
        className={`${controlClass} w-32`}
      />
    </div>
  )
}
