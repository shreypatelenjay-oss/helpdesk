import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Inbox, LayoutDashboard, LogOut, Moon, Sun, Users } from "lucide-react";
import { Role } from "@repo/core";
import { authClient } from "../lib/auth-client";
import { useTheme } from "../lib/theme-provider";

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
};

function NavItem({ to, icon, label, count, active }: NavItemProps) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:no-underline transition-colors ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      }`}
    >
      <span className="opacity-80">{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="min-w-5 rounded-full bg-sidebar-primary/15 px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums text-sidebar-accent-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

function useStatusCounts() {
  const countFor = () =>
    axios
      .get<{ totalCount: number }>("/api/tickets", { params: { pageSize: 1 } })
      .then((r) => r.data.totalCount);

  return useQuery({
    queryKey: ["tickets", "counts"],
    queryFn: async () => ({ total: await countFor() }),
  });
}

export function Navbar() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: counts } = useStatusCounts();
  const { theme, toggleTheme } = useTheme();

  const isAdmin = (session?.user as any)?.role === Role.ADMIN;
  const onTickets = location.pathname === "/tickets";

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  const items = (
    <>
      <NavItem
        to="/"
        icon={<LayoutDashboard className="size-4" />}
        label="Dashboard"
        active={location.pathname === "/"}
      />
      <NavItem
        to="/tickets"
        icon={<Inbox className="size-4" />}
        label="Inbox"
        count={counts?.total}
        active={onTickets}
      />
      {isAdmin && (
        <>
          <div className="mx-3 my-3 border-t border-sidebar-border" />
          <NavItem
            to="/users"
            icon={<Users className="size-4" />}
            label="Users"
            active={location.pathname === "/users"}
          />
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-20 w-60 flex-col bg-sidebar border-r border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-2 px-5 pt-6 pb-5 hover:no-underline"
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            ◆
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-primary">
            Helpdesk
          </span>
        </Link>
        <nav className="flex-1 space-y-0.5 px-2.5" aria-label="Main">
          {items}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <p className="truncate text-sm text-sidebar-primary">
            {session?.user?.name ?? session?.user?.email}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="inline-flex items-center gap-1.5 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <nav className="md:hidden flex items-center justify-between gap-3 bg-sidebar px-4 py-3">
        <Link to="/" className="flex items-center gap-2 hover:no-underline">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
            ◆
          </span>
          <span className="text-sm font-semibold text-sidebar-primary">Helpdesk</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/tickets" className="text-sm text-sidebar-foreground hover:text-sidebar-accent-foreground hover:no-underline">
            Tickets
          </Link>
          {isAdmin && (
            <Link to="/users" className="text-sm text-sidebar-foreground hover:text-sidebar-accent-foreground hover:no-underline">
              Users
            </Link>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </nav>
    </>
  );
}
