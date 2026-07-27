"use client";

import React from "react";
import { C } from "@/lib/constants";

// ═══════════════════════════════════════════════════════════════
// Buttons — Bold: chunkier padding, heavier weights, no borders,
// active scale, subtle warm shadow on primary
// ═══════════════════════════════════════════════════════════════

type BtnProps = {
  color?: string;
  ghost?: boolean;
  full?: boolean;
  sm?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  type?: "button" | "submit";
  disabled?: boolean;
};

export const Btn = ({ color = C.accent, ghost, full, sm, onClick, children, style, type = "button", disabled }: BtnProps) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{
    background: ghost ? "transparent" : color,
    color: ghost ? color : "#0F0E0D",
    border: ghost ? `1.5px solid ${color}` : "none",
    borderRadius: sm ? 12 : 16,
    padding: sm ? "11px 16px" : "16px 22px",
    fontSize: sm ? 13 : 15,
    fontWeight: 800,
    letterSpacing: sm ? 0.2 : 0.1,
    cursor: disabled ? "not-allowed" : "pointer",
    width: full ? "100%" : "auto",
    opacity: disabled ? 0.4 : 1,
    boxShadow: !ghost && color === C.accent && !disabled
      ? "0 6px 20px -4px rgba(255,91,58,0.35)"
      : undefined,
    fontFamily: "inherit",
    ...style,
  }}>{children}</button>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = (p: InputProps) => (
  <input {...p} style={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 15,
    fontWeight: 500,
    padding: "13px 15px",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    ...p.style,
  }} />
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 12,
    color: C.muted,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  }}>{children}</div>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 12,
    letterSpacing: 1.5,
    color: C.textHi,
    textTransform: "uppercase",
    fontWeight: 800,
    marginBottom: 12,
    marginTop: 8,
  }}>{children}</div>
);

// ═══════════════════════════════════════════════════════════════
// Card — subtly warm-tinted, rounder corners, no left-bar by default
// (accent shows as top glow instead — more modern than a stripe)
// ═══════════════════════════════════════════════════════════════

type CardProps = {
  accent?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export const Card = ({ accent, children, style, onClick }: CardProps) => (
  <div onClick={onClick} style={{
    background: C.card,
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    padding: "20px 22px",
    marginBottom: 12,
    cursor: onClick ? "pointer" : "default",
    position: "relative",
    overflow: "hidden",
    // Accent shows as a thin top-glow strip when specified
    ...(accent ? {
      boxShadow: `inset 0 2px 0 0 ${accent}`,
    } : {}),
    ...style,
  }}>{children}</div>
);

// ═══════════════════════════════════════════════════════════════
// Stat — bigger numbers with tighter tracking (uses .num class)
// ═══════════════════════════════════════════════════════════════

type StatProps = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  color?: string;
  delta?: string | null;
};

export const Stat = ({ label, value, unit, color, delta }: StatProps) => (
  <div style={{ textAlign: "center", padding: "12px 4px" }}>
    <div className="num" style={{
      fontSize: 28,
      fontWeight: 700,
      color: color || C.textHi,
      lineHeight: 1,
    }}>
      {value}
      {unit && <span style={{ fontSize: 13, color: C.muted, marginLeft: 3, fontWeight: 500 }}>{unit}</span>}
    </div>
    <div style={{
      fontSize: 11,
      color: C.muted,
      marginTop: 8,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1,
    }}>{label}</div>
    {delta != null && (
      <div className="num" style={{
        fontSize: 12,
        color: delta.startsWith("-") ? C.green : delta.startsWith("+") ? C.red : C.dim,
        marginTop: 4,
        fontWeight: 600,
      }}>{delta}</div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// Modal — same behaviour, warmer surface, chunkier close button
// ═══════════════════════════════════════════════════════════════

type ModalProps = {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export const Modal = ({ onClose, title, children }: ModalProps) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    zIndex: 100, display: "flex", alignItems: "flex-end",
    animation: "fadeIn 0.2s ease-out",
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: C.card,
      borderRadius: "28px 28px 0 0",
      width: "100%", maxHeight: "92vh", overflowY: "auto",
      padding: "24px 22px",
      border: `1px solid ${C.border}`,
      borderBottom: "none",
      paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
      boxShadow: "0 -10px 40px rgba(0,0,0,0.4)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }}>{title}</div>
        <button onClick={onClose} style={{
          background: C.surface, border: `1px solid ${C.border}`, color: C.dim,
          cursor: "pointer", fontSize: 16, fontFamily: "inherit", fontWeight: 700,
          width: 38, height: 38, borderRadius: 19, padding: 0,
        }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// IconBtn — chunky icon + label button for Quick Log grid
// Optional 'icon' prop takes an SVG element
// ═══════════════════════════════════════════════════════════════

type IconBtnProps = {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  color?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
};

export const IconBtn = ({ icon, label, primary, color = C.accent, onClick, style }: IconBtnProps) => (
  <button onClick={onClick} style={{
    background: primary ? color : C.card,
    color: primary ? "#0F0E0D" : C.text,
    border: primary ? "none" : `1px solid ${C.border}`,
    borderRadius: 18,
    padding: "18px 16px",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0.1,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    boxShadow: primary
      ? "0 6px 20px -4px rgba(255,91,58,0.35)"
      : undefined,
    ...style,
  }}>
    <span style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon}
    </span>
    <span>{label}</span>
  </button>
);

// ═══════════════════════════════════════════════════════════════
// Icon set — thick outline (2.5px stroke) to match Bold aesthetic
// Import individually: <Icon.Workout />, <Icon.Meal />, etc.
// ═══════════════════════════════════════════════════════════════

export const Icon = {
  Workout: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12l-1 4H7L6 4z" />
      <path d="M7 8v13h10V8" />
      <path d="M10 12v6M14 12v6" />
    </svg>
  ),
  Meal: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a3 3 0 013-3h10a3 3 0 013 3v0a3 3 0 01-3 3H7a3 3 0 01-3-3z" />
      <path d="M9 9V6a3 3 0 016 0v3" />
      <path d="M9 15v3M15 15v3" />
    </svg>
  ),
  Scan: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  Body: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Camera: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Water: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s5 6 5 11a5 5 0 0 1-10 0c0-5 5-11 5-11z" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  ),
};

export const mono = "'Space Grotesk', 'JetBrains Mono', 'SF Mono', Menlo, monospace";
