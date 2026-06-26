import { useNavigate } from "react-router-dom";
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
      <span className="font-semibold text-gray-900">Ticket Management</span>
      <div className="flex items-center gap-4">
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
