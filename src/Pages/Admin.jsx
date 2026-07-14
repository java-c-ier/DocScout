import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase";
import { useAuth } from "../AuthContext";

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

function EditModal({ open, onClose, target, onSave, isSelf }) {
  const [role, setRole] = useState(target?.role || "user");
  const [active, setActive] = useState(!target?.blocked);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRole(target?.role || "user");
      setActive(!target?.blocked);
    }
  }, [open, target]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    const updates = target?.provider === "google.com" ? { role } : { role, blocked: !active };
    await onSave(target.uid, updates);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 z-10">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Edit User</h2>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Name</label>
            <p className="text-sm text-gray-800 font-medium">{target?.displayName || "—"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email</label>
            <p className="text-sm text-gray-800">{target?.email}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Role</label>
            <div className="flex gap-3">
              {["user", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    role === r
                      ? r === "admin"
                        ? "bg-blue-50 text-blue-700 border-blue-400"
                        : "bg-green-50 text-green-700 border-green-400"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {r === "admin" ? "Admin" : "User"}
                </button>
              ))}
            </div>
          </div>

          {target?.provider !== "google.com" && (
            <div className="border-t border-gray-100 pt-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Account Status</label>
              <div
                onClick={() => !isSelf && setActive((v) => !v)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition ${
                  isSelf ? "opacity-50 cursor-not-allowed" : ""
                } ${active ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}
              >
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-green-700" : "text-red-700"}`}>
                    {active ? "Active" : "Inactive"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {active ? "User can log in normally." : "User is blocked from logging in."}
                  </p>
                </div>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${active ? "bg-green-500" : "bg-red-400"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${active ? "left-5" : "left-0.5"}`} />
                </div>
              </div>
              {isSelf && <p className="text-xs text-gray-400 mt-1.5">Cannot change status for your own account.</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState(null);

  const fetchUsers = async () => {
    if (!db) return;
    setLoading(true);
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSaveEdit = async (uid, updates) => {
    await updateDoc(doc(db, "users", uid), updates);
    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, ...updates } : u));
  };

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = users.filter((u) => !u.blocked).length;
  const totalInactive = users.filter((u) => u.blocked).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users and roles</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Users" value={users.length} color="text-gray-900" />
          <StatCard label="Active" value={totalActive} color="text-emerald-600" />
          <StatCard label="Inactive" value={totalInactive} color="text-red-500" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-800">All Users</h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-center">Provider</th>
                    <th className="px-6 py-3 text-center">Role</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((u) => (
                    <tr key={u.uid} className={`transition ${u.blocked ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${u.blocked ? "bg-gray-400" : "bg-blue-500"}`}>
                            {(u.displayName || u.email || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <span className={`font-medium ${u.blocked ? "text-gray-400" : "text-gray-800"}`}>{u.displayName || "—"}</span>
                          {u.uid === user?.uid && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">You</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${u.blocked ? "text-gray-400" : "text-gray-600"}`}>{u.email}</td>
                      <td className="px-6 py-4 text-center">
                        {u.provider === "google.com" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-3 w-3 shrink-0">
                              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
                              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8l-6.5 5C9.8 39.7 16.4 44 24 44z" />
                              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41.4 36 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5z" />
                            </svg>
                            Google Account
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email &amp; Password
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}>
                          {u.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          u.blocked
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {u.blocked ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setEditTarget(u)}
                          title="Edit user"
                          className="p-2 rounded-lg text-gray-400 hover:bg-blue-100 hover:text-blue-700 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EditModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        target={editTarget}
        isSelf={editTarget?.uid === user?.uid}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

export default Admin;
