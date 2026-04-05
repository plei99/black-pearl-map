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
