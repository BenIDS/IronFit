// ═══════════════════════════════════════════════════════════════
// Open Food Facts API client
// - Barcode: legacy /api/v2/product/{code}.json (still reliable)
// - Search:  Search-a-licious API (the modern one; legacy /cgi/search.pl
//            returns 503s on new integrations)
// Docs: https://search.openfoodfacts.org/docs
// ═══════════════════════════════════════════════════════════════

const OFF_UK = "https://uk.openfoodfacts.org";
const OFF_WORLD = "https://world.openfoodfacts.org";
const SEARCH_A_LICIOUS = "https://search.openfoodfacts.org";

export type OFFProduct = {
  barcode: string | null;
  name: string;
  brand: string | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  serving_size_g: number | null;
  image_url: string | null;
  raw_categories: string | null;
};

function parseProduct(p: any): OFFProduct | null {
  if (!p) return null;
  const n = p.nutriments || {};
  const kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] ? Math.round(n["energy_100g"] / 4.184) : null);
  const barcode = p.code || null;

  // search-a-licious returns image URLs relative-ish; build a full URL when we only have a code
  let image_url = p.image_front_small_url || p.image_small_url || p.image_url || null;
  if (!image_url && barcode) {
    // Fallback: OFF hosts images at predictable paths based on the barcode
    const padded = String(barcode).padStart(13, "0");
    const parts = `${padded.slice(0, 3)}/${padded.slice(3, 6)}/${padded.slice(6, 9)}/${padded.slice(9)}`;
    image_url = `https://images.openfoodfacts.org/images/products/${parts}/front_en.100.jpg`;
  }

  return {
    barcode,
    name: p.product_name || p.product_name_en || p.generic_name || "Unknown product",
    brand: p.brands || null,
    kcal_per_100g: kcal != null ? Number(kcal) : null,
    protein_per_100g: n.proteins_100g != null ? Number(n.proteins_100g) : null,
    carbs_per_100g: n.carbohydrates_100g != null ? Number(n.carbohydrates_100g) : null,
    fat_per_100g: n.fat_100g != null ? Number(n.fat_100g) : null,
    serving_size_g: p.serving_quantity != null ? Number(p.serving_quantity) : null,
    image_url,
    raw_categories: p.categories || null,
  };
}

/** Look up a product by its barcode. Returns null if not found. */
export async function lookupBarcode(barcode: string): Promise<OFFProduct | null> {
  // UK first, fall back to world
  const bases = [OFF_UK, OFF_WORLD];
  const fields = "code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,image_front_small_url,image_small_url,image_url,categories";
  for (const base of bases) {
    const url = `${base}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "IronFit/1.1 - https://iron-fit-six.vercel.app" },
        // 10-second timeout to avoid hanging the API route
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === 1 && data.product) return parseProduct(data.product);
    } catch {
      continue;
    }
  }
  return null;
}

/** Search products by text via Search-a-licious. */
export async function searchProducts(query: string, page = 1): Promise<OFFProduct[]> {
  if (!query || query.trim().length < 2) return [];

  // Prefer UK products with the countries_tags filter, but the free-text 'q' still ranks by relevance
  const q = encodeURIComponent(query.trim());
  const url = `${SEARCH_A_LICIOUS}/search?q=${q}&page_size=20&page=${page}&fields=code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,image_front_small_url,image_small_url,image_url,categories,countries_tags&langs=en`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "IronFit/1.1 - https://iron-fit-six.vercel.app" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("search-a-licious returned", res.status);
      return searchProductsLegacy(query, page); // fallback to legacy just in case
    }
    const data = await res.json();
    // search-a-licious v0.1 returns { hits: [...], count, page, page_size, ... }
    const rawHits = data.hits || data.products || [];
    const products = rawHits
      .map(parseProduct)
      .filter((p: OFFProduct | null): p is OFFProduct => p !== null && p.kcal_per_100g !== null);
    return products;
  } catch (err) {
    console.error("search-a-licious threw", err);
    return searchProductsLegacy(query, page);
  }
}

/** Legacy fallback: /cgi/search.pl on the world instance. Sometimes returns 503; used only if search-a-licious fails. */
async function searchProductsLegacy(query: string, page: number): Promise<OFFProduct[]> {
  const url = `${OFF_WORLD}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&page=${page}&fields=code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,image_front_small_url,image_small_url,image_url,categories`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "IronFit/1.1 - https://iron-fit-six.vercel.app" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products = (data.products || [])
      .map(parseProduct)
      .filter((p: OFFProduct | null): p is OFFProduct => p !== null && p.kcal_per_100g !== null);
    return products;
  } catch {
    return [];
  }
}

/** Calculate macros for a portion of a product (grams). */
export function calculateMacros(product: OFFProduct, grams: number) {
  const factor = grams / 100;
  return {
    kcal: product.kcal_per_100g != null ? Math.round(product.kcal_per_100g * factor) : null,
    protein_g: product.protein_per_100g != null ? Math.round(product.protein_per_100g * factor * 10) / 10 : null,
    carbs_g: product.carbs_per_100g != null ? Math.round(product.carbs_per_100g * factor * 10) / 10 : null,
    fat_g: product.fat_per_100g != null ? Math.round(product.fat_per_100g * factor * 10) / 10 : null,
  };
}
