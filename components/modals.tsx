"use client";

import { useState, useEffect } from "react";
import { Btn, Input, Label, Card, Modal } from "./ui";
import { C, PLAN, SCALE, MEALS, EXCLUDABLE, MACRO_COLORS } from "@/lib/constants";

// ═══════════════════════════════════════════════════════════════
// WORKOUT FORM — with per-set logging
// ═══════════════════════════════════════════════════════════════

export function WorkoutForm({ onSave, onClose, workouts }: any) {
  const [type, setType] = useState("push");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ex, setEx] = useState<any>({});
  const [notes, setNotes] = useState("");
  const [steps, setSteps] = useState("");
  const p = (PLAN as any)[type];
  const lastSession = workouts.find((w: any) => w.type === type);

  useEffect(() => {
    const initial: any = {};
    p.exercises.forEach((exDef: any) => {
      const lastLog = lastSession?.exercises?.find((e: any) => e.name === exDef.name);
      const targetSets = exDef.sets || 3;
      initial[exDef.name] = {
        sets: Array.from({ length: targetSets }, (_, i) => {
          const lastSet = lastLog?.setLog?.[i];
          return { reps: "", weight: lastSet?.weight ? String(lastSet.weight) : "", rir: "" };
        }),
        notes: "",
      };
    });
    setEx(initial);
  }, [type]);

  const updSet = (exName: string, setIdx: number, field: string, value: string) => {
    setEx((prev: any) => {
      const cur = prev[exName] || { sets: [], notes: "" };
      const newSets = cur.sets.map((s: any, i: number) => i === setIdx ? { ...s, [field]: value } : s);
      return { ...prev, [exName]: { ...cur, sets: newSets } };
    });
  };

  const addSet = (exName: string) => {
    setEx((prev: any) => {
      const cur = prev[exName] || { sets: [], notes: "" };
      const lastSet = cur.sets[cur.sets.length - 1] || { weight: "", reps: "", rir: "" };
      return { ...prev, [exName]: { ...cur, sets: [...cur.sets, { reps: "", weight: lastSet.weight || "", rir: "" }] } };
    });
  };

  const removeSet = (exName: string, setIdx: number) => {
    setEx((prev: any) => {
      const cur = prev[exName] || { sets: [], notes: "" };
      return { ...prev, [exName]: { ...cur, sets: cur.sets.filter((_: any, i: number) => i !== setIdx) } };
    });
  };

  const updExNotes = (exName: string, val: string) => {
    setEx((prev: any) => ({ ...prev, [exName]: { ...(prev[exName] || { sets: [] }), notes: val } }));
  };

  const submit = () => {
    const exercises = Object.entries(ex)
      .map(([name, d]: any) => {
        const validSets = (d.sets || []).filter((s: any) => s.reps || s.weight);
        if (validSets.length === 0 && !d.notes) return null;
        const weights = validSets.map((s: any) => parseFloat(s.weight)).filter((w: number) => !isNaN(w));
        const reps = validSets.map((s: any) => parseInt(s.reps)).filter((r: number) => !isNaN(r));
        return {
          name,
          sets: validSets.length,
          reps: reps.length ? (reps.every((r: number) => r === reps[0]) ? String(reps[0]) : `${Math.min(...reps)}-${Math.max(...reps)}`) : "",
          weight: weights.length ? Math.max(...weights) : "",
          setLog: validSets,
          notes: d.notes || "",
        };
      })
      .filter(Boolean);
    onSave({ date, type, exercises, steps: steps ? parseInt(steps) : null, notes });
  };

  return (
    <Modal onClose={onClose} title="Log Session">
      <Label>Session Type</Label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {Object.entries(PLAN).map(([k, v]: any) => (
          <Btn key={k} sm color={v.color} ghost={type !== k} onClick={() => setType(k)}>{v.label}</Btn>
        ))}
      </div>

      <Label>Date</Label>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: 18 }} />

      <Label>Exercises</Label>
      {p.exercises.map((exDef: any) => {
        const lastLog = lastSession?.exercises?.find((e: any) => e.name === exDef.name);
        const current = ex[exDef.name] || { sets: [], notes: "" };
        return (
          <Card key={exDef.name} accent={p.color} style={{ padding: "16px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{exDef.name}</div>
              <div className="num" style={{ fontSize: 12, color: C.muted }}>Target: {exDef.sets}×{exDef.reps}</div>
            </div>
            {exDef.rule && <div style={{ fontSize: 12, color: C.dim, marginBottom: 10, fontStyle: "italic" }}>↳ {exDef.rule}</div>}
            {lastLog?.setLog?.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Last session</div>
                <div className="num" style={{ fontSize: 12, color: C.accent, fontWeight: 500 }}>
                  {lastLog.setLog.map((s: any, i: number) => (
                    <span key={i}>{i > 0 && " · "}{s.reps || "?"}{s.weight && `@${s.weight}`}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 60px 32px", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textAlign: "center" }}>Set</div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>Reps</div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>Weight (kg)</div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textAlign: "center" }}>RIR</div>
              <div />
            </div>

            {current.sets.map((set: any, idx: number) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 60px 32px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <div className="num" style={{ fontSize: 14, color: C.dim, fontWeight: 700, textAlign: "center" }}>{idx + 1}</div>
                <Input type="number" inputMode="numeric" placeholder={exDef.reps}
                  value={set.reps} onChange={e => updSet(exDef.name, idx, "reps", e.target.value)}
                  style={{ padding: "10px", fontSize: 15, textAlign: "center" }} />
                <Input type="number" inputMode="decimal" step="0.5" placeholder="kg"
                  value={set.weight} onChange={e => updSet(exDef.name, idx, "weight", e.target.value)}
                  style={{ padding: "10px", fontSize: 15, textAlign: "center" }} />
                <Input type="number" inputMode="numeric" placeholder="—"
                  value={set.rir} onChange={e => updSet(exDef.name, idx, "rir", e.target.value)}
                  style={{ padding: "10px 6px", fontSize: 14, textAlign: "center" }} />
                <button onClick={() => removeSet(exDef.name, idx)} style={{
                  background: "transparent", border: `1px solid ${C.border}`, color: C.muted,
                  borderRadius: 8, padding: 0, height: 36, cursor: "pointer", fontSize: 14,
                }}>×</button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn sm ghost color={p.color} onClick={() => addSet(exDef.name)} style={{ flex: 1, padding: "10px", fontSize: 13 }}>
                + Add Set
              </Btn>
            </div>

            <textarea placeholder="Notes on this exercise (optional)"
              value={current.notes || ""} onChange={e => updExNotes(exDef.name, e.target.value)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.text, fontSize: 12, padding: 10, width: "100%", boxSizing: "border-box",
                height: 44, resize: "none", fontFamily: "inherit", marginTop: 10,
              }} />
          </Card>
        );
      })}

      <div style={{ marginTop: 18 }}>
        <Label>Steps Today</Label>
        <Input type="number" placeholder="e.g. 13500" value={steps} onChange={e => setSteps(e.target.value)} />
      </div>

      <div style={{ marginTop: 18, marginBottom: 22 }}>
        <Label>Session Notes</Label>
        <textarea placeholder="How did it feel overall?" value={notes} onChange={e => setNotes(e.target.value)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: 12, width: "100%", boxSizing: "border-box", height: 80, resize: "none", fontFamily: "inherit" }} />
      </div>

      <Btn color={p.color} full onClick={submit} style={{ padding: 16, fontSize: 15 }}>Save Session</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// BODY FORM
// ═══════════════════════════════════════════════════════════════

export function BodyForm({ onSave, onClose }: any) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [v, setV] = useState<any>({});
  const submit = () => {
    const entry: any = { date };
    SCALE.forEach(f => { if (v[f.k]) entry[f.k] = parseFloat(v[f.k]); });
    onSave(entry);
  };
  return (
    <Modal onClose={onClose} title="Log Body Stats">
      <Label>Date</Label>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: 20 }} />
      <Label>Scale Readings</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
        {SCALE.map(f => (
          <div key={f.k}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 500 }}>
              {f.l} {f.u && <span style={{ color: C.border }}>({f.u})</span>}
            </div>
            <Input type="number" step="0.1" placeholder="—" value={v[f.k] || ""} onChange={e => setV({ ...v, [f.k]: e.target.value })} />
          </div>
        ))}
      </div>
      <Btn color={C.blue} full onClick={submit} style={{ padding: 16, fontSize: 15 }}>Save Readings</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMISE MODAL
// ═══════════════════════════════════════════════════════════════

export function CustomiseModal({ prefs, onSave, onClose }: any) {
  const [excl, setExcl] = useState<string[]>(prefs?.excluded_tags || []);
  const [hidden, setHidden] = useState<string[]>(prefs?.hidden_meals || []);
  const toggle = (tag: string) => setExcl(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  const unhide = (name: string) => setHidden(prev => prev.filter(x => x !== name));
  return (
    <Modal onClose={onClose} title="Customise Plan">
      <div style={{ fontSize: 14, color: C.dim, marginBottom: 20, lineHeight: 1.5 }}>
        Exclude ingredients you don&rsquo;t like or can&rsquo;t get. Meals containing those will be hidden from your plan.
      </div>
      <Label>Exclude Ingredients</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        {EXCLUDABLE.map(e => {
          const on = excl.includes(e.tag);
          return (
            <button key={e.tag} onClick={() => toggle(e.tag)} style={{
              background: on ? C.red : C.surface, color: on ? C.bg : C.text,
              border: `1px solid ${on ? C.red : C.border}`, borderRadius: 12,
              padding: "12px 10px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>{on ? "✕ " : ""}{e.label}</button>
          );
        })}
      </div>
      {hidden.length > 0 && (
        <>
          <Label>Hidden Meals (tap to restore)</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
            {hidden.map(name => (
              <button key={name} onClick={() => unhide(name)} style={{
                background: C.surface, color: C.dim, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "8px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>↩ {name}</button>
            ))}
          </div>
        </>
      )}
      <Btn color={C.accent} full onClick={() => onSave({ excluded_tags: excl, hidden_meals: hidden })} style={{ padding: 16, fontSize: 15 }}>Save Preferences</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECIPE MODAL
// ═══════════════════════════════════════════════════════════════

export function RecipeModal({ meal, mealType, onClose, onLog }: any) {
  if (!meal) return null;
  return (
    <Modal onClose={onClose} title={meal.name}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { l: "kcal", v: meal.kcal, c: MACRO_COLORS.kcal },
          { l: "protein", v: `${meal.protein}g`, c: MACRO_COLORS.protein },
          { l: "carbs", v: meal.carbs != null ? `${meal.carbs}g` : "—", c: MACRO_COLORS.carbs },
          { l: "fat", v: meal.fat != null ? `${meal.fat}g` : "—", c: MACRO_COLORS.fat },
        ].map(m => (
          <div key={m.l} style={{ background: C.surface, padding: "10px 8px", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: m.c, fontWeight: 500 }}>{m.l.toUpperCase()}</div>
            <div className="num" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{m.v}</div>
          </div>
        ))}
      </div>
      <Label>Ingredients</Label>
      <div style={{ background: C.surface, borderRadius: 12, padding: 16, marginBottom: 18 }}>
        {meal.ingr.map((i: string, idx: number) => (
          <div key={idx} style={{ fontSize: 14, color: C.text, padding: "5px 0", display: "flex", gap: 10 }}>
            <span style={{ color: C.orange }}>•</span><span>{i}</span>
          </div>
        ))}
      </div>
      <Label>Method</Label>
      <div style={{ background: C.surface, borderRadius: 12, padding: 16, marginBottom: 22 }}>
        {meal.steps.map((s: string, idx: number) => (
          <div key={idx} style={{ fontSize: 14, color: C.text, padding: "6px 0", display: "flex", gap: 12, lineHeight: 1.5 }}>
            <span style={{ color: C.orange, fontWeight: 700, minWidth: 22 }}>{idx + 1}.</span><span>{s}</span>
          </div>
        ))}
      </div>
      {meal.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          {meal.tags.map((t: string) => (
            <span key={t} style={{ background: C.orange + "22", color: C.orange, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8 }}>{t}</span>
          ))}
        </div>
      )}
      <Btn color={C.orange} full onClick={() => onLog(mealType, meal)} style={{ padding: 16, fontSize: 15 }}>+ Log This Meal Today</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHOTO LOGGER — AI meal photo analysis
// ═══════════════════════════════════════════════════════════════

async function compressImage(file: File): Promise<{ dataUrl: string; base64: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error("Blob failed"));
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          const base64 = dataUrl.split(",")[1];
          resolve({ dataUrl, base64, blob });
        }, "image/jpeg", 0.75);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoLogger({ onSave, onClose }: any) {
  const [step, setStep] = useState<"select" | "analyzing" | "review">("select");
  const [photo, setPhoto] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [meal, setMeal] = useState("Meal 1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editedDesc, setEditedDesc] = useState("");
  const [editedKcal, setEditedKcal] = useState("");
  const [editedProtein, setEditedProtein] = useState("");
  const [editedCarbs, setEditedCarbs] = useState("");
  const [editedFat, setEditedFat] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const compressed = await compressImage(file);
      setPhoto(compressed);
    } catch {
      setError("Could not load that photo. Try another.");
    }
  };

  const runAnalysis = async () => {
    if (!photo) return;
    setStep("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/analyse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: photo.base64, mediaType: "image/jpeg" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server ${res.status}`);
      }
      const result = await res.json();
      setAnalysis(result);
      setEditedDesc(`${result.name} — ${(result.ingredients || []).join(", ")}`);
      setEditedKcal(String(result.estimated_kcal || ""));
      setEditedProtein(String(result.estimated_protein_g || ""));
      setEditedCarbs(String(result.estimated_carbs_g || ""));
      setEditedFat(String(result.estimated_fat_g || ""));
      setStep("review");
    } catch (err: any) {
      setError(`Analysis failed: ${err.message || "unknown error"}`);
      setStep("select");
    }
  };

  const submit = () => {
    onSave({
      date, meal,
      description: editedDesc,
      product_name: analysis?.name || null,
      source: "ai-photo",
      protein_g: editedProtein ? parseFloat(editedProtein) : null,
      kcal: editedKcal ? parseInt(editedKcal) : null,
      carbs_g: editedCarbs ? parseFloat(editedCarbs) : null,
      fat_g: editedFat ? parseFloat(editedFat) : null,
      photoBlob: photo.blob,
      ai_analysis: analysis ? {
        confidence: analysis.overall_confidence,
        reasoning: analysis.reasoning,
        warnings: analysis.warnings || [],
        matched_template: analysis.matched_template,
      } : null,
    });
  };

  const confColor = (c: string) => c === "high" ? C.green : c === "medium" ? C.amber : C.red;

  return (
    <Modal onClose={onClose} title="📷 AI Photo Log">
      {step === "select" && (
        <>
          <div style={{ fontSize: 14, color: C.dim, marginBottom: 18, lineHeight: 1.5 }}>
            Snap or upload a meal photo. AI identifies ingredients, estimates macros, and matches your plan.
          </div>
          {!photo ? (
            <label style={{ display: "block", background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 14, padding: "48px 24px", textAlign: "center", cursor: "pointer", marginBottom: 18 }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 15, color: C.text, fontWeight: 600, marginBottom: 4 }}>Take photo or choose from library</div>
              <div style={{ fontSize: 12, color: C.muted }}>Photo stored securely in your account</div>
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
            </label>
          ) : (
            <>
              <img src={photo.dataUrl} alt="meal" style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />
              <Btn ghost color={C.dim} sm onClick={() => setPhoto(null)} style={{ marginBottom: 14 }}>↻ Retake</Btn>
            </>
          )}
          {error && <div style={{ background: C.red + "22", color: C.red, padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>{error}</div>}
          <Btn color={C.orange} full onClick={runAnalysis} disabled={!photo} style={{ padding: 16, fontSize: 15 }}>
            {photo ? "✨ Analyse with AI" : "Select a photo first"}
          </Btn>
        </>
      )}

      {step === "analyzing" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <img src={photo.dataUrl} alt="analysing" style={{ width: "60%", borderRadius: 12, opacity: 0.4, marginBottom: 22 }} />
          <div style={{ fontSize: 14, color: C.orange, fontWeight: 700, marginBottom: 10 }}>Analysing…</div>
          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, padding: "0 24px" }}>
            Identifying ingredients, estimating portions, matching your plan. 5–10 seconds.
          </div>
        </div>
      )}

      {step === "review" && analysis && (
        <>
          <img src={photo.dataUrl} alt="logged" style={{ width: "100%", borderRadius: 12, marginBottom: 16 }} />
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14, padding: "12px 16px", background: C.surface, borderRadius: 10, borderLeft: `3px solid ${confColor(analysis.overall_confidence)}` }}>
            <div style={{ minWidth: 90 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>CONFIDENCE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: confColor(analysis.overall_confidence), textTransform: "capitalize", marginTop: 3 }}>{analysis.overall_confidence}</div>
            </div>
            <div style={{ flex: 1, fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{analysis.reasoning}</div>
          </div>
          {analysis.matched_template && (
            <Card accent={C.green} style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: C.green, marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                ✓ Matched your plan
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{analysis.matched_template}</div>
            </Card>
          )}
          {analysis.warnings?.length > 0 && (
            <Card accent={C.amber} style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: C.amber, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>⚠ Worth knowing</div>
              {analysis.warnings.map((w: string, i: number) => (
                <div key={i} style={{ fontSize: 12, color: C.dim, lineHeight: 1.5, padding: "2px 0" }}>· {w}</div>
              ))}
            </Card>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: MACRO_COLORS.kcal, marginBottom: 4, fontWeight: 500 }}>Calories</div>
              <Input type="number" value={editedKcal} onChange={e => setEditedKcal(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MACRO_COLORS.protein, marginBottom: 4, fontWeight: 500 }}>Protein (g)</div>
              <Input type="number" value={editedProtein} onChange={e => setEditedProtein(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MACRO_COLORS.carbs, marginBottom: 4, fontWeight: 500 }}>Carbs (g)</div>
              <Input type="number" value={editedCarbs} onChange={e => setEditedCarbs(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MACRO_COLORS.fat, marginBottom: 4, fontWeight: 500 }}>Fat (g)</div>
              <Input type="number" value={editedFat} onChange={e => setEditedFat(e.target.value)} />
            </div>
          </div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: 14 }} />
          <Label>Meal Window</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {MEALS.map(m => <Btn key={m} sm color={C.orange} ghost={meal !== m} onClick={() => setMeal(m)}>{m}</Btn>)}
          </div>
          <Label>Description</Label>
          <textarea value={editedDesc} onChange={e => setEditedDesc(e.target.value)}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: 12, width: "100%", boxSizing: "border-box", height: 80, resize: "none", marginBottom: 20, fontFamily: "inherit" }} />
          <Btn color={C.orange} full onClick={submit} style={{ padding: 16, fontSize: 15 }}>Save to Log</Btn>
        </>
      )}
    </Modal>
  );
}
