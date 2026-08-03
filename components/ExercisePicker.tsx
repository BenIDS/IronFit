"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, Btn, Input, Label } from "./ui";
import { C, MACRO_COLORS } from "@/lib/constants";
import { exerciseImageUrl, filterExercises, findExerciseId } from "@/lib/exercises";
import type { ExerciseSlim } from "@/lib/exercises";

// ═══════════════════════════════════════════════════════════════
// Common lifts grid — always shown at the top of the picker.
// These are the highest-value lifts users add mid-session.
// Icon is the primary muscle emoji for quick scanning.
// ═══════════════════════════════════════════════════════════════

const COMMON_LIFTS: Array<{ name: string; muscle: string; icon: string }> = [
  { name: "Barbell Bench Press", muscle: "chest", icon: "🏋️" },
  { name: "Incline DB Press", muscle: "chest", icon: "📈" },
  { name: "Dumbbell Fly", muscle: "chest", icon: "🦋" },
  { name: "Overhead Press", muscle: "shoulders", icon: "🔝" },
  { name: "Lateral Raises", muscle: "shoulders", icon: "↔️" },
  { name: "Face Pulls", muscle: "shoulders", icon: "🎯" },
  { name: "Tricep Pushdown", muscle: "triceps", icon: "🔻" },
  { name: "Skullcrusher", muscle: "triceps", icon: "💀" },
  { name: "Deadlift", muscle: "back", icon: "🏋️" },
  { name: "Barbell Row", muscle: "back", icon: "🚣" },
  { name: "Lat Pulldown", muscle: "back", icon: "⬇️" },
  { name: "Pull-Up", muscle: "back", icon: "🆙" },
  { name: "Barbell Curl", muscle: "biceps", icon: "💪" },
  { name: "Hammer Curl", muscle: "biceps", icon: "🔨" },
  { name: "Shrugs", muscle: "traps", icon: "🤷" },
  { name: "Squat", muscle: "quads", icon: "🦵" },
  { name: "Front Squat", muscle: "quads", icon: "🦵" },
  { name: "Leg Press", muscle: "quads", icon: "🦿" },
  { name: "Leg Extension", muscle: "quads", icon: "⚡" },
  { name: "Romanian Deadlift", muscle: "hamstrings", icon: "🏋️" },
  { name: "Hamstring Curl", muscle: "hamstrings", icon: "🌀" },
  { name: "Hip Thrust", muscle: "glutes", icon: "🍑" },
  { name: "Calf Raise", muscle: "calves", icon: "🦶" },
  { name: "Plank", muscle: "core", icon: "🧘" },
];

// ═══════════════════════════════════════════════════════════════
// Picked exercise shape — matches what WorkoutForm expects
// ═══════════════════════════════════════════════════════════════

export type PickedExercise = {
  name: string;
  exerciseId?: string; // catalog ID if matched — enables demo images
};

type Props = {
  onPick: (ex: PickedExercise) => void;
  onClose: () => void;
  excludeNames?: string[]; // exercises already in the session — hidden from grid
};

export function ExercisePicker({ onPick, onClose, excludeNames = [] }: Props) {
  const [catalog, setCatalog] = useState<ExerciseSlim[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const catalogRef = useRef<ExerciseSlim[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/exercises");
        if (!res.ok) throw new Error("Could not load exercise catalog");
        const data = await res.json();
        if (cancelled) return;
        catalogRef.current = data.exercises || [];
        setCatalog(catalogRef.current);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const excludeSet = new Set(excludeNames.map(n => n.toLowerCase()));
  const searchResults = catalog && query.trim() ? filterExercises(catalog, query, 20) : [];

  const pickCommon = (name: string) => {
    // Try to find catalog ID from name; if we do, look up the actual catalog entry to keep the DB name
    const id = findExerciseId(name);
    if (id && catalog) {
      const found = catalog.find(e => e.id === id);
      if (found) return onPick({ name: found.name, exerciseId: found.id });
    }
    // Fallback: pass name only (no demo images)
    onPick({ name });
  };

  const pickCatalog = (ex: ExerciseSlim) => {
    onPick({ name: ex.name, exerciseId: ex.id });
  };

  const pickCustom = () => {
    const name = customName.trim();
    if (!name) return;
    // Try to auto-match the custom string too
    const lower = name.toLowerCase();
    const match = catalog?.find(e => e.name.toLowerCase() === lower);
    if (match) return onPick({ name: match.name, exerciseId: match.id });
    onPick({ name });
  };

  return (
    <Modal onClose={onClose} title="Add exercise">
      {/* Search bar (always visible) */}
      <Label>Search full catalog</Label>
      <Input
        type="search"
        placeholder="e.g. dumbbell fly, cable, glute..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoFocus
        style={{ marginBottom: 14 }}
      />

      {loading && (
        <div style={{ textAlign: "center", padding: 20, color: C.muted, fontSize: 13 }}>
          <span className="spinner" /> Loading catalog…
        </div>
      )}

      {error && (
        <div style={{
          background: C.surface, border: `1px solid ${C.red}`, borderRadius: 10,
          padding: 12, fontSize: 13, color: C.dim, marginBottom: 14,
        }}>
          ⚠ {error} — try the grid or custom entry below.
        </div>
      )}

      {/* Search results */}
      {!loading && query.trim() && searchResults.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            {searchResults.length} match{searchResults.length === 1 ? "" : "es"}
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {searchResults.map(ex => (
              <button key={ex.id} onClick={() => pickCatalog(ex)} style={{
                display: "flex", gap: 12, alignItems: "center", width: "100%",
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: 10, marginBottom: 8, cursor: "pointer", fontFamily: "inherit",
                textAlign: "left",
              }}>
                {ex.images[0] && (
                  <img
                    src={exerciseImageUrl(ex.images[0])} alt=""
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", background: C.bg }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ex.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: "flex", gap: 8 }}>
                    {ex.primaryMuscles.slice(0, 2).map(m => (
                      <span key={m} style={{ textTransform: "capitalize" }}>{m}</span>
                    ))}
                    {ex.equipment && <span style={{ color: MACRO_COLORS.protein, textTransform: "capitalize" }}>{ex.equipment}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && query.trim() && searchResults.length === 0 && (
        <div style={{
          background: C.surface, borderRadius: 10, padding: 14,
          fontSize: 13, color: C.dim, marginBottom: 20, textAlign: "center",
        }}>
          No matches for &ldquo;{query}&rdquo;. Use custom entry below.
        </div>
      )}

      {/* Common lifts grid — hide when actively searching */}
      {!loading && !query.trim() && (
        <>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            Common lifts
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 20,
          }}>
            {COMMON_LIFTS.filter(l => !excludeSet.has(l.name.toLowerCase())).map(lift => (
              <button
                key={lift.name}
                onClick={() => pickCommon(lift.name)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: "12px 8px", cursor: "pointer", fontFamily: "inherit",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  minHeight: 78,
                }}
              >
                <span style={{ fontSize: 18 }}>{lift.icon}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: C.text, textAlign: "center", lineHeight: 1.2,
                }}>{lift.name}</span>
                <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {lift.muscle}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom entry — always available */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        paddingTop: 16, marginTop: 6,
      }}>
        <Label>Or type a custom name</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            type="text"
            placeholder="e.g. Zottman curl"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") pickCustom(); }}
          />
          <Btn color={C.accent} onClick={pickCustom} disabled={!customName.trim()}>Add</Btn>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>
          Custom exercises won&rsquo;t have demo images unless the name matches the catalog.
        </div>
      </div>
    </Modal>
  );
}
