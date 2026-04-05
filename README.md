# Black Pearl Restaurant Map (黑珍珠餐厅地图)

A web application to aid restaurant selection in Chinese cities by pulling data from the Black Pearl Restaurant Guide (黑珍珠餐厅指南) and filtering restaurants by cuisine type, cost, and distance from a given location.

## Tech Stack
- **Frontend**: React + Vite (Pure Web)
- **Styling**: Tailwind CSS v4
- **Maps**: Amap (Gaode / 高德地图) Web JS API
- **Data**: Static JSON dataset (to bypass Dianping anti-scraping limits)
- **Hosting**: Netlify (with China mainland integration)

## Getting Started

```bash
npm install
npm run dev
```

## Amap Integration

To enable the map, get an API key from the Gaode Open Platform and uncomment the script tag in `index.html`:

```html
<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY"></script>
```

Then replace `src/components/MapPlaceholder.jsx` with a real Amap component.

## Future Goals
- Potential pivot to WeChat Mini Program.
