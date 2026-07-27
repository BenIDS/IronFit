"use client";

import { useState, useEffect } from "react";
import { Btn, Input, Label, Modal } from "./ui";
import { C, deriveMacroTargets } from "@/lib/constants";

const PROFILE_FIELDS: any[] = [
  { k: "name", l: "Name", t: "text" },
  { k: "age", l: "Age", t: "number", u: "yrs" },
  { k: "sex", l: "Sex", t: "select", opts: ["Male", "Female", "Other"] },
  { k: "height_cm", l: "Height", t: "number", u: "cm" },
  { k: "current_weight_kg", l: "Current Weight", t: "number", u: "kg" },
  { k: "goal_weight_kg", l: "Goal Weight", t: "number", u: "kg" },
  { k: "primary_goal", l: "Primary Goal", t: "select", opts: ["Fat Loss", "Maintain", "Build Muscle", "Recomp"] },
  { k: "activity_level", l: "Activity Level", t: "select", opts: ["Sedentary", "Light", "Moderate", "Very Active", "Athlete"] },
  { k: "training_experience", l: "Experience", t: "select", opts: ["Beginner", "Intermediate", "Advanced"] },
  { k: "step_goal", l: "Daily Step Goal", t: "number" },
  { k: "avg_sleep_hrs", l: "Avg Sleep", t: "number", u: "hrs" },
];

const TARGET_FIELDS: any[] = [
  { k: "kcal_target", l: "Calories", t: "number", u: "kcal", color: "kcal" },
  { k: "protein_target_g", l: "Protein", t: "number", u: "g", color: "protein" },
  { k: "carb_target_g", l: "Carbs", t: "number", u: "g", color: "carbs" },
  { k: "fat_target_g", l: "Fat", t: "number", u: "g", color: "fat" },
  { k: "hydration_target_ml", l: "Water", t: "number", u: "ml", color: "water" },
];

const PHASE_FIELDS: any[] = [
  { k: "phase_name", l: "Phase Name", t: "text" },
  { k: "phase_goal_label", l: "Phase Goal", t: "text" },
  { k: "phase_goal_date", l: "Phase Goal Date", t: "date" },
];

const MACRO_COLOR = {
  kcal: C.accent, protein: C.orange, carbs: C.blue, fat: C.amber, water: C.blue,
};

export function ProfileForm({ profile, onSave, onClose }: any) {
  const [p, setP] = useState<any>(profile || {});
  const [autoMacros, setAutoMacros] = useState(true);
  const upd = (k: string, v: any) => setP((prev: any) => ({ ...prev, [k]: v }));

  // When auto is on and kcal/protein change, recompute carb/fat targets
  useEffect(() => {
    if (!autoMacros) return;
    const kcal = parseInt(p.kcal_target) || 0;
    const protein = parseInt(p.protein_target_g) || 0;
    if (kcal > 0 && protein > 0) {
      const { carb_target_g, fat_target_g } = deriveMacroTargets(kcal, protein);
      setP((prev: any) => ({ ...prev, carb_target_g, fat_target_g }));
    }
  }, [p.kcal_target, p.protein_target_g, autoMacros]);

  const renderField = (f: any) => (
    <div key={f.k} style={{ marginBottom: 12 }}>
      <Label>{f.l} {f.u && <span style={{ color: C.border }}>({f.u})</span>}</Label>
      {f.t === "select" ? (
        <select value={p[f.k] || ""} onChange={e => upd(f.k, e.target.value)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontFamily: "inherit", fontSize: 15, padding: "12px 14px", width: "100%", boxSizing: "border-box" }}>
          <option value="">— select —</option>
          {f.opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.t === "textarea" ? (
        <textarea value={p[f.k] || ""} onChange={e => upd(f.k, e.target.value)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: 12, width: "100%", boxSizing: "border-box", height: f.k === "notes" ? 100 : 70, resize: "none", fontFamily: "inherit" }} />
      ) : (
        <Input type={f.t} step={f.t === "number" ? "0.1" : undefined} value={p[f.k] || ""} onChange={e => upd(f.k, e.target.value)} />
      )}
    </div>
  );

  const renderTargetField = (f: any) => {
    const disabled = autoMacros && (f.k === "carb_target_g" || f.k === "fat_target_g");
    return (
      <div key={f.k}>
        <div style={{ fontSize: 12, color: MACRO_COLOR[f.color as keyof typeof MACRO_COLOR] || C.dim, marginBottom: 4, fontWeight: 500 }}>
          {f.l} <span style={{ color: C.border }}>({f.u})</span>
        </div>
        <Input
          type="number"
          value={p[f.k] || ""}
          onChange={e => upd(f.k, e.target.value)}
          disabled={disabled}
          style={disabled ? { opacity: 0.6 } : {}}
        />
      </div>
    );
  };

  return (
    <Modal onClose={onClose} title="Profile">
      <div style={{ fontSize: 14, color: C.dim, marginBottom: 20, lineHeight: 1.5 }}>
        Your profile drives targets, coach advice, and AI feedback.
      </div>

      <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Basics</div>
      {PROFILE_FIELDS.map(renderField)}

      <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Daily Targets</div>

      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: autoMacros ? C.accent + "18" : C.surface, borderRadius: 10,
        padding: 12, marginBottom: 14, cursor: "pointer",
        border: `1px solid ${autoMacros ? C.accent : C.border}`,
      }} onClick={() => setAutoMacros(!autoMacros)}>
        <div style={{
          width: 20, height: 20, borderRadius: 6, background: autoMacros ? C.accent : "transparent",
          border: `2px solid ${autoMacros ? C.accent : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.bg, fontWeight: 900, fontSize: 12, flexShrink: 0,
        }}>{autoMacros && "✓"}</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>
          <strong>Auto-derive carbs & fat</strong> from calories and protein
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Uses 60/40 split of remaining kcal (recommended)</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {TARGET_FIELDS.map(renderTargetField)}
      </div>

      <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Phase</div>
      {PHASE_FIELDS.map(renderField)}

      <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Notes</div>
      <div style={{ marginBottom: 12 }}>
        <Label>Injuries / Limitations</Label>
        <textarea value={p.injuries || ""} onChange={e => upd("injuries", e.target.value)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: 12, width: "100%", boxSizing: "border-box", height: 70, resize: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>Notes for AI</Label>
        <textarea value={p.notes || ""} onChange={e => upd("notes", e.target.value)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: 12, width: "100%", boxSizing: "border-box", height: 100, resize: "none", fontFamily: "inherit" }} />
      </div>

      <Btn color={C.accent} full onClick={() => onSave(p)} style={{ padding: 16, fontSize: 15, marginTop: 10 }}>Save Profile</Btn>
    </Modal>
  );
}
