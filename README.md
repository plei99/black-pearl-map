# Black Pearl Restaurant Map (黑珍珠餐厅地图)

A web application to aid restaurant selection in Chinese cities by pulling data from the Black Pearl Restaurant Guide (黑珍珠餐厅指南) and filtering restaurants by cuisine type, cost, and distance from a given location.

## Tech Stack
- **Frontend**: React + Vite (Pure Web)
- **Styling**: Tailwind CSS v4
- **Maps**: Google Maps (via `@vis.gl/react-google-maps`)
- **Data**: Static JSON dataset (to bypass Dianping anti-scraping limits)
- **Hosting**: Netlify (with China mainland integration)

## Getting Started

```bash
npm install
npm run dev
```

## Refresh Official Black Pearl Data

Fetch the current official restaurant list from Meituan's Black Pearl site and write a normalized JSON file:

```bash
npm run import:black-pearl
```

By default this writes to `src/data/black-pearl-official-restaurants.json` and leaves `src/data/restaurants.json` unchanged.

Optional flags:

```bash
node scripts/import-black-pearl.mjs --out=src/data/custom-black-pearl.json --language=en
```

## Geocode Coordinates With Google

Enrich the official list with `location.lat/lng` using the Google Geocoding API:

```bash
npm run geocode:black-pearl
```

The script reads `VITE_GOOGLE_MAPS_API_KEY` or `GOOGLE_MAPS_API_KEY` from your shell, `.env.local`, or `.env`, and writes a separate reviewable file:

```text
src/data/black-pearl-official-restaurants-geocoded.json
```

Recommended key split:

- `VITE_GOOGLE_MAPS_API_KEY`: browser key for the map, usually restricted by HTTP referrer, with `Maps JavaScript API`
- `GOOGLE_MAPS_API_KEY`: server key for the geocoding script, usually restricted by IP address, with `Geocoding API`

Preferred usage:

```bash
GOOGLE_MAPS_API_KEY=your_server_key npm run geocode:black-pearl
```

Useful options:

```bash
node scripts/geocode-black-pearl.mjs --limit=20 --delay-ms=200
node scripts/geocode-black-pearl.mjs --input=src/data/black-pearl-official-restaurants.json --output=src/data/black-pearl-geocoded-sample.json
```

Because the official list API does not expose public coordinates, this script geocodes `restaurant name + city + country`. Some matches will need manual review, so the output also stores Google match metadata such as `matched_address`, `place_id`, and `location_type`.
If [src/data/black-pearl-geocoding-overrides.json](/Users/patrick/Documents/black-pearl-map/src/data/black-pearl-geocoding-overrides.json) exists, manual overrides from that file are applied automatically after geocoding.

## Retry Missing Coordinates

If a previous geocoding pass left some rows with `location: null`, retry only those rows:

```bash
GOOGLE_MAPS_API_KEY=your_server_key npm run retry-geocode:black-pearl
```

Useful options:

```bash
node scripts/retry-black-pearl-geocoding.mjs --limit=10
node scripts/retry-black-pearl-geocoding.mjs --input=src/data/black-pearl-official-restaurants-geocoded.json --output=src/data/black-pearl-official-restaurants-geocoded.json
```

For permanent fixes to stubborn rows, add entries to [src/data/black-pearl-geocoding-overrides.json](/Users/patrick/Documents/black-pearl-map/src/data/black-pearl-geocoding-overrides.json). Both geocoding scripts apply those overrides automatically.

## Google Maps Setup

1. Get an API key from the [Google Cloud Console](https://console.cloud.google.com/) with the **Maps JavaScript API** enabled.
2. Create a `.env.local` file:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```
3. Restart the dev server — the map will render with restaurant markers.

Without the key, a placeholder is shown instead.

## Future Goals
- Potential pivot to WeChat Mini Program.
