"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Btn, Input, Label, Card, Modal } from "./ui";
import { C, MEALS, QUICK_PORTIONS, MACRO_COLORS } from "@/lib/constants";
import type { OFFProduct } from "@/lib/openfoodfacts";
import { calculateMacros } from "@/lib/openfoodfacts";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type BuilderItem = {
  id: string;
  source: "barcode" | "search" | "recent" | "manual";
  name: string;
  portion_g?: number | null;
  barcode?: string | null;
  kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  raw_description?: string; // for manual entries
};

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
    <div style={{ display: "flex", gap: 4, marginBottom: 14, background: C.surface, borderRadius: 12, padding: 4 }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          flex: 1, background: tab === t.k ? C.accent : "transparent",
          color: tab === t.k ? C.bg : C.dim, border: "none", borderRadius: 8,
          padding: "10px 4px", fontSize: 12, fontWeight: 800, cursor: "pointer",
          fontFamily: "inherit",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Meal builder — persistent bar at the top of the modal
// Shows running total + item list + Log button
// ═══════════════════════════════════════════════════════════════

function MealBuilder({
  items, meal, setMeal, date, setDate, onRemove, onLog, disabled,
}: {
  items: BuilderItem[];
  meal: string;
  setMeal: (m: string) => void;
  date: string;
  setDate: (d: string) => void;
  onRemove: (id: string) => void;
  onLog: () => void;
  disabled: boolean;
}) {
  const totals = items.reduce(
    (acc, it) => ({
      kcal: acc.kcal + (Number(it.kcal) || 0),
      protein: acc.protein + (Number(it.protein_g) || 0),
      carbs: acc.carbs + (Number(it.carbs_g) || 0),
      fat: acc.fat + (Number(it.fat_g) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const empty = items.length === 0;

  return (
    <div style={{
      background: empty ? C.surface : C.card,
      border: `1px solid ${empty ? C.border : C.accent + "66"}`,
      borderRadius: 16,
      padding: empty ? "14px 16px" : "16px 18px 18px",
      marginBottom: 14,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: empty ? 0 : 12 }}>
        <div style={{
          fontSize: 11, color: empty ? C.muted : C.accent,
          fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          {empty ? "Meal Builder" : `${items.length} item${items.length > 1 ? "s" : ""} in meal`}
        </div>
        {!empty && (
          <div className="num" style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
            <span style={{ color: MACRO_COLORS.kcal }}>{Math.round(totals.kcal)}</span>
            <span style={{ margin: "0 6px", color: C.border }}>·</span>
            <span style={{ color: MACRO_COLORS.protein }}>{totals.protein.toFixed(0)}P</span>
            <span style={{ margin: "0 6px", color: C.border }}>·</span>
            <span style={{ color: MACRO_COLORS.carbs }}>{totals.carbs.toFixed(0)}C</span>
            <span style={{ margin: "0 6px", color: C.border }}>·</span>
            <span style={{ color: MACRO_COLORS.fat }}>{totals.fat.toFixed(0)}F</span>
          </div>
        )}
      </div>

      {empty && (
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>
          Add items from any tab below. They&rsquo;ll combine into one meal log.
        </div>
      )}

      {!empty && (
        <>
          <div style={{ maxHeight: 160, overflowY: "auto", marginBottom: 12 }}>
            {items.map(it => (
              <div key={it.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0", borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.name}{it.portion_g ? ` — ${it.portion_g}g` : ""}
                  </div>
                  <div className="num" style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {it.kcal != null && <>{it.kcal} kcal</>}
                    {it.protein_g != null && <> · {it.protein_g}gP</>}
                    {it.carbs_g != null && <> · {it.carbs_g}gC</>}
                    {it.fat_g != null && <> · {it.fat_g}gF</>}
                  </div>
                </div>
                <button onClick={() => onRemove(it.id)} style={{
                  background: "transparent", border: "none", color: C.muted,
                  cursor: "pointer", fontSize: 16, padding: "4px 8px",
                }} aria-label="Remove item">✕</button>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Meal</div>
              <select value={meal} onChange={e => setMeal(e.target.value)} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                color: C.text, fontSize: 13, fontWeight: 600, padding: "10px 12px",
                width: "100%", boxSizing: "border-box", fontFamily: "inherit",
              }}>
                {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Date</div>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: "10px 12px", fontSize: 13 }} />
            </div>
          </div>

          <Btn color={C.accent} full onClick={onLog} disabled={disabled} style={{ padding: "14px", fontSize: 14 }}>
            {disabled ? "Saving…" : `Log meal (${items.length} item${items.length > 1 ? "s" : ""})`}
          </Btn>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Product review — for adding a product with portion selection
// Used inline by Scan and Search
// ═══════════════════════════════════════════════════════════════

function ProductReview({
  product, source, onAdd, onCancel,
}: {
  product: OFFProduct;
  source: "barcode" | "search";
  onAdd: (item: BuilderItem) => void;
  onCancel: () => void;
}) {
  const [grams, setGrams] = useState<string>(String(product.serving_size_g || 100));
  const g = parseFloat(grams) || 0;
  const macros = calculateMacros(product, g);

  const add = () => {
    onAdd({
      id: Math.random().toString(36).slice(2),
      source,
      name: product.name + (product.brand ? ` (${product.brand})` : ""),
      portion_g: g,
      barcode: product.barcode,
      kcal: macros.kcal,
      protein_g: macros.protein_g,
      carbs_g: macros.carbs_g,
      fat_g: macros.fat_g,
    });
  };

  return (
    <div>
      <Card style={{ padding: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        {product.image_url && (
          <img src={product.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", background: C.surface }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
          {product.brand && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{product.brand}</div>}
        </div>
      </Card>

      <Label>Portion (grams)</Label>
      <Input type="number" inputMode="decimal" value={grams} onChange={e => setGrams(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 14 }}>
        {QUICK_PORTIONS.map(qp => (
          <button key={qp.grams} onClick={() => setGrams(String(qp.grams))} style={{
            background: g === qp.grams ? C.accent + "22" : C.surface, color: g === qp.grams ? C.accent : C.dim,
            border: `1px solid ${g === qp.grams ? C.accent : C.border}`, borderRadius: 8,
            padding: "8px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{qp.label}</button>
        ))}
      </div>
      {product.serving_size_g && (
        <button onClick={() => setGrams(String(product.serving_size_g))} style={{
          background: "transparent", color: C.accent, border: "none", fontSize: 12, cursor: "pointer",
          marginTop: -8, marginBottom: 14, fontFamily: "inherit", textDecoration: "underline",
        }}>Use 1 serving ({product.serving_size_g}g)</button>
      )}

      <Label>This portion adds</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          { l: "kcal", v: macros.kcal, c: MACRO_COLORS.kcal },
          { l: "protein", v: macros.protein_g != null ? `${macros.protein_g}g` : null, c: MACRO_COLORS.protein },
          { l: "carbs", v: macros.carbs_g != null ? `${macros.carbs_g}g` : null, c: MACRO_COLORS.carbs },
          { l: "fat", v: macros.fat_g != null ? `${macros.fat_g}g` : null, c: MACRO_COLORS.fat },
        ].map(m => (
          <div key={m.l} style={{ background: C.surface, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
            <div className="num" style={{ fontSize: 15, fontWeight: 700, color: m.c }}>{m.v ?? "—"}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 700 }}>{m.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
        <Btn color={C.dim} ghost onClick={onCancel}>Back</Btn>
        <Btn color={C.accent} onClick={add}>+ Add to meal</Btn>
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
        <Btn color={C.accent} onClick={submitManual} disabled={!manualBarcode.trim()}>Look up</Btn>
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
          placeholder="e.g. chicken breast"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") runSearch(); }}
        />
        <Btn color={C.accent} onClick={runSearch} disabled={query.trim().length < 2 || loading}>
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
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
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
                  {p.protein_per_100g != null && <span className="num" style={{ color: MACRO_COLORS.protein }}>{p.protein_per_100g}gP</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!searched && (
        <div style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
          Type at least 2 characters and hit Go.<br />
          Powered by Open Food Facts.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Recent tab — add items from previously logged meals to builder
// ═══════════════════════════════════════════════════════════════

function RecentTab({ recentFoods, onAdd }: { recentFoods: any[]; onAdd: (item: BuilderItem) => void }) {
  if (recentFoods.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: C.dim, fontSize: 14, lineHeight: 1.5 }}>
        No recent meals yet.<br />
        Log a few meals first, then they&rsquo;ll appear here.
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
        Tap to add to the current meal.
      </div>
      {recentFoods.map((f, i) => (
        <button key={i} onClick={() => onAdd({
          id: Math.random().toString(36).slice(2),
          source: "recent",
          name: f.product_name || f.description,
          portion_g: f.portion_g,
          barcode: f.barcode,
          kcal: f.kcal,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fat_g: f.fat_g,
        })} style={{
          display: "block", width: "100%",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: 12, marginBottom: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {f.product_name || f.description}
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
// Manual tab — free-text entry, adds to builder
// ═══════════════════════════════════════════════════════════════

function ManualTab({ onAdd }: { onAdd: (item: BuilderItem) => void }) {
  const [desc, setDesc] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const canAdd = desc.trim().length > 0;

  const add = () => {
    onAdd({
      id: Math.random().toString(36).slice(2),
      source: "manual",
      name: desc.split(",")[0].trim() || desc,
      raw_description: desc,
      kcal: kcal ? parseInt(kcal) : null,
      protein_g: protein ? parseFloat(protein) : null,
      carbs_g: carbs ? parseFloat(carbs) : null,
      fat_g: fat ? parseFloat(fat) : null,
    });
    // reset
    setDesc(""); setKcal(""); setProtein(""); setCarbs(""); setFat("");
  };

  return (
    <div>
      <Label>What did you eat?</Label>
      <textarea
        placeholder="e.g. 200g chicken breast"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: 12, width: "100%", boxSizing: "border-box", height: 60, resize: "none", marginBottom: 16, fontFamily: "inherit" }}
      />
      <Label>Macros</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.kcal, marginBottom: 4, fontWeight: 700 }}>Calories</div>
          <Input type="number" inputMode="numeric" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="—" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.protein, marginBottom: 4, fontWeight: 700 }}>Protein (g)</div>
          <Input type="number" inputMode="decimal" value={protein} onChange={e => setProtein(e.target.value)} placeholder="—" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.carbs, marginBottom: 4, fontWeight: 700 }}>Carbs (g)</div>
          <Input type="number" inputMode="decimal" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="—" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: MACRO_COLORS.fat, marginBottom: 4, fontWeight: 700 }}>Fat (g)</div>
          <Input type="number" inputMode="decimal" value={fat} onChange={e => setFat(e.target.value)} placeholder="—" />
        </div>
      </div>
      <Btn color={C.accent} full onClick={add} disabled={!canAdd} style={{ padding: 14, fontSize: 14 }}>+ Add to meal</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main FoodLogger — persistent meal builder + tabs
// ═══════════════════════════════════════════════════════════════

export function FoodLogger({ onSave, onClose, recentFoods, initialTab = "recent" }: {
  onSave: (payload: any) => void;
  onClose: () => void;
  recentFoods: any[];
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [pendingProduct, setPendingProduct] = useState<{ product: OFFProduct; source: "barcode" | "search" } | null>(null);
  const [meal, setMeal] = useState("Meal 1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const addItem = (item: BuilderItem) => {
    setItems(prev => [...prev, item]);
    setPendingProduct(null);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleProductSelect = (product: OFFProduct, source: "barcode" | "search") => {
    setPendingProduct({ product, source });
  };

  const logMeal = () => {
    if (items.length === 0) return;
    setSaving(true);

    // Build combined description from item names
    const names = items.map(it => it.name.split(" — ")[0].split(" (")[0]);
    const description = items.length === 1
      ? items[0].raw_description || `${names[0]}${items[0].portion_g ? ` — ${items[0].portion_g}g` : ""}`
      : `${names.join(", ")} — mixed meal`;

    // Sum macros
    const totals = items.reduce(
      (acc, it) => ({
        kcal: acc.kcal + (Number(it.kcal) || 0),
        protein: acc.protein + (Number(it.protein_g) || 0),
        carbs: acc.carbs + (Number(it.carbs_g) || 0),
        fat: acc.fat + (Number(it.fat_g) || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Sum portion when meaningful (all items have portion_g)
    const totalPortion = items.every(it => it.portion_g != null)
      ? items.reduce((s, it) => s + (it.portion_g || 0), 0)
      : null;

    // Source: 'multi' if mixed, else the sole source
    const sources = new Set(items.map(it => it.source));
    const source = sources.size > 1 ? "multi" : items[0].source;

    // Product name: first item's name, or 'Mixed meal' if many
    const product_name = items.length === 1 ? items[0].name : "Mixed meal";

    // Barcode only when single-item barcode
    const barcode = items.length === 1 ? items[0].barcode : null;

    onSave({
      date, meal,
      description,
      product_name,
      portion_g: totalPortion,
      barcode,
      source,
      kcal: Math.round(totals.kcal) || null,
      protein_g: Math.round(totals.protein * 10) / 10 || null,
      carbs_g: Math.round(totals.carbs * 10) / 10 || null,
      fat_g: Math.round(totals.fat * 10) / 10 || null,
    });
  };

  return (
    <Modal onClose={onClose} title={pendingProduct ? "Confirm portion" : "Log meal"}>
      {pendingProduct ? (
        <ProductReview
          product={pendingProduct.product}
          source={pendingProduct.source}
          onAdd={addItem}
          onCancel={() => setPendingProduct(null)}
        />
      ) : (
        <>
          <MealBuilder
            items={items}
            meal={meal} setMeal={setMeal}
            date={date} setDate={setDate}
            onRemove={removeItem}
            onLog={logMeal}
            disabled={saving}
          />
          <TabRow tab={tab} setTab={setTab} />
          {tab === "scan" && <ScanTab onProduct={handleProductSelect} />}
          {tab === "search" && <SearchTab onProduct={handleProductSelect} />}
          {tab === "recent" && <RecentTab recentFoods={recentFoods} onAdd={addItem} />}
          {tab === "manual" && <ManualTab onAdd={addItem} />}
        </>
      )}
    </Modal>
  );
}
