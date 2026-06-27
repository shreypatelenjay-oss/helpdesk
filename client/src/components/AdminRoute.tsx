import { Navigate } from "react-router-dom";
import { Role } from "@repo/core";
import { authClient } from "../lib/auth-client";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if ((session.user as any).role !== Role.ADMIN) return <Navigate to="/" replace />;
  return <>{children}</>;
}
