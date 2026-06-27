import { useState } from "react";
import { z } from "zod";
import { Role, createUserSchema, editUserSchema } from "@repo/core";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { CreateUserModal } from "../components/CreateUserModal";
import { EditUserModal } from "../components/EditUserModal";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
};

type FormValues = z.infer<typeof createUserSchema>;
type EditFormValues = z.infer<typeof editUserSchema>;

function axiosError(e: unknown, fallback: string) {
  return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}

export function UsersPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const { data: users, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => axios.get<User[]>("/api/users").then((r) => r.data),
  });

  const createUser = useMutation({
    mutationFn: (body: FormValues) => axios.post<User>("/api/users", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
    },
  });

  const editUser = useMutation({
    mutationFn: (body: EditFormValues) =>
      axios.patch<User>(`/api/users/${editTarget!.id}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditTarget(null);
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (e) => alert(axiosError(e, "Failed to delete user")),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <Button onClick={() => { createUser.reset(); setModalOpen(true); }}>Add user</Button>
        </div>

        <CreateUserModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSubmit={(data) => createUser.mutate(data)}
          isPending={createUser.isPending}
          error={createUser.isError ? axiosError(createUser.error, "Failed to create user") : null}
        />

        {editTarget && (
          <EditUserModal
            open={true}
            onOpenChange={(open) => { if (!open) { setEditTarget(null); editUser.reset(); } }}
            onSubmit={(data) => editUser.mutate(data)}
            isPending={editUser.isPending}
            error={editUser.isError ? axiosError(editUser.error, "Failed to update user") : null}
            user={editTarget}
          />
        )}

        {error && <p className="text-destructive text-sm">{axiosError(error, "Failed to load users")}</p>}

        {isPending ? (
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
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : users && (
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
                            user.role === Role.ADMIN
                              ? "bg-violet-100 text-violet-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role === Role.ADMIN ? "Admin" : "Agent"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => { editUser.reset(); setEditTarget(user); }}
                          >
                            <PencilIcon className="size-3" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            disabled={deleteUser.isPending && deleteUser.variables === user.id}
                            onClick={() => deleteUser.mutate(user.id)}
                          >
                            {deleteUser.isPending && deleteUser.variables === user.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
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
