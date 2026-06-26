import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "AGENT";
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "AGENT";
};

const INITIAL_FORM: FormState = { name: "", email: "", password: "", role: "AGENT" };

function useUsers() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, fetchUsers, setUsers };
}

export function UsersPage() {
  const { users, loading, error, fetchUsers, setUsers } = useUsers();
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch on first render
  useState(() => { fetchUsers(); });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create user");
      setUsers((prev) => (prev ? [...prev, data] : [data]));
      setForm(INITIAL_FORM);
      setFormVisible(false);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete user");
      }
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== id) : prev));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <Button onClick={() => { setFormVisible((v) => !v); setFormError(null); }}>
            {formVisible ? "Cancel" : "Add user"}
          </Button>
        </div>

        {formVisible && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New user</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "ADMIN" | "AGENT" }))}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating…" : "Create user"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading && <p className="text-gray-500 text-sm">Loading…</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}

        {users && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                        No users yet.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{user.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.role === "ADMIN"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role === "ADMIN" ? "Admin" : "Agent"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="destructive"
                          size="xs"
                          disabled={deletingId === user.id}
                          onClick={() => handleDelete(user.id)}
                        >
                          {deletingId === user.id ? "Deleting…" : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
