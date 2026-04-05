/**
 * Placeholder for the Amap (Gaode) map view.
 *
 * To integrate, load the Amap JS API via <script> in index.html:
 *   <script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY"></script>
 *
 * Then replace this component with a real map using:
 *   const map = new AMap.Map(containerRef.current, { zoom: 12, center: [lng, lat] })
 *   restaurants.forEach(r => new AMap.Marker({ position: [r.location.lng, r.location.lat], map }))
 */
export default function MapPlaceholder({ restaurants }) {
  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
      <div className="text-center px-4">
        <p className="text-2xl mb-2">🗺️</p>
        <p className="font-medium text-gray-500">Amap Integration</p>
        <p>
          {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} ready to display
        </p>
        <p className="mt-2 text-xs text-gray-400">Add your Gaode API key to enable the map</p>
      </div>
    </div>
  )
}
