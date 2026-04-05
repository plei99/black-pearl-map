const diamondLabel = (count) => '◆'.repeat(count) + '◇'.repeat(3 - count)

export default function RestaurantCard({ restaurant }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-gray-900 leading-snug">
          {restaurant.name}
        </h3>
        <span className="text-amber-500 tracking-wider shrink-0 ml-2" title={`${restaurant.diamonds} diamond`}>
          {diamondLabel(restaurant.diamonds)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
        <span className="bg-gray-50 px-2 py-0.5 rounded">{restaurant.cuisine}</span>
        <span className="bg-gray-50 px-2 py-0.5 rounded">{restaurant.city}</span>
      </div>
      <p className="text-sm text-gray-600">
        ¥{restaurant.cost_per_person} / person
      </p>
    </div>
  )
}
