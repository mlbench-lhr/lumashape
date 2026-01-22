"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/dataTable";

type AdminUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  createdAt?: string;
  avatar?: string;
  profilePic?: string;
  subscriptionPlan?: "Free" | "Pro" | "Premium" | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [proTotal, setProTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

  useEffect(() => {
    const h = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(h);
  }, [input]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : null;
        const q = new URLSearchParams({ page: String(page), limit: String(perPage) });
        if (search) q.set("search", search);
        const res = await fetch(`/api/admin/users?${q.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setUsers(data.users || []);
          setTotal(data.total || 0);
          setProTotal(data.proTotal || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [page, perPage, search]);

  const formatDate = (d?: string) => {
    if (!d) return "-";
    const x = new Date(d);
    return x.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const avatarSrc = (u: AdminUser) => u.avatar || u.profilePic || "/images/icons/logo.svg";

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-2">
        <p className="text-sm text-gray-500">Total Users: {total} | Pro Users: {proTotal}</p>
      </div>
      <DataTable
        title="All Users"
        columns={[
          { id: "firstName", label: "First name" },
          { id: "lastName", label: "Last Name" },
          { id: "username", label: "Username", className: "w-1/3" },
          { id: "subscription", label: "Subscription" },
          { id: "dateJoined", label: "Date Joined" },
          { id: "action", label: "Action" },
        ]}
        rows={users}
        renderCell={(u: AdminUser, col: string) => {
          if (col === "firstName") return <span className="text-gray-800">{u.firstName || "-"}</span>;
          if (col === "lastName") return <span className="text-gray-800">{u.lastName || "-"}</span>;
          if (col === "username") return (
            <div className="flex items-center gap-3 min-w-0">
              <img src={avatarSrc(u)} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 truncate">{u.username || "-"}</div>
                <div className="text-xs text-gray-500 truncate">{u.email || "-"}</div>
              </div>
            </div>
          );
          if (col === "subscription") {
            const isPro = u.subscriptionPlan === "Pro" && (u.subscriptionStatus === "active" || u.subscriptionStatus === "trialing");
            return <span className="text-gray-800">{isPro ? "Pro" : "Free"}</span>;
          }
          if (col === "dateJoined") return <span className="text-gray-800">{formatDate(u.createdAt)}</span>;
          if (col === "action") return (
            <Link href={`/admin/users/${u._id}`} className="text-primary underline">View Details</Link>
          );
          return null;
        }}
        loading={loading}
        searchValue={input}
        onSearchChange={(v: string) => {
          setPage(1);
          setInput(v);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={(p: number) => setPage(p)}
      />
    </div>
  );
}