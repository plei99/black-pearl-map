import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = "src/data/black-pearl-official-restaurants-geocoded.json";
const DEFAULT_OUTPUT = "src/data/black-pearl-official-restaurants-geocoded.json";
const DEFAULT_OVERRIDES = "src/data/black-pearl-geocoding-overrides.json";
const DEFAULT_DELAY_MS = 120;

function printHelp() {
  console.log(`Retry Google geocoding only for Black Pearl restaurants still missing coordinates.

Usage:
  node scripts/retry-black-pearl-geocoding.mjs [options]

Options:
  --input=path        Input geocoded JSON file
  --output=path       Output JSON file
  --api-key=value     Google API key
  --limit=number      Only retry the first N missing restaurants
  --delay-ms=number   Delay between requests
  --help              Show this help

Defaults:
  --input=${DEFAULT_INPUT}
  --output=${DEFAULT_OUTPUT}
  --delay-ms=${DEFAULT_DELAY_MS}

API key lookup order:
  1. --api-key
  2. GOOGLE_MAPS_API_KEY
  3. VITE_GOOGLE_MAPS_API_KEY
  4. .env.local / .env values for those names`);
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    apiKey: "",
    limit: null,
    delayMs: DEFAULT_DELAY_MS,
  };

  for (const arg of argv) {
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    if (arg.startsWith("--input=")) {
      options.input = arg.slice("--input=".length);
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length);
      continue;
    }

    if (arg.startsWith("--api-key=")) {
      options.apiKey = arg.slice("--api-key=".length);
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const limit = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error(`Invalid --limit value: ${arg}`);
      }
      options.limit = limit;
      continue;
    }

    if (arg.startsWith("--delay-ms=")) {
      const delayMs = Number(arg.slice("--delay-ms=".length));
      if (!Number.isInteger(delayMs) || delayMs < 0) {
        throw new Error(`Invalid --delay-ms value: ${arg}`);
      }
      options.delayMs = delayMs;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadEnvFile(filePath) {
  if (!(await fileExists(filePath))) {
    return {};
  }

  const content = await readFile(filePath, "utf8");
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function resolveApiKey(explicitApiKey) {
  if (explicitApiKey) {
    return { apiKey: explicitApiKey, source: "--api-key", isViteKey: false };
  }

  if (process.env.GOOGLE_MAPS_API_KEY) {
    return { apiKey: process.env.GOOGLE_MAPS_API_KEY, source: "GOOGLE_MAPS_API_KEY", isViteKey: false };
  }

  if (process.env.VITE_GOOGLE_MAPS_API_KEY) {
    return { apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY, source: "VITE_GOOGLE_MAPS_API_KEY", isViteKey: true };
  }

  const cwd = process.cwd();
  const envLocal = await loadEnvFile(path.join(cwd, ".env.local"));
  if (envLocal.GOOGLE_MAPS_API_KEY) {
    return { apiKey: envLocal.GOOGLE_MAPS_API_KEY, source: ".env.local GOOGLE_MAPS_API_KEY", isViteKey: false };
  }
  if (envLocal.VITE_GOOGLE_MAPS_API_KEY) {
    return { apiKey: envLocal.VITE_GOOGLE_MAPS_API_KEY, source: ".env.local VITE_GOOGLE_MAPS_API_KEY", isViteKey: true };
  }

  const env = await loadEnvFile(path.join(cwd, ".env"));
  if (env.GOOGLE_MAPS_API_KEY) {
    return { apiKey: env.GOOGLE_MAPS_API_KEY, source: ".env GOOGLE_MAPS_API_KEY", isViteKey: false };
  }
  if (env.VITE_GOOGLE_MAPS_API_KEY) {
    return { apiKey: env.VITE_GOOGLE_MAPS_API_KEY, source: ".env VITE_GOOGLE_MAPS_API_KEY", isViteKey: true };
  }

  return { apiKey: "", source: "", isViteKey: false };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasCoordinates(restaurant) {
  return Boolean(
    restaurant.location &&
      typeof restaurant.location.lat === "number" &&
      typeof restaurant.location.lng === "number"
  );
}

function buildQuery(restaurant) {
  return [restaurant.name, restaurant.city, restaurant.country].filter(Boolean).join(", ");
}

async function geocode(query, apiKey) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.status) {
    throw new Error("Geocoding response missing status");
  }

  return json;
}

async function loadOverrides() {
  const overridesPath = path.resolve(process.cwd(), DEFAULT_OVERRIDES);
  if (!(await fileExists(overridesPath))) {
    return [];
  }

  return JSON.parse(await readFile(overridesPath, "utf8"));
}

function applyOverrides(restaurants, overrides) {
  if (!Array.isArray(overrides) || overrides.length === 0) {
    return restaurants;
  }

  const overrideMap = new Map(
    overrides
      .filter((override) => override?.source_shop_id)
      .map((override) => [String(override.source_shop_id), override])
  );

  return restaurants.map((restaurant) => {
    const override = overrideMap.get(String(restaurant.source_shop_id));
    if (!override) {
      return restaurant;
    }

    return {
      ...restaurant,
      location: override.location ?? restaurant.location ?? null,
      geocoding: {
        ...(restaurant.geocoding ?? {}),
        ...(override.geocoding ?? {}),
      },
    };
  });
}

function extractMatch(result) {
  const location = result?.geometry?.location;
  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
    return null;
  }

  return {
    location: {
      lat: location.lat,
      lng: location.lng,
    },
    geocoding: {
      matched_address: result.formatted_address ?? null,
      place_id: result.place_id ?? null,
      result_types: Array.isArray(result.types) ? result.types : [],
      location_type: result.geometry?.location_type ?? null,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { apiKey, source, isViteKey } = await resolveApiKey(options.apiKey);

  if (!apiKey) {
    throw new Error("Missing Google Maps API key. Pass --api-key or set GOOGLE_MAPS_API_KEY. VITE_GOOGLE_MAPS_API_KEY is only a fallback for local testing.");
  }

  console.log(`Using API key from ${source}`);

  if (isViteKey) {
    console.warn(
      "Warning: using VITE_GOOGLE_MAPS_API_KEY for server-side geocoding. Browser keys are often referrer-restricted and may return REQUEST_DENIED. Prefer GOOGLE_MAPS_API_KEY."
    );
  }

  const inputPath = path.resolve(process.cwd(), options.input);
  const outputPath = path.resolve(process.cwd(), options.output);
  const inputData = JSON.parse(await readFile(inputPath, "utf8"));
  const overrides = await loadOverrides();
  const missingIndexes = inputData
    .map((restaurant, index) => ({ restaurant, index }))
    .filter(({ restaurant }) => !hasCoordinates(restaurant));
  const targets = options.limit ? missingIndexes.slice(0, options.limit) : missingIndexes;

  console.log(`Found ${missingIndexes.length} restaurants missing coordinates`);
  console.log(`Retrying ${targets.length} restaurants`);

  const counters = {
    ok: 0,
    zero: 0,
    error: 0,
  };

  for (let index = 0; index < targets.length; index += 1) {
    const { restaurant, index: sourceIndex } = targets[index];
    const query = buildQuery(restaurant);

    process.stdout.write(`[${index + 1}/${targets.length}] ${query}\n`);

    try {
      const payload = await geocode(query, apiKey);
      const firstResult = payload.results?.[0];
      const match = extractMatch(firstResult);

      if (payload.status === "OK" && match) {
        counters.ok += 1;
        inputData[sourceIndex] = {
          ...restaurant,
          ...match,
          geocoding: {
            ...match.geocoding,
            query,
            status: payload.status,
          },
        };
      } else {
        if (payload.status === "ZERO_RESULTS") {
          counters.zero += 1;
        } else {
          counters.error += 1;
        }

        inputData[sourceIndex] = {
          ...restaurant,
          location: null,
          geocoding: {
            query,
            status: payload.status,
            matched_address: null,
            place_id: null,
            result_types: [],
            location_type: null,
          },
        };
      }
    } catch (error) {
      counters.error += 1;
      inputData[sourceIndex] = {
        ...restaurant,
        location: null,
        geocoding: {
          query,
          status: "REQUEST_ERROR",
          matched_address: null,
          place_id: null,
          result_types: [],
          location_type: null,
          error_message: error instanceof Error ? error.message : String(error),
        },
      };
    }

    if (options.delayMs > 0 && index < targets.length - 1) {
      await sleep(options.delayMs);
    }
  }

  const finalResults = applyOverrides(inputData, overrides);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(finalResults, null, 2)}\n`, "utf8");

  console.log(`Wrote ${finalResults.length} restaurants to ${outputPath}`);
  console.log(`Retried OK: ${counters.ok}`);
  console.log(`Retried zero results: ${counters.zero}`);
  console.log(`Retried errors: ${counters.error}`);
  console.log(`Manual overrides applied: ${overrides.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
