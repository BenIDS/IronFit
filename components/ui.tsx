"use client";

import React from "react";
import { C } from "@/lib/constants";

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
    color: ghost ? color : "#1A1D1F",
    border: ghost ? `1.5px solid ${color}` : "none",
    borderRadius: 12,
    padding: sm ? "10px 16px" : "14px 20px",
    fontSize: sm ? 13 : 15,
    fontWeight: 600,
    letterSpacing: 0.2,
    cursor: disabled ? "not-allowed" : "pointer",
    width: full ? "100%" : "auto",
    opacity: disabled ? 0.5 : 1,
    ...style,
  }}>{children}</button>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = (p: InputProps) => (
  <input {...p} style={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 15,
    padding: "12px 14px",
    width: "100%",
    boxSizing: "border-box",
    ...p.style,
  }} />
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 13, color: C.dim, fontWeight: 500, marginBottom: 8 }}>{children}</div>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 12, letterSpacing: 1.5, color: C.muted,
    textTransform: "uppercase", fontWeight: 600,
    marginBottom: 10, marginTop: 4,
  }}>{children}</div>
);

type CardProps = {
  accent?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export const Card = ({ accent, children, style, onClick }: CardProps) => (
  <div onClick={onClick} style={{
    background: C.card,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    borderLeft: accent ? `4px solid ${accent}` : `1px solid ${C.border}`,
    padding: "18px 20px",
    marginBottom: 14,
    cursor: onClick ? "pointer" : "default",
    ...style,
  }}>{children}</div>
);

type StatProps = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  color?: string;
  delta?: string | null;
};

export const Stat = ({ label, value, unit, color, delta }: StatProps) => (
  <div style={{ textAlign: "center", padding: "10px 4px" }}>
    <div className="num" style={{ fontSize: 26, fontWeight: 700, color: color || C.textHi, lineHeight: 1, letterSpacing: -0.5 }}>
      {value}<span style={{ fontSize: 13, color: C.muted, marginLeft: 3, fontWeight: 500 }}>{unit}</span>
    </div>
    <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontWeight: 500 }}>{label}</div>
    {delta != null && (
      <div className="num" style={{
        fontSize: 12,
        color: delta.startsWith("-") ? C.green : delta.startsWith("+") ? C.red : C.dim,
        marginTop: 4, fontWeight: 600,
      }}>{delta}</div>
    )}
  </div>
);

type ModalProps = {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export const Modal = ({ onClose, title, children }: ModalProps) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    zIndex: 100, display: "flex", alignItems: "flex-end",
    animation: "fadeIn 0.2s ease-out",
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: C.card,
      borderRadius: "24px 24px 0 0",
      width: "100%", maxHeight: "92vh", overflowY: "auto",
      padding: "24px 22px",
      border: `1px solid ${C.border}`,
      borderBottom: "none",
      paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{title}</div>
        <button onClick={onClose} style={{
          background: C.surface, border: `1px solid ${C.border}`, color: C.dim,
          cursor: "pointer", fontSize: 18,
          width: 36, height: 36, borderRadius: 18, padding: 0,
        }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

export const mono = "'JetBrains Mono', 'SF Mono', Menlo, monospace";
