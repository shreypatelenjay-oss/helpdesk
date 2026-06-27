import { useNavigate, Link } from "react-router-dom";
import { Role } from "@repo/core";
import { authClient } from "../lib/auth-client";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <Link to="/" className="font-semibold text-gray-900">Ticket Management</Link>
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
          Tickets
        </Link>
        {(session?.user as any)?.role === Role.ADMIN && (
          <Link to="/users" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
            Users
          </Link>
        )}
        <span className="text-sm text-gray-700">
          {session?.user?.name ?? session?.user?.email}
        </span>
        <button
          onClick={handleSignOut}
          className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
