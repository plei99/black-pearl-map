import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { useState } from 'react'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function RestaurantMarkers({ restaurants }) {
  const [selected, setSelected] = useState(null)

  return (
    <>
      {restaurants.map((r) => (
        <AdvancedMarker
          key={r.id}
          position={{ lat: r.location.lat, lng: r.location.lng }}
          onClick={() => setSelected(r)}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.location.lat, lng: selected.location.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="text-sm">
            <p className="font-semibold">{selected.name}</p>
            <p className="text-gray-500">{selected.cuisine} · ¥{selected.cost_per_person}/person</p>
            <p className="text-amber-500">{'◆'.repeat(selected.diamonds)}</p>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

function Placeholder({ restaurants }) {
  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
      <div className="text-center px-4">
        <p className="text-2xl mb-2">🗺️</p>
        <p className="font-medium text-gray-500">Google Maps</p>
        <p>
          {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} ready to display
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Set <code className="bg-gray-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in .env.local to enable
        </p>
      </div>
    </div>
  )
}

const defaultCenter = { lat: 31.23, lng: 121.47 }

export default function RestaurantMap({ restaurants }) {
  if (!API_KEY) {
    return <Placeholder restaurants={restaurants} />
  }

  const center = restaurants.length > 0
    ? { lat: restaurants[0].location.lat, lng: restaurants[0].location.lng }
    : defaultCenter

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 h-[350px]">
      <APIProvider apiKey={API_KEY}>
        <Map defaultCenter={center} defaultZoom={12} mapId="black-pearl-map">
          <RestaurantMarkers restaurants={restaurants} />
        </Map>
      </APIProvider>
    </div>
  )
}
