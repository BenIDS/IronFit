"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?mode=signup");
  }, [router]);
  return (
    <main style={{
      minHeight: "100vh",
      background: "#1A1D1F",
      color: "#8B9299",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
    }}>
      Redirecting…
    </main>
  );
}
