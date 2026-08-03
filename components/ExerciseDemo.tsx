"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/constants";
import { exerciseImageUrl } from "@/lib/exercises";
import type { Exercise } from "@/lib/exercises";

// Shared in-memory cache — prevents refetching the same exercise
// across multiple sets in one session.
const detailCache = new Map<string, Exercise>();

type Props = {
  exerciseId: string;
  exerciseName?: string;
  onClose?: () => void;
};

export function ExerciseDemo({ exerciseId, exerciseName, onClose }: Props) {
  const [exercise, setExercise] = useState<Exercise | null>(detailCache.get(exerciseId) || null);
  const [loading, setLoading] = useState(!detailCache.has(exerciseId));
  const [error, setError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState<0 | 1>(0);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (detailCache.has(exerciseId)) {
      setExercise(detailCache.get(exerciseId)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/exercises/${exerciseId}`);
        if (!res.ok) throw new Error("Could not load demo");
        const data = await res.json();
        if (cancelled) return;
        detailCache.set(exerciseId, data.exercise);
        setExercise(data.exercise);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [exerciseId]);

  // Auto-cycle start/end at 1.5s intervals — gives that "GIF-like" feel
  // without hosting GIFs. Pause when instructions are open.
  useEffect(() => {
    if (!exercise || instructionsOpen) return;
    const t = setInterval(() => setImgIdx(i => (i === 0 ? 1 : 0)), 1500);
    return () => clearInterval(t);
  }, [exercise, instructionsOpen]);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      animation: "fadeIn 0.2s ease-out",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{
          fontSize: 11, color: C.accent, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
        }}>
          Demo{exerciseName ? ` — ${exerciseName}` : ""}
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: C.muted,
            cursor: "pointer", fontSize: 14, padding: "2px 6px", fontFamily: "inherit",
          }} aria-label="Close demo">✕</button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 20, color: C.muted, fontSize: 12 }}>
          <span className="spinner" /> Loading…
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: C.dim, padding: "8px 4px" }}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && exercise && (
        <>
          {/* Image pair — animate by swapping which is highlighted */}
          {exercise.images.length >= 1 ? (
            <div style={{ position: "relative", background: "#000", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3" }}>
                <img
                  src={exerciseImageUrl(exercise.images[0])}
                  alt={`${exercise.name} — start`}
                  style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                    opacity: imgIdx === 0 ? 1 : 0, transition: "opacity 0.4s",
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {exercise.images[1] && (
                  <img
                    src={exerciseImageUrl(exercise.images[1])}
                    alt={`${exercise.name} — end`}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                      opacity: imgIdx === 1 ? 1 : 0, transition: "opacity 0.4s",
                    }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{
                  position: "absolute", bottom: 6, right: 8,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  fontSize: 10, padding: "3px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5,
                }}>
                  {imgIdx === 0 ? "START" : "END"}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 12, color: C.muted, fontSize: 12, textAlign: "center" }}>
              No images available for this exercise.
            </div>
          )}

          {/* Muscle chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {exercise.primaryMuscles.map(m => (
              <span key={m} style={{
                background: C.accent + "22", color: C.accent,
                fontSize: 10, padding: "3px 8px", borderRadius: 10,
                fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
              }}>{m}</span>
            ))}
            {exercise.secondaryMuscles.slice(0, 3).map(m => (
              <span key={m} style={{
                background: C.card, color: C.dim,
                fontSize: 10, padding: "3px 8px", borderRadius: 10,
                fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
                border: `1px solid ${C.border}`,
              }}>{m}</span>
            ))}
            {exercise.equipment && (
              <span style={{
                background: C.card, color: C.blue,
                fontSize: 10, padding: "3px 8px", borderRadius: 10,
                fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                border: `1px solid ${C.border}`,
              }}>{exercise.equipment}</span>
            )}
          </div>

          {/* Instructions — collapsed by default */}
          {exercise.instructions.length > 0 && (
            <>
              <button
                onClick={() => setInstructionsOpen(o => !o)}
                style={{
                  background: "transparent", border: "none", color: C.dim,
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                  padding: "4px 0", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span>{instructionsOpen ? "▾" : "▸"}</span>
                {instructionsOpen ? "Hide instructions" : `Show instructions (${exercise.instructions.length})`}
              </button>
              {instructionsOpen && (
                <ol style={{
                  margin: "8px 0 4px",
                  padding: "0 0 0 18px",
                  fontSize: 12,
                  color: C.dim,
                  lineHeight: 1.5,
                }}>
                  {exercise.instructions.map((step, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{step}</li>
                  ))}
                </ol>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
