"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function CounselorSignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <button className="btn btn-secondary" type="button" onClick={signOut} disabled={signingOut}>
      <LogOut className="h-4 w-4" />
      로그아웃
    </button>
  );
}
