import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://apimeishi.meituan.com";
const DEFAULT_LANGUAGE = "en";
const LOCALIZED_LANGUAGES = ["en", "zh"];
const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_OUTPUT = "src/data/black-pearl-official-restaurants.json";

function parseArgs(argv) {
  const options = {
    out: DEFAULT_OUTPUT,
    language: DEFAULT_LANGUAGE,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  for (const arg of argv) {
    if (arg.startsWith("--out=")) {
      options.out = arg.slice("--out=".length);
      continue;
    }

    if (arg.startsWith("--language=")) {
      options.language = arg.slice("--language=".length);
      continue;
    }

    if (arg.startsWith("--page-size=")) {
      const pageSize = Number(arg.slice("--page-size=".length));
      if (!Number.isInteger(pageSize) || pageSize <= 0) {
        throw new Error(`Invalid --page-size value: ${arg}`);
      }
      options.pageSize = pageSize;
      continue;
    }

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Fetch the official Black Pearl restaurant list.

Usage:
  node scripts/import-black-pearl.mjs [--out=path] [--language=en] [--page-size=200]

Defaults:
  --out=${DEFAULT_OUTPUT}
  --language=${DEFAULT_LANGUAGE}
  --page-size=${DEFAULT_PAGE_SIZE}`);
}

async function postJson(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${endpoint}: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.code !== 200) {
    throw new Error(`API returned code ${json.code} for ${endpoint}: ${json.message}`);
  }

  return json.data;
}

function parsePrice(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function normalizeText(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "NULL" || text === "null") {
    return null;
  }

  return text;
}

function parseCityAndCountry(shopCountryCityName, language) {
  const parts = String(shopCountryCityName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { city: "", country: "" };
  }

  if (parts.length === 1) {
    return { city: parts[0], country: "" };
  }

  if (language === "zh") {
    return {
      city: parts.slice(1).join(" "),
      country: parts[0],
    };
  }

  return {
    city: parts.slice(0, -1).join(" "),
    country: parts.at(-1),
  };
}

function toId(shopId) {
  const numeric = Number(shopId);
  return Number.isSafeInteger(numeric) ? numeric : String(shopId);
}

function normalizeRestaurant(shop, language) {
  const { city, country } = parseCityAndCountry(shop.shopCountryCityName, language);

  return {
    id: toId(shop.shopId),
    name: normalizeText(shop.shopName),
    cuisine: normalizeText(shop.cateName),
    cost_per_person: parsePrice(shop.avgPriceDisplay),
    location: null,
    city,
    country,
    diamonds: shop.diamondLevel,
    avg_price_display: normalizeText(shop.avgPriceDisplay),
    image_url: normalizeText(shop.imageUrl),
    official_url: `https://blackpearl.meituan.com/home/${language}/restaurant-detail?shopId=${shop.shopId}`,
    source_shop_id: String(shop.shopId),
    source_language: language,
    source_location_label: normalizeText(shop.shopCountryCityName),
  };
}

function mergeRestaurantVariants(primaryRestaurant, variants) {
  const english = variants.en ?? null;
  const chinese = variants.zh ?? null;
  const fallback = primaryRestaurant ?? english ?? chinese;
  const displayName = primaryRestaurant.name ?? english?.name ?? chinese?.name ?? null;
  const displayCuisine = primaryRestaurant.cuisine ?? english?.cuisine ?? chinese?.cuisine ?? null;
  const displayCity = primaryRestaurant.city ?? english?.city ?? chinese?.city ?? "";
  const displayCountry = primaryRestaurant.country ?? english?.country ?? chinese?.country ?? "";

  return {
    id: fallback.id,
    name: displayName,
    name_en: english?.name ?? null,
    name_zh: chinese?.name ?? null,
    cuisine: displayCuisine,
    cuisine_en: english?.cuisine ?? null,
    cuisine_zh: chinese?.cuisine ?? null,
    cost_per_person:
      primaryRestaurant.cost_per_person ??
      english?.cost_per_person ??
      chinese?.cost_per_person ??
      null,
    location: null,
    city: displayCity,
    city_en: english?.city ?? null,
    city_zh: chinese?.city ?? null,
    country: displayCountry,
    country_en: english?.country ?? null,
    country_zh: chinese?.country ?? null,
    diamonds: primaryRestaurant.diamonds ?? english?.diamonds ?? chinese?.diamonds ?? null,
    avg_price_display:
      primaryRestaurant.avg_price_display ??
      english?.avg_price_display ??
      chinese?.avg_price_display ??
      null,
    image_url: primaryRestaurant.image_url ?? english?.image_url ?? chinese?.image_url ?? null,
    official_url: primaryRestaurant.official_url,
    official_url_en: english?.official_url ?? null,
    official_url_zh: chinese?.official_url ?? null,
    source_shop_id: fallback.source_shop_id,
    source_language: primaryRestaurant.source_language,
    source_location_label: primaryRestaurant.source_location_label,
    source_location_label_en: english?.source_location_label ?? null,
    source_location_label_zh: chinese?.source_location_label ?? null,
  };
}

async function fetchSelectors(language) {
  return postJson("/blackpearl/pc/rank/getSelectorList", {
    pcSelectorRequest: {
      cityId: 0,
      diamondLevel: 0,
      selfCatId: 0,
      newRankShop: 0,
    },
    commonRequest: {
      language,
    },
  });
}

async function fetchRestaurantsPage({ language, pageNum, pageSize }) {
  return postJson("/blackpearl/pc/rank/filterList", {
    pcRankListRequest: {
      cityId: 0,
      sortType: 1,
      lng: 0,
      lat: 0,
      selfCatId: -1,
      newRankShop: 0,
      diamondLevel: 0,
      pageNum,
      pageSize,
    },
    commonRequest: {
      language,
    },
  });
}

async function fetchAllRestaurants({ language, pageSize }) {
  const firstPage = await fetchRestaurantsPage({ language, pageNum: 1, pageSize });
  const totalCount = firstPage.totalCount ?? firstPage.shopList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const restaurants = [...firstPage.shopList];

  for (let pageNum = 2; pageNum <= totalPages; pageNum += 1) {
    const page = await fetchRestaurantsPage({ language, pageNum, pageSize });
    restaurants.push(...page.shopList);
  }

  return {
    totalCount,
    restaurants,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const selectors = await fetchSelectors(options.language);
  const languages = [...new Set([options.language, ...LOCALIZED_LANGUAGES])];
  const restaurantSets = Object.fromEntries(
    await Promise.all(
      languages.map(async (language) => {
        const result = await fetchAllRestaurants({ language, pageSize: options.pageSize });
        return [language, result];
      })
    )
  );
  const { totalCount } = restaurantSets[options.language];
  const normalizedByLanguage = Object.fromEntries(
    languages.map((language) => [
      language,
      restaurantSets[language].restaurants.map((shop) => normalizeRestaurant(shop, language)),
    ])
  );
  const restaurantVariantsByShopId = new Map();

  for (const language of languages) {
    for (const restaurant of normalizedByLanguage[language]) {
      const shopId = String(restaurant.source_shop_id);
      const existing = restaurantVariantsByShopId.get(shopId) ?? {};
      restaurantVariantsByShopId.set(shopId, {
        ...existing,
        [language]: restaurant,
      });
    }
  }

  const normalized = normalizedByLanguage[options.language].map((primaryRestaurant) =>
    mergeRestaurantVariants(
      primaryRestaurant,
      restaurantVariantsByShopId.get(String(primaryRestaurant.source_shop_id)) ?? {}
    )
  );
  const outputPath = path.resolve(process.cwd(), options.out);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  console.log(`Wrote ${normalized.length} restaurants to ${outputPath}`);
  console.log(`API reported totalCount=${totalCount}`);
  console.log(`Selector city total=${selectors.countryCityInfoList?.reduce((sum, item) => sum + (item.shopCount ?? 0), 0) ?? "n/a"}`);
  for (const language of languages) {
    console.log(`Localized records fetched for ${language}: ${restaurantSets[language].restaurants.length}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
