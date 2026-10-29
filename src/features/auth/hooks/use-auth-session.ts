"use client";

import { useContext } from "react";
import { AuthSessionContext } from "../components/auth-session-provider";

export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error("useAuthSession requires AuthSessionProvider");
  return session;
}
