import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const labelsByLocale = {
  en: {
    mapTitle: 'Google Maps',
    readyToDisplay: (count) => `${count} restaurant${count !== 1 ? 's' : ''} ready to display`,
    enableMap: 'Set',
    enableMapSuffix: 'in .env.local to enable',
    person: '/ person',
    unknownCuisine: 'Unknown Cuisine',
  },
  zh: {
    mapTitle: 'Google 地图',
    readyToDisplay: (count) => `已准备显示 ${count} 家餐厅`,
    enableMap: '请在 .env.local 中设置',
    enableMapSuffix: '以启用地图',
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

function RestaurantMarkers({ restaurants, locale }) {
  const [selected, setSelected] = useState(null)
  const labels = labelsByLocale[locale]
  const withLocation = restaurants.filter((r) => r.location)

  return (
    <>
      {withLocation.map((r) => (
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
            <p className="font-semibold">{getPrimaryName(selected, locale)}</p>
            <p className="text-gray-500">
              {(locale === 'zh' ? selected.cuisine_zh : selected.cuisine) || labels.unknownCuisine}
              {' · '}
              ¥{selected.cost_per_person}{labels.person}
            </p>
            <p className="text-amber-500">{'◆'.repeat(selected.diamonds)}</p>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

function MapViewportController({ restaurants }) {
  const map = useMap()

  useEffect(() => {
    if (!map) {
      return
    }

    const withLocation = restaurants.filter((r) => r.location)

    if (withLocation.length === 0) {
      map.setCenter(defaultCenter)
      map.setZoom(12)
      return
    }

    if (withLocation.length === 1) {
      map.setCenter(withLocation[0].location)
      map.setZoom(14)
      return
    }

    const bounds = new window.google.maps.LatLngBounds()

    for (const restaurant of withLocation) {
      bounds.extend(restaurant.location)
    }

    map.fitBounds(bounds, 64)
  }, [map, restaurants])

  return null
}

function Placeholder({ restaurants, locale }) {
  const labels = labelsByLocale[locale]

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
      <div className="text-center px-4">
        <p className="text-2xl mb-2">🗺️</p>
        <p className="font-medium text-gray-500">{labels.mapTitle}</p>
        <p>{labels.readyToDisplay(restaurants.length)}</p>
        <p className="mt-2 text-xs text-gray-400">
          {labels.enableMap}{' '}
          <code className="bg-gray-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
          {labels.enableMapSuffix}
        </p>
      </div>
    </div>
  )
}

const defaultCenter = { lat: 31.23, lng: 121.47 }

export default function RestaurantMap({ restaurants, locale }) {
  if (!API_KEY) {
    return <Placeholder restaurants={restaurants} locale={locale} />
  }

  const withLocation = restaurants.filter((r) => r.location)
  const center = withLocation.length > 0
    ? { lat: withLocation[0].location.lat, lng: withLocation[0].location.lng }
    : defaultCenter

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 h-[350px]">
      <APIProvider apiKey={API_KEY}>
        <Map defaultCenter={center} defaultZoom={12} mapId="ef6f1470cfa22b05e28e5c62">
          <MapViewportController restaurants={restaurants} />
          <RestaurantMarkers restaurants={restaurants} locale={locale} />
        </Map>
      </APIProvider>
    </div>
  )
}
