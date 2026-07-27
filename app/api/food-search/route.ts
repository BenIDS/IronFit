import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { lookupBarcode, searchProducts } from "@/lib/openfoodfacts";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(request: Request) {
  // Auth check
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const barcode = url.searchParams.get("barcode");
  const query = url.searchParams.get("q");

  if (barcode) {
    const product = await lookupBarcode(barcode);
    if (!product) return NextResponse.json({ error: "Product not found", barcode }, { status: 404 });
    return NextResponse.json({ product });
  }

  if (query) {
    const products = await searchProducts(query);
    return NextResponse.json({ products });
  }

  return NextResponse.json({ error: "Provide ?barcode=... or ?q=..." }, { status: 400 });
}
