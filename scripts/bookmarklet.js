/**
 * Black Pearl Restaurant Extractor
 * Run this in the DevTools console on the Black Pearl Meituan page
 * (e.g., https://blackpearl.meituan.com/home/en/home/1)
 *
 * It extracts visible restaurants and copies JSON matching our app's schema to your clipboard.
 */

(function() {
  const restaurants = [];
  
  // Meituan's React/Vue apps often store data in the window object (like window.__INITIAL_STATE__)
  // We'll attempt to pull from there first, as the DOM can be highly obfuscated.
  if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.poiList) {
    const rawList = window.__INITIAL_STATE__.poiList;
    
    rawList.forEach((r, idx) => {
      restaurants.push({
        id: idx + 1,
        name: r.name || r.frontName || '',
        cuisine: r.frontImgDesc || r.cateName || 'Unknown',
        cost_per_person: parseInt(r.avgPrice) || 0,
        location: {
          lat: parseFloat(r.latitude) || 0,
          lng: parseFloat(r.longitude) || 0
        },
        city: r.cityName || '',
        diamonds: parseInt(r.diamond) || 1
      });
    });
  } else {
    // Fallback: If __INITIAL_STATE__ isn't accessible, warn the user.
    // Note: Scraping the DOM directly on Meituan is extremely brittle due to hashed CSS class names (e.g. ._1X2y_).
    console.error("Black Pearl Map: Could not find window.__INITIAL_STATE__.poiList. Meituan may have updated their data structure.");
    return;
  }

  const jsonOutput = JSON.stringify(restaurants, null, 2);
  
  // Create a temporary textarea to copy the JSON to clipboard
  const el = document.createElement('textarea');
  el.value = jsonOutput;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);

  console.log(`✅ Success! Copied ${restaurants.length} restaurants to your clipboard.`);
  console.log("Paste the contents into: /Users/patrick/Documents/black-pearl-map/src/data/restaurants.json");
})();