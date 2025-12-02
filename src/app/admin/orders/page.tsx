"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/dataTable";

type AdminOrder = {
  _id: string;
  buyerEmail: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  total: number;
  itemsCount: number;
};

export default function AdminAllOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
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
        const res = await fetch(`/api/admin/orders?${q.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders || []);
          setTotal(data.total || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [page, perPage, search]);

  const shortId = (id: string) => `ORD-${id.slice(-6).toUpperCase()}`;
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-";
  const currency = (n: number) => `$${(n ?? 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-2">
        <p className="text-sm text-gray-500">Total Orders: {total}</p>
      </div>
      <DataTable
        title="All Orders"
        columns={[
          { id: "orderId", label: "Order ID" },
          { id: "dateOrdered", label: "Date Ordered" },
          { id: "amount", label: "Amount" },
          { id: "action", label: "Action" },
        ]}
        rows={orders}
        renderCell={(o: AdminOrder, col: string) => {
          if (col === "orderId") return <span className="text-gray-800">{shortId(o._id)}</span>;
          if (col === "dateOrdered") return <span className="text-gray-800">{formatDate(o.createdAt)}</span>;
          if (col === "amount") return <span className="text-gray-900 font-medium">{currency(o.total)}</span>;
          if (col === "action") return <Link href={`/admin/orders/${o._id}`} className="text-primary underline">View Details</Link>;
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