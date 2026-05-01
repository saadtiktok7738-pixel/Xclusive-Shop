import { useEffect, useState } from "react";
import { db } from "../../lib/firebase.js";
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Crown, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() || {}) })));
    });
    return () => unsub();
  }, []);

  const makeAdmin = async (u) => {
    try {
      await updateDoc(doc(db, "users", u.uid), {
        role: u.role === "admin" ? "user" : "admin",
      });
      toast.success(u.role === "admin" ? "Demoted to user" : "Promoted to admin");
    } catch {
      toast.error("Failed to update");
    }
  };

  const doRemove = async (u) => {
    try {
      await deleteDoc(doc(db, "users", u.uid));
      toast.success("User record deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const remove = (u) => {
    if (u.uid === currentUser?.uid) {
      toast.error("You cannot delete your own account here.");
      return;
    }
    toast(`Delete user ${u.email}?`, {
      description: "Their cart and wishlist data will also be removed.",
      action: { label: "Delete", onClick: () => void doRemove(u) },
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 8000,
    });
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-neutral-500">
            {users.length} users · {users.filter((u) => u.role === "admin").length} admins
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="border border-neutral-300 px-3 py-2 text-sm"
          data-testid="input-user-search"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-200">
            {filtered.map((u) => (
              <tr key={u.uid} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200">
                        <UserIcon className="h-4 w-4 text-neutral-500" />
                      </div>
                    )}
                    <span className="font-medium">{u.name || "—"}</span>
                  </div>
                </td>

                <td className="px-4 py-3 text-neutral-600">{u.email}</td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      u.role === "admin"
                        ? "bg-[#a8e063]/30 text-[#3a6a18]"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {u.role || "user"}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs text-neutral-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => makeAdmin(u)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                        u.role === "admin"
                          ? "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                          : "border-[#56ab2f] text-[#3a6a18] hover:bg-[#a8e063]/10"
                      }`}
                      data-testid={`button-toggle-admin-${u.uid}`}
                    >
                      <Crown className="h-3 w-3" />
                      {u.role === "admin" ? "Remove admin" : "Make admin"}
                    </button>

                    <button
                      onClick={() => remove(u)}
                      disabled={u.uid === currentUser?.uid}
                      className="rounded-md border border-red-300 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                      data-testid={`button-delete-user-${u.uid}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-neutral-400">
        Note: Deleting a user here removes their Firestore record only. Their Firebase Auth identity persists until removed from the Firebase console.
      </p>
    </div>
  );
}