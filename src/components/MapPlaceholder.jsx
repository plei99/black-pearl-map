import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
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
    origin: 'Selected location',
  },
  zh: {
    mapTitle: 'Google 地图',
    readyToDisplay: (count) => `已准备显示 ${count} 家餐厅`,
    enableMap: '请在 .env.local 中设置',
    enableMapSuffix: '以启用地图',
    person: '/ 人',
    unknownCuisine: '未知菜系',
    origin: '所选地点',
  },
}

function getPrimaryName(restaurant, locale) {
  if (locale === 'zh') {
    return restaurant.name_zh || restaurant.name
  }

  return restaurant.name || restaurant.name_zh
}

function RestaurantMarkers({ restaurants, locale, theme, origin }) {
  const [selected, setSelected] = useState(null)
  const labels = labelsByLocale[locale]
  const withLocation = restaurants.filter((r) => r.location)

  return (
    <>
      {origin?.location ? (
        <AdvancedMarker position={origin.location} title={labels.origin}>
          <div className={`rounded-full border-2 px-2 py-1 text-xs font-semibold ${
            theme === 'dark'
              ? 'border-amber-300 bg-amber-300 text-slate-900'
              : 'border-amber-600 bg-amber-500 text-white'
          }`}>
            ●
          </div>
        </AdvancedMarker>
      ) : null}
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
          <div className={`text-sm ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
            <p className="font-semibold">{getPrimaryName(selected, locale)}</p>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}>
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

function MapViewportController({ restaurants, origin }) {
  const map = useMap()

  useEffect(() => {
    if (!map) {
      return
    }

    const withLocation = restaurants.filter((r) => r.location)

    if (withLocation.length === 0 && !origin?.location) {
      map.setCenter(defaultCenter)
      map.setZoom(12)
      return
    }

    if (withLocation.length === 0 && origin?.location) {
      map.setCenter(origin.location)
      map.setZoom(14)
      return
    }

    if (withLocation.length === 1 && !origin?.location) {
      map.setCenter(withLocation[0].location)
      map.setZoom(14)
      return
    }

    const bounds = new window.google.maps.LatLngBounds()

    if (origin?.location) {
      bounds.extend(origin.location)
    }

    for (const restaurant of withLocation) {
      bounds.extend(restaurant.location)
    }

    map.fitBounds(bounds, 64)
  }, [map, restaurants, origin])

  return null
}

function Placeholder({ restaurants, locale, theme }) {
  const labels = labelsByLocale[locale]

  return (
    <div className={`rounded-xl border flex items-center justify-center min-h-[300px] text-sm ${
      theme === 'dark'
        ? 'border-slate-800 bg-slate-900 text-slate-400'
        : 'border-gray-200 bg-gray-100 text-gray-400'
    }`}>
      <div className="text-center px-4">
        <p className="text-2xl mb-2">🗺️</p>
        <p className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-500'}`}>{labels.mapTitle}</p>
        <p>{labels.readyToDisplay(restaurants.length)}</p>
        <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
          {labels.enableMap}{' '}
          <code className={`px-1 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'}`}>
            VITE_GOOGLE_MAPS_API_KEY
          </code>{' '}
          {labels.enableMapSuffix}
        </p>
      </div>
    </div>
  )
}

const defaultCenter = { lat: 31.23, lng: 121.47 }

export default function RestaurantMap({ restaurants, locale, theme, origin }) {
  if (!API_KEY) {
    return <Placeholder restaurants={restaurants} locale={locale} theme={theme} />
  }

  const withLocation = restaurants.filter((r) => r.location)
  const center = withLocation.length > 0
    ? { lat: withLocation[0].location.lat, lng: withLocation[0].location.lng }
    : defaultCenter

  return (
    <div className={`rounded-xl overflow-hidden border h-[350px] ${
      theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
    }`}>
      <Map defaultCenter={center} defaultZoom={12} mapId="ef6f1470cfa22b05e28e5c62">
        <MapViewportController restaurants={restaurants} origin={origin} />
        <RestaurantMarkers restaurants={restaurants} locale={locale} theme={theme} origin={origin} />
      </Map>
    </div>
  )
}
