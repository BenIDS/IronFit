"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Btn, Input, Label, Card, Modal } from "./ui";
import { C, MEALS, QUICK_PORTIONS, MACRO_COLORS } from "@/lib/constants";
import type { OFFProduct } from "@/lib/openfoodfacts";
import { calculateMacros } from "@/lib/openfoodfacts";

// ═══════════════════════════════════════════════════════════════
// Tab selector chip
// ═══════════════════════════════════════════════════════════════

function TabRow({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const tabs = [
    { k: "scan", label: "📷 Scan" },
    { k: "search", label: "🔎 Search" },
    { k: "recent", label: "⏱ Recent" },
    { k: "manual", label: "✏ Manual" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 18, background: C.surface, borderRadius: 12, padding: 4 }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          flex: 1, background: tab === t.k ? C.orange : "transparent",
          color: tab === t.k ? C.bg : C.dim, border: "none", borderRadius: 8,
          padding: "10px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer",
          fontFamily: "inherit",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Product review panel — shared UI between scan and search
// Shows product info, portion input, macro preview, log button
// ═══════════════════════════════════════════════════════════════

function ProductReview({
  product, source, initialGrams, onSave, onCancel,
}: {
  product: OFFProduct;
  source: "barcode" | "search";
  initialGrams?: number;
  onSave: (payload: any) => void;
  onCancel: () => void;
}) {
  const [grams, setGrams] = useState<string>(String(initialGrams || product.serving_size_g || 100));
  const [meal, setMeal] = useState("Meal 1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const g = parseFloat(grams) || 0;
  const macros = calculateMacros(product, g);

  const submit = () => {
    onSave({
      date, meal,
      description: `${product.name}${product.brand ? ` (${product.brand})` : ""} — ${g}g`,
      product_name: product.name,
      portion_g: g,
      barcode: product.barcode,
      source,
      kcal: macros.kcal,
      protein_g: macros.protein_g,
      carbs_g: macros.carbs_g,
      fat_g: macros.fat_g,
    });
  };

  return (
    <div>
      <Card style={{ padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
        {product.image_url && (
          <img src={product.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", background: C.surface }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
          {product.brand && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{product.brand}</div>}
        </div>
      </Card>

      <Label>Portion (grams)</Label>
      <Input type="number" inputMode="decimal" value={grams} onChange={e => setGrams(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 18 }}>
        {QUICK_PORTIONS.map(qp => (
          <button key={qp.grams} onClick={() => setGrams(String(qp.grams))} style={{
            background: g === qp.grams ? C.orange + "22" : C.surface, color: g === qp.grams ? C.orange : C.dim,
            border: `1px solid ${g === qp.grams ? C.orange : C.border}`, borderRadius: 8,
            padding: "8px 4px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{qp.label}</button>
        ))}
      </div>
      {product.serving_size_g && (
        <button onClick={() => setGrams(String(product.serving_size_g))} style={{
          background: "transparent", color: C.orange, border: "none", fontSize: 12, cursor: "pointer",
          marginTop: -14, marginBottom: 14, fontFamily: "inherit", textDecoration: "underline",
        }}>Use 1 serving ({product.serving_size_g}g)</button>
      )}

      {/* Macro preview */}
      <Label>Macros for this portion</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          { l: "kcal", v: macros.kcal, c: MACRO_COLORS.kcal },
          { l: "protein", v: macros.protein_g != null ? `${macros.protein_g}g` : null, c: MACRO_COLORS.protein },
          { l: "carbs", v: macros.carbs_g != null ? `${macros.carbs_g}g` : null, c: MACRO_COLORS.carbs },
          { l: "fat", v: macros.fat_g != null ? `${macros.fat_g}g` : null, c: MACRO_COLORS.fat },
        ].map(m => (
          <div key={m.l} style={{ background: C.surface, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, color: m.c }}>{m.v ?? "—"}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 500 }}>{m.l}</div>
          </div>
        ))}
      </div>

      <Label>Meal Window</Label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {MEALS.map(m => <Btn key={m} sm color={C.orange} ghost={meal !== m} onClick={() => setMeal(m)}>{m}</Btn>)}
      </div>

      <Label>Date</Label>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: 20 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
        <Btn color={C.dim} ghost onClick={onCancel}>Back</Btn>
        <Btn color={C.orange} onClick={submit}>Log this</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Scan tab — barcode scanner via @zxing/browser
// ═══════════════════════════════════════════════════════════════

function ScanTab({ onProduct }: { onProduct: (product: OFFProduct, source: "barcode") => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"init" | "scanning" | "looking-up" | "not-found" | "error">("init");
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const readerRef = useRef<any>(null);

  const handleBarcode = useCallback(async (barcode: string) => {
    setStatus("looking-up");
    try {
      const res = await fetch(`/api/food-search?barcode=${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const data = await res.json();
        onProduct(data.product, "barcode");
      } else {
        setStatus("not-found");
      }
    } catch (err: any) {
      setError(err.message || "Lookup failed");
      setStatus("error");
    }
  }, [onProduct]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const zxing = await import("@zxing/browser");
        if (!active) return;
        const reader = new zxing.BrowserMultiFormatReader();
        readerRef.current = reader;

        // Get available cameras and pick a back-facing one when possible
        const devices = await zxing.BrowserMultiFormatReader.listVideoInputDevices();
        const back = devices.find(d => /back|environment|rear/i.test(d.label)) || devices[0];
        if (!back) throw new Error("No camera available");

        setStatus("scanning");
        await reader.decodeFromVideoDevice(back.deviceId, videoRef.current!, (result, err) => {
          if (result && active) {
            const text = result.getText();
            try { (reader as any).reset?.(); } catch {}
            handleBarcode(text);
          }
          // ignore per-frame decode errors (NotFoundException is normal)
        });
      } catch (err: any) {
        if (!active) return;
        setError(err.message || "Could not start camera. Try manual entry below.");
        setStatus("error");
      }
    })();

    return () => {
      active = false;
      try { (readerRef.current as any)?.reset?.(); } catch {}
      // Stop video stream tracks
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        v.srcObject = null;
      }
    };
  }, [handleBarcode]);

  const submitManual = () => {
    const code = manualBarcode.trim();
    if (code) handleBarcode(code);
  };

  return (
    <div>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "#000", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {status !== "scanning" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", color: C.dim, fontSize: 13, textAlign: "center", padding: 20 }}>
            {status === "init" && "Requesting camera…"}
            {status === "looking-up" && <><span className="spinner" style={{ marginRight: 10 }} /> Looking up product…</>}
            {status === "not-found" && "🤷 Not in the database. Try Search or Manual."}
            {status === "error" && <>⚠ {error}</>}
          </div>
        )}
        {/* Aim frame overlay */}
        {status === "scanning" && (
          <div style={{ position: "absolute", inset: "20% 10%", border: `2px solid ${C.accent}`, borderRadius: 12, pointerEvents: "none" }} />
        )}
      </div>

      <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 14 }}>
        Point at the barcode. Hold steady 2-3 seconds.
      </div>

      <Label>Or type the barcode</Label>
      <div style={{ display: "flex", gap: 8 }}>
        <Input type="text" inputMode="numeric" placeholder="e.g. 5000112548167" value={manualBarcode} onChange={e => setManualBarcode(e.target.value)} />
        <Btn color={C.orange} onClick={submitManual} disabled={!manualBarcode.trim()}>Look up</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Search tab
// ═══════════════════════════════════════════════════════════════

function SearchTab({ onProduct }: { onProduct: (product: OFFProduct, source: "search") => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Label>Search foods</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Input
          type="search"
          placeholder="e.g. warburtons crumpets"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") runSearch(); }}
        />
        <Btn color={C.orange} onClick={runSearch} disabled={query.trim().length < 2 || loading}>
          {loading ? "…" : "Go"}
        </Btn>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>
          <span className="spinner" /> Searching Open Food Facts…
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.dim, fontSize: 14, lineHeight: 1.5 }}>
          No products found for &ldquo;{query}&rdquo;. Try a different search term, or use Manual entry.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {results.map((p, i) => (
            <button key={i} onClick={() => onProduct(p, "search")} style={{
              display: "flex", gap: 12, alignItems: "center", width: "100%",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: 10, marginBottom: 8, cursor: "pointer", fontFamily: "inherit",
              textAlign: "left",
            }}>
              {p.image_url && <img src={p.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: "flex", gap: 10 }}>
                  {p.brand && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{p.brand}</span>}
                  {p.kcal_per_100g != null && <span className="num">{Math.round(p.kcal_per_100g)}kcal/100g</span>}
                  {p.protein_per_100g != null && <span className="num" style={{ color: C.orange }}>{p.protein_per_100g}gP</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!searched && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
          Type at least 2 characters and hit Go.<br />
          Powered by Open Food Facts (UK).
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Recent tab — quick re-log from the user's last unique meals
// ═══════════════════════════════════════════════════════════════

function RecentTab({ recentFoods, onQuickLog }: { recentFoods: any[]; onQuickLog: (f: any) => void }) {
  if (recentFoods.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: C.dim, fontSize: 14, lineHeight: 1.5 }}>
        No recent meals yet.<br />
        Log a few meals first, then they&rsquo;ll appear here for quick re-logging.
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
        Tap to re-log for today. Same meal window, same portion.
      </div>
      {recentFoods.map((f, i) => (
        <button key={i} onClick={() => onQuickLog(f)} style={{
          display: "block", width: "100%",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: 12, marginBottom: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
              {f.product_name || f.description}
            </div>
            <div style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>{f.meal}</div>
          </div>
          <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 10 }}>
            {f.kcal != null && <span className="num">{f.kcal} kcal</span>}
            {f.protein_g != null && <span className="num" style={{ color: MACRO_COLORS.protein }}>{f.protein_g}gP</span>}
            {f.carbs_g != null && <span className="num" style={{ color: MACRO_COLORS.carbs }}>{f.carbs_g}gC</span>}
            {f.fat_g != null && <span className="num" style={{ color: MACRO_COLORS.fat }}>{f.fat_g}gF</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Manual tab — free-text entry with all 4 macros
// ═══════════════════════════════════════════════════════════════

function ManualTab({ onSave }: { onSave: (payload: any) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meal, setMeal] = useState("Meal 1");
  const [desc, setDesc] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const submit = () => onSave({
    date, meal, description: desc,
    product_name: desc.split(",")[0].trim() || desc,
    source: "manual",
    kcal: kcal ? parseInt(kcal) : null,
    protein_g: protein ? parseFloat(protein) : null,
    carbs_g: carbs ? parseFloat(carbs) : null,
    fat_g: fat ? parseFloat(fat) : null,
  });

  return (
    <div>
      <Label>Date</Label>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: 14 }} />
      <Label>Meal Window</Label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {MEALS.map(m => <Btn key={m} sm color={C.orange} ghost={meal !== m} onClick={() => setMeal(m)}>{m}</Btn>)}
      </div>
      <Label>What did you eat?</Label>
      <textarea
        placeholder="e.g. 200g chicken, rice, broccoli"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: 12, width: "100%", boxSizing: "border-box", height: 80, resize: "none", marginBottom: 16, fontFamily: "inherit" }}
      />
      <Label>Macros</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.kcal, marginBottom: 4, fontWeight: 500 }}>Calories (kcal)</div>
          <Input type="number" inputMode="numeric" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="—" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.protein, marginBottom: 4, fontWeight: 500 }}>Protein (g)</div>
          <Input type="number" inputMode="decimal" value={protein} onChange={e => setProtein(e.target.value)} placeholder="—" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.carbs, marginBottom: 4, fontWeight: 500 }}>Carbs (g)</div>
          <Input type="number" inputMode="decimal" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="—" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.fat, marginBottom: 4, fontWeight: 500 }}>Fat (g)</div>
          <Input type="number" inputMode="decimal" value={fat} onChange={e => setFat(e.target.value)} placeholder="—" />
        </div>
      </div>
      <Btn color={C.orange} full onClick={submit} style={{ padding: 16, fontSize: 15 }}>Save Meal</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main FoodLogger modal
// ═══════════════════════════════════════════════════════════════

export function FoodLogger({ onSave, onClose, recentFoods, initialTab = "recent" }: {
  onSave: (payload: any) => void;
  onClose: () => void;
  recentFoods: any[];
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [selectedProduct, setSelectedProduct] = useState<{ product: OFFProduct; source: "barcode" | "search" } | null>(null);

  const handleProductSelect = (product: OFFProduct, source: "barcode" | "search") => {
    setSelectedProduct({ product, source });
  };

  const quickLog = (f: any) => {
    // Re-log this meal for today, keeping same portion and macros
    onSave({
      date: new Date().toISOString().slice(0, 10),
      meal: f.meal,
      description: f.description,
      product_name: f.product_name,
      portion_g: f.portion_g,
      barcode: f.barcode,
      source: "recent",
      kcal: f.kcal,
      protein_g: f.protein_g,
      carbs_g: f.carbs_g,
      fat_g: f.fat_g,
    });
  };

  return (
    <Modal onClose={onClose} title={selectedProduct ? "Confirm Portion" : "Log Meal"}>
      {selectedProduct ? (
        <ProductReview
          product={selectedProduct.product}
          source={selectedProduct.source}
          onSave={(p) => { onSave(p); setSelectedProduct(null); }}
          onCancel={() => setSelectedProduct(null)}
        />
      ) : (
        <>
          <TabRow tab={tab} setTab={setTab} />
          {tab === "scan" && <ScanTab onProduct={handleProductSelect} />}
          {tab === "search" && <SearchTab onProduct={handleProductSelect} />}
          {tab === "recent" && <RecentTab recentFoods={recentFoods} onQuickLog={quickLog} />}
          {tab === "manual" && <ManualTab onSave={onSave} />}
        </>
      )}
    </Modal>
  );
}
