// ═══════════════════════════════════════════════════════════════
// Open Food Facts API client
// Free, no auth, UK-first queries
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
// ═══════════════════════════════════════════════════════════════

const OFF_BASE = "https://uk.openfoodfacts.org";

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
  return {
    barcode: p.code || null,
    name: p.product_name || p.product_name_en || p.generic_name || "Unknown product",
    brand: p.brands || null,
    kcal_per_100g: kcal != null ? Number(kcal) : null,
    protein_per_100g: n.proteins_100g != null ? Number(n.proteins_100g) : null,
    carbs_per_100g: n.carbohydrates_100g != null ? Number(n.carbohydrates_100g) : null,
    fat_per_100g: n.fat_100g != null ? Number(n.fat_100g) : null,
    serving_size_g: p.serving_quantity != null ? Number(p.serving_quantity) : null,
    image_url: p.image_front_small_url || p.image_small_url || p.image_url || null,
    raw_categories: p.categories || null,
  };
}

/** Look up a product by its barcode. Returns null if not found. */
export async function lookupBarcode(barcode: string): Promise<OFFProduct | null> {
  const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,image_front_small_url,image_small_url,image_url,categories`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "IronFit/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return parseProduct(data.product);
  } catch {
    return null;
  }
}

/** Search products by text. Returns up to 20 results, sorted by popularity in the UK. */
export async function searchProducts(query: string, page = 1): Promise<OFFProduct[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&page=${page}&sort_by=popularity_key&fields=code,product_name,product_name_en,generic_name,brands,nutriments,serving_quantity,image_front_small_url,image_small_url,image_url,categories`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "IronFit/1.0" } });
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
