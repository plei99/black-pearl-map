import { useState, useMemo } from 'react'
import restaurants from './data/restaurants.json'
import RestaurantCard from './components/RestaurantCard'
import FilterBar from './components/FilterBar'
import RestaurantMap from './components/MapPlaceholder'

const defaultFilters = { city: '', diamonds: 0, maxCost: 0 }

export default function App() {
  const [filters, setFilters] = useState(defaultFilters)

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (filters.city && r.city !== filters.city) return false
      if (filters.diamonds && r.diamonds !== filters.diamonds) return false
      if (filters.maxCost && r.cost_per_person > filters.maxCost) return false
      return true
    })
  }, [filters])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            黑珍珠餐厅地图
            <span className="text-sm font-normal text-gray-400 ml-2">Black Pearl Map</span>
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto pb-8">
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Map */}
        <div className="px-4 mb-4">
          <RestaurantMap restaurants={filtered} />
        </div>

        {/* Restaurant list */}
        <div className="px-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No restaurants match your filters.</p>
          ) : (
            filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
          )}
        </div>
      </main>
    </div>
  )
}
