import restaurants from '../data/black-pearl-official-restaurants-geocoded.json'

const cities = ['All', ...new Set(restaurants.map((r) => r.city))].sort((a, b) => {
  if (a === 'All') return -1
  if (b === 'All') return 1
  return a.localeCompare(b, 'zh')
})

const cuisines = ['All', ...new Set(restaurants.map((r) => r.cuisine || '(Unknown)'))].sort((a, b) => {
  if (a === 'All') return -1
  if (b === 'All') return 1
  if (a === '(Unknown)') return 1
  if (b === '(Unknown)') return -1
  return a.localeCompare(b, 'zh')
})

const diamondOptions = [0, 1, 2, 3]

export default function FilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 px-4 py-3">
      {/* City filter */}
      <select
        value={filters.city}
        onChange={(e) => onChange({ ...filters, city: e.target.value })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
      >
        {cities.map((c) => (
          <option key={c} value={c === 'All' ? '' : c}>{c}</option>
        ))}
      </select>

      {/* Cuisine filter */}
      <select
        value={filters.cuisine}
        onChange={(e) => onChange({ ...filters, cuisine: e.target.value })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
      >
        {cuisines.map((cuisine) => (
          <option key={cuisine} value={cuisine === 'All' ? '' : cuisine}>
            {cuisine === 'All' ? 'All Cuisines' : cuisine === '(Unknown)' ? 'Unknown Cuisine' : cuisine}
          </option>
        ))}
      </select>

      {/* Diamond filter */}
      <select
        value={filters.diamonds}
        onChange={(e) => onChange({ ...filters, diamonds: Number(e.target.value) })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
      >
        <option value={0}>All Diamonds</option>
        {diamondOptions.slice(1).map((d) => (
          <option key={d} value={d}>{'◆'.repeat(d)} ({d})</option>
        ))}
      </select>

      {/* Max cost filter */}
      <input
        type="number"
        placeholder="Max ¥/person"
        value={filters.maxCost || ''}
        onChange={(e) => onChange({ ...filters, maxCost: e.target.value ? Number(e.target.value) : 0 })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white w-32"
      />
    </div>
  )
}
