import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

function axiosError(e: unknown, fallback: string) {
  return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}

export function UsersPage() {
  const qc = useQueryClient();
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const { data: users, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => axios.get<User[]>("/api/users").then((r) => r.data),
  });

  const createUser = useMutation({
    mutationFn: (body: FormState) => axios.post<User>("/api/users", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setForm(INITIAL_FORM);
      setFormVisible(false);
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (e) => alert(axiosError(e, "Failed to delete user")),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(form);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <Button onClick={() => { setFormVisible((v) => !v); createUser.reset(); }}>
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
                {createUser.isError && (
                  <p className="text-sm text-destructive">{axiosError(createUser.error, "Failed to create user")}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? "Creating…" : "Create user"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isPending && <p className="text-gray-500 text-sm">Loading…</p>}
        {error && <p className="text-destructive text-sm">{axiosError(error, "Failed to load users")}</p>}

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
                          disabled={deleteUser.isPending && deleteUser.variables === user.id}
                          onClick={() => deleteUser.mutate(user.id)}
                        >
                          {deleteUser.isPending && deleteUser.variables === user.id ? "Deleting…" : "Delete"}
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
