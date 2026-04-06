import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://apimeishi.meituan.com";
const DEFAULT_LANGUAGE = "en";
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

function parseCityAndCountry(shopCountryCityName) {
  const parts = String(shopCountryCityName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { city: "", country: "" };
  }

  if (parts.length === 1) {
    return { city: parts[0], country: "" };
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
  const { city, country } = parseCityAndCountry(shop.shopCountryCityName);

  return {
    id: toId(shop.shopId),
    name: shop.shopName,
    cuisine: shop.cateName,
    cost_per_person: parsePrice(shop.avgPriceDisplay),
    location: null,
    city,
    country,
    diamonds: shop.diamondLevel,
    avg_price_display: shop.avgPriceDisplay ?? null,
    image_url: shop.imageUrl ?? null,
    official_url: `https://blackpearl.meituan.com/home/${language}/restaurant-detail?shopId=${shop.shopId}`,
    source_shop_id: String(shop.shopId),
    source_language: language,
    source_location_label: shop.shopCountryCityName ?? null,
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
  const { totalCount, restaurants } = await fetchAllRestaurants(options);
  const normalized = restaurants.map((shop) => normalizeRestaurant(shop, options.language));
  const outputPath = path.resolve(process.cwd(), options.out);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  console.log(`Wrote ${normalized.length} restaurants to ${outputPath}`);
  console.log(`API reported totalCount=${totalCount}`);
  console.log(`Selector city total=${selectors.countryCityInfoList?.reduce((sum, item) => sum + (item.shopCount ?? 0), 0) ?? "n/a"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
